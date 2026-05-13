import React from "react"

const getModalTitle = (redeemStep) => {
  if (redeemStep === "idle") return "Confirm Redeem"
  if (redeemStep === "processing") return "Processing…"
  if (redeemStep === "success") return "Redeem Submitted!"
  return "Redeem Failed"
}

const getModalIcon = (redeemStep) => {
  if (redeemStep === "idle") return "⬡"
  if (redeemStep === "processing") return "◌"
  if (redeemStep === "success") return "✓"
  return "✕"
}

export const RedeemModal = ({
  show,
  redeemStep,
  amount,
  wallet,
  redeemErrorMsg,
  onClose,
  onConfirm,
  formatWallet
}) => {
  if (!show) return null

  const canClose = redeemStep !== "processing"

  return (
    <div className="modal-backdrop" onClick={canClose ? onClose : undefined}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-top-line" />

        {canClose && (
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        )}

        <div className={`modal-icon-wrap ${redeemStep === "success" ? "icon-success" : redeemStep === "error" ? "icon-error" : ""}`}>
          <span className={`modal-icon-sym ${redeemStep === "processing" ? "spin" : ""}`}>
            {getModalIcon(redeemStep)}
          </span>
        </div>

        <div className="modal-title">
          {getModalTitle(redeemStep)}
        </div>

        {redeemStep === "idle" && (
          <>
            <div className="modal-body">
              <div className="modal-row">
                <span>Amount</span>
                <span className="mval accent">{Number(amount).toLocaleString("en-IN")} GCN</span>
              </div>
              <div className="modal-row">
                <span>INR Value</span>
                <span className="mval">₹{Number(amount).toLocaleString("en-IN")}</span>
              </div>
              <div className="modal-row">
                <span>Wallet</span>
                <span className="mval mono">{formatWallet(wallet)}</span>
              </div>
              <div className="modal-row">
                <span>Settlement</span>
                <span className="mval">1–2 business days</span>
              </div>
            </div>
            <div className="modal-note">⚠ Tokens burned immediately · INR payout via admin within 1–2 business days</div>
            <div className="modal-actions">
              <button className="mbtn-cancel" onClick={onClose}>Cancel</button>
              <button className="mbtn-confirm" onClick={onConfirm}>Confirm Redeem</button>
            </div>
          </>
        )}

        {redeemStep === "processing" && (
          <div className="modal-processing">
            <div className="prog-bar"><div className="prog-fill" /></div>
            <div className="prog-steps">
              <span className="ps ps-active">Burning tokens</span>
              <span className="ps">Recording request</span>
              <span className="ps">Queuing payout</span>
            </div>
          </div>
        )}

        {redeemStep === "success" && (
          <div className="modal-success-body">
            <div className="s-amount">{Number(amount).toLocaleString("en-IN")} GCN burned</div>
            <div className="s-sub">₹{Number(amount).toLocaleString("en-IN")} payout queued · 1–2 business days</div>
            <div className="s-note">Check "Recent Redeems" below for status</div>
          </div>
        )}

        {redeemStep === "error" && (
          <div className="modal-error-body">
            <div className="e-msg">{redeemErrorMsg || "Something went wrong. Please try again."}</div>
            <div className="modal-actions">
              <button className="mbtn-cancel" onClick={onClose}>Close</button>
              <button className="mbtn-confirm" onClick={onConfirm}>Try Again</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
