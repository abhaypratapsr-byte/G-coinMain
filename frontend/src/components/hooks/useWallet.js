import { useState, useCallback, useEffect } from "react"
import { ethers } from "ethers"
import { 
  POLYGON_CHAIN_ID, 
  ERROR_CODE_USER_REJECTED,
  ERROR_CODE_CHAIN_NOT_ADDED,
  POLYGON_NETWORK_CONFIG 
} from "../constants"

export const useWallet = () => {
  const [wallet, setWallet] = useState(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [wrongNetwork, setWrongNetwork] = useState(false)

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      throw new Error("Please install MetaMask to continue")
    }

    setIsConnecting(true)
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const accounts = await provider.send("eth_requestAccounts", [])
      setWallet(accounts[0])
      return accounts[0]
    } catch (err) {
      if (err.code === ERROR_CODE_USER_REJECTED) {
        throw new Error("Wallet connection declined.")
      }
      throw new Error("Failed to connect — please try again.")
    } finally {
      setIsConnecting(false)
    }
  }, [])

  const switchToMainnet = useCallback(async () => {
    if (!window.ethereum) return
    
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: POLYGON_CHAIN_ID }],
      })
    } catch (err) {
      if (err.code === ERROR_CODE_CHAIN_NOT_ADDED) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [POLYGON_NETWORK_CONFIG],
        })
      }
    }
  }, [])

  const checkNetwork = useCallback(async () => {
    if (!window.ethereum || !wallet) return
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const network = await provider.getNetwork()
      const chainHex = "0x" + network.chainId.toString(16)
      setWrongNetwork(chainHex !== POLYGON_CHAIN_ID)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.error("Network check error:", err)
      }
    }
  }, [wallet])

  return {
    wallet,
    setWallet,
    isConnecting,
    wrongNetwork,
    setWrongNetwork,
    connectWallet,
    switchToMainnet,
    checkNetwork
  }
}
