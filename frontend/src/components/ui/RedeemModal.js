import React, { useEffect, useState } from "react"

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
  const [bankDetails, setBankDetails] = useState({
    accountHolderName: "",
    bankName: "",
    accountNumber: "",
    ifsc: ""
  })
  const [formError, setFormError] = useState("")

  useEffect(() => {
    if (!show || redeemStep === "success") {
      setBankDetails({
        accountHolderName: "",
        bankName: "",
        accountNumber: "",
        ifsc: ""
      })
      setFormError("")
    }
  }, [show, redeemStep])

  if (!show) return null

  const canClose = redeemStep !== "processing"

  const handleConfirm = () => {
    if (redeemStep !== "idle") {
      onConfirm(bankDetails)
      return
    }

    const { accountHolderName, bankName, accountNumber, ifsc } = bankDetails
    if (!accountHolderName || !bankName || !accountNumber || !ifsc) {
      setFormError("Enter all bank details before confirming redeem.")
      return
    }

    setFormError("")
    onConfirm(bankDetails)
  }

  const updateField = (field, value) => {
    setBankDetails(prev => ({ ...prev, [field]: value }))
  }

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

            <div className="modal-body">
              <div className="modal-field">
                <span className="input-label">Account Holder Name</span>
                <input
                  className="modal-input"
                  type="text"
                  value={bankDetails.accountHolderName}
                  onChange={e => updateField("accountHolderName", e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                />
              </div>
              <div className="modal-field">
                <span className="input-label">Bank Name</span>
                <input
                  className="modal-input"
                  type="text"
                  value={bankDetails.bankName}
                  onChange={e => updateField("bankName", e.target.value)}
                  placeholder="e.g. HDFC Bank"
                />
              </div>
              <div className="modal-field">
                <span className="input-label">Account Number</span>
                <input
                  className="modal-input"
                  type="text"
                  value={bankDetails.accountNumber}
                  onChange={e => updateField("accountNumber", e.target.value)}
                  placeholder="e.g. 123456789012"
                />
              </div>
              <div className="modal-field">
                <span className="input-label">IFSC Code</span>
                <input
                  className="modal-input"
                  type="text"
                  value={bankDetails.ifsc}
                  onChange={e => updateField("ifsc", e.target.value.toUpperCase())}
                  placeholder="e.g. HDFC0001234"
                />
              </div>
              {formError && <div className="modal-form-error">{formError}</div>}
            </div>

            <div className="modal-note">⚠ Tokens burned immediately · INR payout via admin within 1–2 business days</div>
            <div className="modal-actions">
              <button className="mbtn-cancel" onClick={onClose}>Cancel</button>
              <button className="mbtn-confirm" onClick={handleConfirm}>Confirm Redeem</button>
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
              <button className="mbtn-confirm" onClick={handleConfirm}>Try Again</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
