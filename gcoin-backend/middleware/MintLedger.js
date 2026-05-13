const mongoose = require('mongoose');

const mintLedgerSchema = new mongoose.Schema({
  orderId:       { type: String, required: true, unique: true },
  walletAddress: { type: String, required: true },
  amountINR:     { type: Number, required: true },
  gcnUnits:      { type: Number, required: true },
  txHash:        { type: String, default: null },
  blockNumber:   { type: Number, default: null },
  status:        { type: String, enum: ['pending', 'minted', 'failed'], default: 'pending' },
  errorMsg:      { type: String, default: null },
  mintedAt:      { type: Date, default: null },
}, { timestamps: true });

mintLedgerSchema.index({ orderId: 1 }, { unique: true });
mintLedgerSchema.index({ walletAddress: 1, createdAt: -1 });

module.exports = mongoose.model('MintLedger', mintLedgerSchema);