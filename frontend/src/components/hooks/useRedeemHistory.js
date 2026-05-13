import { useState, useCallback } from "react"

const BACKEND = process.env.REACT_APP_BACKEND_URL || "http://localhost:3001"

export const useRedeemHistory = () => {
  const [redeemHistory, setRedeemHistory] = useState([])

  const fetchRedeemHistory = useCallback(async (address) => {
    if (!address) return
    
    try {
      const res = await fetch(`${BACKEND}/api/user/history/${address}`)
      if (res.ok) {
        const data = await res.json()
        setRedeemHistory(data)
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.error("Failed to fetch redeem history:", err)
      }
    }
  }, [])

  return {
    redeemHistory,
    setRedeemHistory,
    fetchRedeemHistory
  }
}
