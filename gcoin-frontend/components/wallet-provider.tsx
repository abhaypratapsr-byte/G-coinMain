"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { ethers } from "ethers";
import type { WalletState } from "@/types";
import { toast } from "sonner";
import { usePrivy, useWallets } from "@privy-io/react-auth";

const CONTRACT_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function mint(address to, uint256 amount)",
  "function burn(address from, uint256 amount)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
];

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0xa08862c6eaBBF4a8527B1C7abd9E3FE38A2d943f";
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://polygon-rpc.com";
const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "137");

interface WalletContextType extends WalletState {
  provider: ethers.BrowserProvider | ethers.JsonRpcProvider | null;
  contract: ethers.Contract | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { authenticated, user } = usePrivy();
  const { wallets } = useWallets();

  const [state, setState] = useState<WalletState>({
    address: null,
    balance: "0",
    chainId: null,
    isConnecting: false,
    isConnected: false,
    error: null,
  });

  const [provider, setProvider] = useState<ethers.BrowserProvider | ethers.JsonRpcProvider | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);

  const updateBalance = useCallback(async (
    address: string,
    prov: ethers.BrowserProvider | ethers.JsonRpcProvider
  ) => {
    try {
      const code = await prov.getCode(CONTRACT_ADDRESS);
      if (code === "0x") {
        setState((prev) => ({ ...prev, balance: "0" }));
        return;
      }
      const ctr = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, prov);
      const bal = await ctr.balanceOf(address);
      const decimals = await ctr.decimals();
      setState((prev) => ({ ...prev, balance: ethers.formatUnits(bal, decimals) }));
    } catch (err) {
      console.error("Balance fetch error:", err);
      setState((prev) => ({ ...prev, balance: "0" }));
    }
  }, []);

  // ─── Auto-connect when Privy wallets are ready ───────────────────────────
  useEffect(() => {
    if (!authenticated || !wallets || wallets.length === 0) return;

    const autoConnect = async () => {
      // Prefer MetaMask/injected wallet, fall back to Privy embedded wallet
      const injected = wallets.find((w) => w.walletClientType === "metamask")
        || wallets.find((w) => w.walletClientType !== "privy");
      const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");

      const activeWallet = injected || embeddedWallet;
      if (!activeWallet) return;

      setState((prev) => ({ ...prev, isConnecting: true }));

      try {
        // Switch to correct chain
        await activeWallet.switchChain(CHAIN_ID);

        // Get EIP-1193 provider from Privy wallet
        const eip1193 = await activeWallet.getEthereumProvider();
        const prov = new ethers.BrowserProvider(eip1193);
        const address = activeWallet.address;

        setProvider(prov);
        const ctr = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, prov);
        setContract(ctr);

        setState({
          address,
          balance: "0",
          chainId: CHAIN_ID,
          isConnecting: false,
          isConnected: true,
          error: null,
        });

        await updateBalance(address, prov);

        const walletType = activeWallet.walletClientType === "privy"
          ? "Embedded wallet"
          : activeWallet.walletClientType;
        toast.success(`${walletType} connected`, {
          description: `${address.slice(0, 6)}...${address.slice(-4)}`,
        });
      } catch (err: any) {
        console.error("Auto-connect error:", err);
        setState((prev) => ({
          ...prev,
          isConnecting: false,
          error: err.message,
        }));
      }
    };

    autoConnect();
  }, [authenticated, wallets, updateBalance]);

  // ─── Manual connect (for unauthenticated / MetaMask-only users) ──────────
  const connect = useCallback(async () => {
    // If already handled by Privy wallets auto-connect above, skip
    if (authenticated && wallets.length > 0) return;

    if (typeof window === "undefined") return;
    const ethereum = (window as any).ethereum;

    if (!ethereum) {
      toast.error("No wallet detected", {
        description: "Please install MetaMask or log in with Google.",
        action: {
          label: "Get MetaMask",
          onClick: () => window.open("https://metamask.io/download/", "_blank"),
        },
      });
      return;
    }

    setState((prev) => ({ ...prev, isConnecting: true, error: null }));
    toast.info("Connecting wallet...");

    try {
      const prov = new ethers.BrowserProvider(ethereum, {
        name: "Polygon",
        chainId: CHAIN_ID,
      });

      const accounts: string[] = await prov.send("eth_requestAccounts", []);
      if (!accounts || accounts.length === 0) throw new Error("No accounts found");

      const network = await prov.getNetwork();
      if (Number(network.chainId) !== CHAIN_ID) {
        toast.info("Switching to Polygon...");
        try {
          await ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: `0x${CHAIN_ID.toString(16)}` }],
          });
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            await ethereum.request({
              method: "wallet_addEthereumChain",
              params: [{
                chainId: `0x${CHAIN_ID.toString(16)}`,
                chainName: "Polygon Mainnet",
                nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
                rpcUrls: [RPC_URL],
                blockExplorerUrls: ["https://polygonscan.com"],
              }],
            });
          } else throw switchError;
        }
      }

      const address = accounts[0];
      setProvider(prov);
      const ctr = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, prov);
      setContract(ctr);

      setState({ address, balance: "0", chainId: CHAIN_ID, isConnecting: false, isConnected: true, error: null });
      toast.success("Wallet connected!", { description: `${address.slice(0, 6)}...${address.slice(-4)}` });
      await updateBalance(address, prov);
    } catch (err: any) {
      console.error("Connect error:", err);
      setState((prev) => ({ ...prev, isConnecting: false, error: err.message }));
      if (err.code !== 4001) toast.error("Connection failed", { description: err.message });
    }
  }, [authenticated, wallets, updateBalance]);

  const disconnect = useCallback(() => {
    setProvider(null);
    setContract(null);
    setState({ address: null, balance: "0", chainId: null, isConnecting: false, isConnected: false, error: null });
    toast.info("Wallet disconnected");
  }, []);

  // ─── Disconnect when Privy logs out ──────────────────────────────────────
  useEffect(() => {
    if (!authenticated && state.isConnected) {
      disconnect();
    }
  }, [authenticated, state.isConnected, disconnect]);

  const refreshBalance = useCallback(async () => {
    if (state.address && provider) {
      await updateBalance(state.address, provider);
    }
  }, [state.address, provider, updateBalance]);

  return (
    <WalletContext.Provider value={{ ...state, provider, contract, connect, disconnect, refreshBalance }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWalletContext() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWalletContext must be used within a WalletProvider");
  }
  return context;
}