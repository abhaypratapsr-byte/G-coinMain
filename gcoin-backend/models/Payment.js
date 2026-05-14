const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  wallet: String,
  amount: Number,
  gcoinAmount: Number,
  status: {
    type: String,
    enum: ["pending", "processing", "completed", "failed"],
    default: "pending"
  },
  txHash: String,
  error: String,
  completedAt: Date
}, { timestamps: true });

module.exports = mongoose.model("Payment", paymentSchema);