const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  wallet: String,
  type: { type: String }, // mint | redeem | transfer
  amount: Number,
  status: String,
  txHash: String,
  referenceId: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', schema);