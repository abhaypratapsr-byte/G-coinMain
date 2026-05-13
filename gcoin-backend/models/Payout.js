const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema({
  redeemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Redeem',
    required: true
  },
  wallet: {
    type: String,
    required: true,
    lowercase: true
  },
  amount: {
    type: Number,
    required: true
  },

  payoutId: {   // ✅ unified ID (Cashfree transferId)
    type: String
  },

  provider: {   // ✅ future-proof
    type: String,
    enum: ['cashfree'],
    default: 'cashfree'
  },

  status: {
    type: String,
    enum: ['pending', 'processing', 'processed', 'failed', 'reversed'],
    default: 'pending'
  },

  failureReason: String,

  createdAt: {
    type: Date,
    default: Date.now
  },

  processedAt: Date
});

module.exports = mongoose.model('Payout', payoutSchema);