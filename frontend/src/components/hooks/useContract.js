import { useState, useCallback } from "react"
import { ethers } from "ethers"
import { CONTRACT_ADDRESS, POLYGON_CHAIN_ID } from "../constants"

export const useContract = (abiJson) => {
  const [balance, setBalance] = useState("0.00")
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchBalance = useCallback(async (address) => {
    if (!window.ethereum || !address) return

    setIsRefreshing(true)
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const network = await provider.getNetwork()
      const chainHex = "0x" + network.chainId.toString(16)

      if (chainHex !== POLYGON_CHAIN_ID) {
        setBalance("0.00")
        return { wrongNetwork: true }
      }

      const contract = new ethers.Contract(CONTRACT_ADDRESS, abiJson, provider)
      const bal = await contract.balanceOf(address)
      const formattedBalance = Number(ethers.formatUnits(bal, 18)).toFixed(2)
      setBalance(formattedBalance)
      return { wrongNetwork: false }
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.error("Balance fetch error:", err)
      }
      setBalance("0.00")
      return { wrongNetwork: false }
    } finally {
      setIsRefreshing(false)
    }
  }, [abiJson])

  return {
    balance,
    setBalance,
    isRefreshing,
    fetchBalance
  }
}
