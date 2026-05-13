const { Worker } = require('bullmq');
const connection = require('../config/redis');

const blockchainService = require('../services/blockchain');
const AuditLog = require('../models/AuditLog');
const Payment = require('../models/Payment');
const User = require('../models/User');
// ⏱ timeout helper
const withTimeout = (promise, ms) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), ms)
    )
  ]);

const worker = new Worker(
  'mintQueue',
  async (job) => {
    console.log("🚀 Job received:", job.id);

    const { paymentId } = job.data;

    const payment = await Payment.findById(paymentId);
    if (!payment) throw new Error('Payment not found');

    const amountToMint = payment.gcoinAmount || payment.amount;

    if (!payment.wallet || !amountToMint) {
      throw new Error("Invalid payment data");
    }

    // 🔥 prevent duplicate runs
    if (payment.status === 'completed') return;

    payment.status = 'processing';
    await payment.save();

    try {
      console.log("🪙 Minting:", payment.wallet, amountToMint);

      const tx = await withTimeout(
  blockchainService.mintTokens(payment.wallet, amountToMint),
  30000
);

if (!tx || !tx.hash) {
  throw new Error("Mint failed: no tx hash");
}

     payment.txHash = tx.hash;   // 🔥 IMPORTANT
payment.status = 'completed';
await payment.save();

      await AuditLog.create({
        action: 'MINT_SUCCESS',
        user: payment.wallet,
        data: {
          amount: amountToMint,
          paymentId: payment._id
        }
      });

      console.log("✅ Completed:", job.id);
      // AFTER successful mint
await User.findOneAndUpdate(
  { wallet: payment.wallet },
  { $inc: { totalMinted: amountToMint } }
);

    } catch (err) {
      payment.status = 'failed';
      await payment.save();

      await AuditLog.create({
        action: 'MINT_FAILED',
        user: payment.wallet,
        data: {
          error: err.message
        }
      });

      console.error("❌ Failed:", job.id, err.message);
      throw err;
    }
  },
  {
    connection,
    concurrency: 1
  }
);
console.log('👷 Mint Worker Started');