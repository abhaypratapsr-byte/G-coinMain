const mongoose = require('mongoose');

const redeemLedgerSchema = new mongoose.Schema({
  walletAddress: { type: String, required: true },
  gcnUnits:      { type: Number, required: true },
  amountINR:     { type: Number, required: true },
  redeemId:      { type: String, default: '' },   // bytes32 from contract
  utrRef:        { type: String, default: '' },    // filled by admin on payout
  txHash:        { type: String, required: true },
  blockNumber:   { type: Number },
  status:        { type: String, enum: ['pending', 'processing', 'paid', 'failed'], default: 'pending' },
  payoutRef:     { type: String, default: null },
  adminNote:     { type: String, default: null },
  paidAt:        { type: Date, default: null },
}, { timestamps: true });

redeemLedgerSchema.index({ txHash: 1 }, { unique: true });
redeemLedgerSchema.index({ walletAddress: 1, status: 1 });
redeemLedgerSchema.index({ redeemId: 1 });

module.exports = mongoose.model('RedeemLedger', redeemLedgerSchema);