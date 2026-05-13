import { useState, useEffect, useRef } from "react"
import abiJson from "./gcoin-abi.json"
import "./GCoin.css"

// Hooks
import { useWallet } from "./hooks/useWallet"
import { useContract } from "./hooks/useContract"
import { useRedeemHistory } from "./hooks/useRedeemHistory"

// Components
import { WalletConnection } from "./ui/WalletConnection"
import { RedeemModal } from "./ui/RedeemModal"

// Constants
import {
  RAZORPAY_KEY,
  PARTICLE_ANIMATION_DURATION,
  SUCCESS_MESSAGE_DURATION,
  ERROR_MESSAGE_DURATION,
  CANCEL_MESSAGE_DURATION,
  REDEEM_SUCCESS_DURATION,
  QUICK_AMOUNTS
} from "./constants"

const BACKEND = process.env.REACT_APP_BACKEND_URL || "http://localhost:3001"

// ─── Component ────────────────────────────────────────────────────────────────
export default function GCoinPortal() {
  // Custom hooks
  const { 
    wallet, 
    setWallet,
    isConnecting, 
    wrongNetwork, 
    setWrongNetwork,
    connectWallet: connectWalletHook, 
    switchToAmoy 
  } = useWallet()
  
  const { 
    balance, 
    setBalance,
    isRefreshing, 
    fetchBalance 
  } = useContract(abiJson)
  
  const { 
    redeemHistory, 
    setRedeemHistory,
    fetchRedeemHistory 
  } = useRedeemHistory()

  // Theme
  const [theme, setTheme] = useState("dark")
  const [mounted, setMounted] = useState(false)

  // Mint state
  const [amount, setAmount]       = useState("")
  const [step, setStep]           = useState("idle")
  const [statusMsg, setStatusMsg] = useState("")

  // Redeem state
  const [redeemStep, setRedeemStep]           = useState("idle")
  const [showRedeemModal, setShowRedeemModal] = useState(false)
  const [redeemErrorMsg, setRedeemErrorMsg]   = useState("")

  // Particles
  const [particles, setParticles] = useState([])
  const particleId = useRef(0)

 

  // ── Theme persistence ─────────────────────────────────────────────────────────
  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem("gcoin-theme")
    if (saved) {
      setTheme(saved)
    }
  }, [])

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark"
    setTheme(next)
    localStorage.setItem("gcoin-theme", next)
  }

  // ── Particles ─────────────────────────────────────────────────────────────────
  const spawnParticles = () => {
    const newP = Array.from({ length: 24 }, () => ({
      x: 20 + Math.random() * 60,
      y: 20 + Math.random() * 60,
      id: ++particleId.current,
    }))
    setParticles(p => [...p, ...newP])
    setTimeout(() => setParticles([]), PARTICLE_ANIMATION_DURATION)
  }

  // ── Connect wallet wrapper ────────────────────────────────────────────────────
  const connectWallet = async () => {
    try {
      const address = await connectWalletHook()
      const result = await fetchBalance(address)
      if (result?.wrongNetwork) {
        setStatusMsg("Wrong network — switch to Polygon Amoy Testnet")
      }
      await fetchRedeemHistory(address)
      setStatusMsg("")
    } catch (err) {
      setStatusMsg(err.message)
    }
  }

  // ── Listeners ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!window.ethereum) return

    const handleAccountsChanged = (accounts) => {
      if (accounts.length > 0) {
        setWallet(accounts[0])
        fetchBalance(accounts[0])
        fetchRedeemHistory(accounts[0])
      } else {
        setWallet(null)
        setBalance("0.00")
        setWrongNetwork(false)
        setRedeemHistory([])
      }
    }

    const handleChainChanged = () => {
      if (wallet) {
        fetchBalance(wallet)
      } else {
        setWrongNetwork(false)
      }
    }

    window.ethereum.on("accountsChanged", handleAccountsChanged)
    window.ethereum.on("chainChanged", handleChainChanged)

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
      window.ethereum.removeListener("chainChanged", handleChainChanged)
    }
  }, [wallet, fetchBalance, fetchRedeemHistory, setWallet, setBalance, setWrongNetwork, setRedeemHistory])

  // ── Mint / Payment flow ───────────────────────────────────────────────────────
  const handlePurchase = async () => {
  try {
    const res = await fetch(`${BACKEND}/api/payment/create-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        wallet,
        amount: Number(amount),
        email: `user_${wallet}@gcoin.app`,
        phone: "9999999999"
      }),
    });

    const data = await res.json();

    if (!data.paymentSessionId) {
      throw new Error("No payment session id");
    }

    // ✅ CASHFREE CHECKOUT
    const cashfree = new window.Cashfree({
      mode: "sandbox"
    });

    cashfree.checkout({
      paymentSessionId: data.paymentSessionId,
      redirectTarget: "_self"
    });

  } catch (err) {
    console.error(err);
    setStatusMsg("Payment failed to start");
  }
};
  // ── Redeem flow ───────────────────────────────────────────────────────────────
  const handleRedeem = async () => {
    if (!wallet) return
    const numAmount = Number(amount)
    if (!numAmount || numAmount <= 0) return

    setRedeemStep("processing")
    setRedeemErrorMsg("")

    try {
      const res = await fetch(`${BACKEND}/api/redeem/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet, amount: numAmount }),
      })

      if (!res.ok) {
        const text = await res.text()
        if (process.env.NODE_ENV !== 'production') {
          console.error("redeem-request failed:", res.status, text)
        }
        throw new Error(`Redeem failed (${res.status})`)
      }

      let data
      try {
        data = await res.json()
      } catch {
        const text = await res.text()
        if (process.env.NODE_ENV !== 'production') {
          console.error("Invalid JSON from redeem:", text)
        }
        throw new Error("Server returned invalid response")
      }

      if (data.success) {
        setRedeemStep("success")
        setAmount("")
        await fetchBalance(wallet)
        await fetchRedeemHistory(wallet)
        setTimeout(() => {
          setRedeemStep("idle")
          setShowRedeemModal(false)
        }, REDEEM_SUCCESS_DURATION)
      } else {
        throw new Error(data.error || "Redeem failed")
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.error("handleRedeem error:", err)
      }
      setRedeemErrorMsg(err.message || "Redeem failed — try again")
      setRedeemStep("error")
    }
  }

  const openRedeemModal = () => {
    if (!wallet) {
      setStatusMsg("Connect your wallet first")
      return
    }
    if (wrongNetwork) {
      setStatusMsg("Switch to Polygon Amoy Testnet first")
      return
    }
    if (!amount || Number(amount) <= 0) {
      setStatusMsg("Enter an amount to redeem")
      return
    }
    if (Number(amount) > Number(balance)) {
      setStatusMsg("Insufficient GCoin balance")
      return
    }
    
    setRedeemStep("idle")
    setRedeemErrorMsg("")
    setShowRedeemModal(true)
  }

  const closeRedeemModal = () => {
    if (redeemStep === "processing") return
    setShowRedeemModal(false)
    setRedeemStep("idle")
    setRedeemErrorMsg("")
  }

  // ── Helpers ───────────────────────────────────────────────────────────────────
  const isLoading    = step === "creating_order" || step === "minting"
  const isDisabled   = isLoading || step === "awaiting_payment"
  const formatWallet = (w) => `${w.slice(0, 6)}···${w.slice(-4)}`

  const getBtnLabel = () => {
    if (step === "idle" || step === "error") return "Pay & Mint GCoin"
    if (step === "creating_order") return "Initialising…"
    if (step === "awaiting_payment") return "Complete Payment"
    if (step === "minting") return "Minting…"
    if (step === "success") return "Minted Successfully ✓"
    return "Pay & Mint GCoin"
  }

  const isDark = theme === "dark"
  if (!mounted) return null

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className={`portal-root ${isDark ? 'theme-dark' : 'theme-light'}`}>
      {/* Ambient background */}
      <div className="bg-layer bg-r1" />
      <div className="bg-layer bg-r2" />
      <div className="bg-layer bg-r3" />
      <div className="bg-noise" />
      <div className="bg-grid" />

      {/* Particles */}
      <div className="particles-wrap">
        {particles.map(p => (
          <div
            key={p.id}
            className="particle"
            style={{
              left: `${p.x}%`,
              top:  `${p.y}%`,
              '--dx': `${p.id % 2 === 0 ? 120 : -120}px`,
              '--dy': `-120px`,
            }}
          />
        ))}
      </div>

      {/* ── Redeem Modal ── */}
      <RedeemModal
        show={showRedeemModal}
        redeemStep={redeemStep}
        amount={amount}
        wallet={wallet}
        redeemErrorMsg={redeemErrorMsg}
        onClose={closeRedeemModal}
        onConfirm={handleRedeem}
        formatWallet={formatWallet}
      />

      {/* ── Header ── */}
      <header className="portal-header">
        <div className="portal-logo">
          <div className="logo-gem">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span className="logo-name">GCoin</span>
          <span className="logo-tag">GCN</span>
        </div>

        <div className="header-right">
          {/* Theme toggle */}
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme" title={`Switch to ${isDark ? "light" : "dark"} mode`}>
            {isDark ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5"/>
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
              </svg>
            )}
          </button>

          <div className={`network-pill ${wrongNetwork ? "net-wrong" : ""}`}>
            <span className="net-dot" />
            <span>{wrongNetwork ? "Wrong Network" : "Polygon Amoy"}</span>
            {wrongNetwork && (
              <button className="net-switch-btn" onClick={switchToAmoy}>Switch</button>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <div className="hero">
        <div className="hero-badge">
          <span className="badge-dot" />
          <span>India Stable Token · Polygon</span>
          <span className="badge-dot" />
        </div>
        <h1 className="hero-title">
          Mint <span className="title-accent">GCoin</span>
        </h1>
        <p className="hero-sub">1 GCN = ₹1 &nbsp;·&nbsp; Pay via UPI, Cards &amp; Netbanking</p>
        <div className="stat-row">
          {[
            { v: "₹1.00", l: "Peg" },
            { v: "Polygon", l: "Network" },
            { v: "Instant", l: "Settlement" },
          ].map((s, i) => (
            <div key={`stat-${i}`} style={{ display: "flex", alignItems: "center" }}>
              {i > 0 && <div className="stat-sep" />}
              <div className="stat-item">
                <span className="stat-v">{s.v}</span>
                <span className="stat-l">{s.l}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Card ── */}
      <div className="card">
        <div className="card-top-line" />

        {wrongNetwork && (
          <div className="net-banner">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
            </svg>
            <span>MetaMask is on the wrong network.</span>
            <button className="net-banner-btn" onClick={switchToAmoy}>Switch to Amoy →</button>
          </div>
        )}

        {!wallet ? (
          <WalletConnection 
            isConnecting={isConnecting}
            onConnect={connectWallet}
          />
        ) : (
          <div className="connected-state">
            {/* Account row */}
            <div className="account-row">
              <div className="account-left">
                <div className="account-avatar">{wallet.slice(2, 4).toUpperCase()}</div>
                <div>
                  <div className="account-addr">{formatWallet(wallet)}</div>
                  <div className="account-net">Polygon Amoy Testnet</div>
                </div>
              </div>
              <button
                className="refresh-btn"
                onClick={() => { fetchBalance(wallet); fetchRedeemHistory(wallet) }}
                disabled={isRefreshing}
                title="Refresh balance"
              >
                <svg className={isRefreshing ? "spin" : ""} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
                </svg>
              </button>
            </div>

            {/* Balance card */}
            <div className={`balance-card ${step === "success" ? "bal-success" : ""}`}>
              <div className="balance-glow" />
              <div className="balance-label">Your GCoin Balance</div>
              <div className="balance-main">
                <span className="balance-num">{balance}</span>
                <span className="balance-unit">GCN</span>
              </div>
              <div className="balance-inr">≈ ₹{Number(balance).toLocaleString("en-IN")}</div>
            </div>

            {/* Amount input */}
            <div className="input-section">
              <div className="input-label">Amount (INR = GCN)</div>
              <div className={`amount-wrap ${!isDisabled && amount ? "amount-active" : ""}`}>
                <span className="amount-prefix">₹</span>
                <input
                  type="number"
                  placeholder="0"
                  value={amount}
                  min="1"
                  onChange={e => setAmount(e.target.value)}
                  disabled={isDisabled}
                  className="amount-input"
                />
                <div className="amount-suffix">
                  <span className="amount-unit">INR</span>
                  {amount && Number(amount) > 0 && (
                    <span className="amount-preview">{Number(amount).toLocaleString("en-IN")} GCN</span>
                  )}
                </div>
              </div>

              <div className="quick-row">
                {QUICK_AMOUNTS.map(v => (
                  <button
                    key={v}
                    className={`quick-btn ${amount === String(v) ? "quick-active" : ""}`}
                    onClick={() => setAmount(String(v))}
                    disabled={isDisabled}
                  >
                    ₹{v >= 1000 ? `${v / 1000}K` : v}
                  </button>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="action-group">
              <button
                className={`btn-mint ${step === "success" ? "btn-success" : ""} ${step === "error" ? "btn-error" : ""}`}
                onClick={handlePurchase}
                disabled={isDisabled || wrongNetwork || !amount || Number(amount) <= 0}
              >
                <div className="btn-glow" />
                <div className="btn-content">
                  {isLoading && <span className="spinner spinner-dark" />}
                  {step === "success" && (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                    </svg>
                  )}
                  {step === "error" && (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  )}
                  <span>{getBtnLabel()}</span>
                </div>
              </button>

              <button
                className="btn-redeem"
                onClick={openRedeemModal}
                disabled={isDisabled || wrongNetwork || !amount || Number(amount) <= 0 || Number(amount) > Number(balance)}
              >
                <div className="btn-redeem-glow" />
                <div className="btn-content">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                  </svg>
                  <span>Redeem GCoin → INR</span>
                </div>
              </button>
            </div>

            {/* Redeem history */}
            {redeemHistory.length > 0 && (
              <div className="redeem-history">
                <div className="rh-title">Recent Redeems</div>
                {redeemHistory.slice(0, 3).map((r, i) => {
                  const statusIcon = r.status === "completed" ? "✓" : r.status === "pending" ? "◌" : "·"
                  return (
                    <div className="rh-row" key={r.id || `redeem-${i}`}>
                      <span className={`rh-status status-${r.status}`}>
                        {statusIcon}
                      </span>
                      <span className="rh-amount">{Number(r.amount).toLocaleString("en-IN")} GCN</span>
                      <span className="rh-badge">{r.status}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Status message */}
        {statusMsg && (
          <div className={`status-msg status-${step}`}>
            <span className="status-dot" />
            {statusMsg}
          </div>
        )}
      </div>

      {/* Trust row */}
      <div className="trust-row">
        {[
          { path: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z", label: "Cashfree Secured" },
          { path: "M3 11h18v11a2 2 0 01-2 2H5a2 2 0 01-2-2V11zM7 11V7a5 5 0 0110 0v4", label: "Audited Contract" },
          { path: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM8 12l2 2 4-4", label: "RBI Compliant" },
        ].map((t, i) => (
          <div key={t.label} className="trust-item">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d={t.path}/>
            </svg>
            <span>{t.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
