import React from "react"

export const WalletConnection = ({ 
  isConnecting, 
  onConnect 
}) => {
  return (
    <div className="connect-state">
      <div className="connect-visual">
        <div className="cv-ring r1" />
        <div className="cv-ring r2" />
        <div className="cv-ring r3" />
        <div className="cv-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="1" y="8" width="22" height="13" rx="3"/>
            <path d="M1 12h22M8 8V5a3 3 0 016 0v3"/>
          </svg>
        </div>
      </div>
      <div className="connect-copy">
        <div className="connect-heading">Connect your wallet</div>
        <div className="connect-sub">Link MetaMask on Polygon Amoy to mint or redeem GCoin</div>
      </div>
      <button className="btn-connect" onClick={onConnect} disabled={isConnecting}>
        {isConnecting ? (
          <>
            <span className="spinner" />
            <span>Connecting…</span>
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="1" y="8" width="22" height="13" rx="3"/>
              <path d="M1 12h22M8 8V5a3 3 0 016 0v3"/>
            </svg>
            <span>Connect MetaMask</span>
          </>
        )}
      </button>
    </div>
  )
}
