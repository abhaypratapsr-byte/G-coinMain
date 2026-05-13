const mongoose = require('mongoose');

const redeemSchema = new mongoose.Schema({
  wallet: {
    type: String,
    required: true,
    lowercase: true
  },
  amount: {
    type: Number,
    required: true
  },
  inrAmount: {
    type: Number,
    required: true
  },
  bankDetails: {
    accountNumber: String,
    ifsc: String,
    accountHolderName: String,
    bankName: String
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  burnTxHash: {
    type: String
  },
  payoutId: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  completedBy: {
    type: String
  }
});

module.exports = mongoose.model('Redeem', redeemSchema);