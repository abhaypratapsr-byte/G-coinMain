const mongoose = require('mongoose');

const redeemLedgerSchema = new mongoose.Schema(
  {
    wallet: {
      type: String,
      required: true,
    },

    amountINR: {
      type: Number,
      required: true,
    },

    amountGCN: {
      type: Number,
      required: true,
    },

    payoutRef: {
      type: String,
      default: null,
    },

    status: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },

    paidAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  'RedeemLedger',
  redeemLedgerSchema
);