const Payment = require('../models/Payment');

async function fraudCheck(payment) {
  const amount = payment.amount;
  const wallet = payment.wallet;

  // 🚨 Rule 1: Large payment
  if (amount > 50000) {
    return { flagged: true, reason: 'High amount' };
  }

  // 🚨 Rule 2: Too many transactions
  const recent = await Payment.countDocuments({
    wallet,
    createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) }
  });

  if (recent > 5) {
    return { flagged: true, reason: 'Too many transactions' };
  }

  return { flagged: false };
}

module.exports = fraudCheck;