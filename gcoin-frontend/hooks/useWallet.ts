"use client";

import { useState, useCallback, useEffect } from "react";
import { ethers } from "ethers";
import type { WalletState } from "@/types";
import { toast } from "sonner";

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

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    address: null,
    balance: "0",
    chainId: null,
    isConnecting: false,
    isConnected: false,
    error: null,
  });

  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);

  const updateBalance = useCallback(async (address: string, prov: ethers.BrowserProvider) => {
    try {
      const code = await prov.getCode(CONTRACT_ADDRESS);
      if (code === "0x") {
        setState((prev) => ({ ...prev, balance: "0" }));
        return;
      }
      const ctr = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, prov);
      const bal = await ctr.balanceOf(address);
      const decimals = await ctr.decimals();
      const formatted = ethers.formatUnits(bal, decimals);
      setState((prev) => ({ ...prev, balance: formatted }));
    } catch (err: any) {
      console.error("Balance fetch error:", err);
      setState((prev) => ({ ...prev, balance: "0" }));
    }
  }, []);

  const connect = useCallback(async () => {
    if (typeof window === "undefined") {
      toast.error("Wallet connection only works in browser");
      return;
    }

    const ethereum = (window as any).ethereum;
    if (!ethereum) {
      toast.error("No wallet detected", {
        description: "Please install MetaMask or another Web3 wallet extension.",
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

      const accounts = await prov.send("eth_requestAccounts", []);
      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found");
      }

      const network = await prov.getNetwork();
      const chainId = Number(network.chainId);

      if (chainId !== CHAIN_ID) {
        toast.info("Switching network to Polygon Mainnet...");
        try {
          await ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: `0x${CHAIN_ID.toString(16)}` }],
          });
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            await ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: `0x${CHAIN_ID.toString(16)}`,
                  chainName: "Polygon Mainnet",
                  nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
                  rpcUrls: [RPC_URL],
                  blockExplorerUrls: ["https://polygonscan.com"],
                },
              ],
            });
            toast.success("Polygon Mainnet added!");
          } else {
            throw switchError;
          }
        }
      }

      const address = accounts[0];
      setProvider(prov);

      const ctr = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, prov);
      setContract(ctr);

      setState({
        address,
        balance: "0",
        chainId,
        isConnecting: false,
        isConnected: true,
        error: null,
      });

      toast.success("Wallet connected!", {
        description: `${address.slice(0, 6)}...${address.slice(-4)}`,
      });

      await updateBalance(address, prov);
    } catch (err: any) {
      console.error("Wallet error:", err);
      setState((prev) => ({
        ...prev,
        isConnecting: false,
        error: err.message || "Failed to connect wallet",
      }));
    }
  }, [updateBalance]);

  const disconnect = useCallback(() => {
    setProvider(null);
    setContract(null);
    setState({
      address: null,
      balance: "0",
      chainId: null,
      isConnecting: false,
      isConnected: false,
      error: null,
    });
    toast.info("Wallet disconnected");
  }, []);

  const refreshBalance = useCallback(async () => {
    if (state.address && provider) {
      await updateBalance(state.address, provider);
    }
  }, [state.address, provider, updateBalance]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ethereum = (window as any).ethereum;
    if (!ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else if (accounts[0] !== state.address) {
        connect();
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    ethereum.on("accountsChanged", handleAccountsChanged);
    ethereum.on("chainChanged", handleChainChanged);

    return () => {
      ethereum.removeListener?.("accountsChanged", handleAccountsChanged);
      ethereum.removeListener?.("chainChanged", handleChainChanged);
    };
  }, [state.address, connect, disconnect]);

  return {
    ...state,
    provider,
    contract,
    connect,
    disconnect,
    refreshBalance,
  };
}
