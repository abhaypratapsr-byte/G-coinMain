const { Worker } = require('bullmq');
const connection = require('../config/redis');

const payoutService = require('../services/cashfree');
const blockchainService = require('../services/blockchain');
const Redeem = require('../models/Redeem');
const AuditLog = require('../models/AuditLog');

// ⏱ timeout helper
const withTimeout = (promise, ms) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), ms)
    )
  ]);

// ✅ STOP worker if Redis disabled
if (!connection) {
  console.log("⚠️ Redis disabled. Payout Worker not started.");
  module.exports = null;
  return;
}

const worker = new Worker(
  'payoutQueue',
  async (job) => {
    console.log("🚀 Job received:", job.id);

    const { wallet, amount, bankDetails, redeemId } = job.data;

    const redeem = await Redeem.findById(redeemId);

    if (!redeem) {
      throw new Error("Redeem not found");
    }

    if (!wallet || !amount || !bankDetails) {
      throw new Error("Invalid payout data");
    }

    if (
      redeem.status === 'completed' ||
      redeem.status === 'processing'
    ) {
      return;
    }

    redeem.status = 'processing';
    await redeem.save();

    try {

      // STEP 1: payout FIRST
      const payout = await withTimeout(
        payoutService.sendPayout({
          amount,
          bankDetails,
          referenceId: redeemId
        }),
        30000
      );

      if (!payout || !payout.transferId) {
        throw new Error("Invalid payout response");
      }

      // STEP 2: burn AFTER payout success
      await withTimeout(
        blockchainService.burnTokens(wallet, amount),
        30000
      );

      redeem.payoutId = payout.transferId;
      redeem.status = 'completed';

      await redeem.save();

      await AuditLog.create({
        action: 'PAYOUT_SUCCESS',
        user: wallet
      });

      console.log("✅ Completed:", job.id);

    } catch (err) {

      redeem.status = 'failed';
      await redeem.save();

      await AuditLog.create({
        action: 'PAYOUT_FAILED',
        user: wallet
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

console.log("👷 Payout Worker Started");

module.exports = worker;