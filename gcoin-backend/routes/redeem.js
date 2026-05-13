const express = require('express');
const router = express.Router();
const Redeem = require('../models/Redeem');
const blockchainService = require('../services/blockchain');
const payoutQueue = require('../queues/queue');
// ✅ REQUEST REDEEM (CLEAN + PRODUCTION READY)
router.post('/request', async (req, res) => {
  try {
    const { wallet, amount, bankDetails } = req.body;

    if (!wallet || !amount || !bankDetails) {
      return res.status(400).json({
        success: false,
        message: 'Wallet, amount, and bank details are required'
      });
    }

    if (amount < 100) {
      return res.status(400).json({
        success: false,
        message: 'Minimum redeem amount is 100 INR'
      });
    }

    const { accountNumber, ifsc, accountHolderName, bankName } = bankDetails;

    if (!accountNumber || !ifsc || !accountHolderName || !bankName) {
      return res.status(400).json({
        success: false,
        message: 'Complete bank details required'
      });
    }

    // ✅ Check balance
    const balance = await blockchainService.getBalance(wallet);

    if (parseFloat(balance) < amount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient GCoin balance. You have ${balance} GCoin`
      });
    }

    // ✅ Create redeem
    const redeem = new Redeem({
  wallet: wallet.toLowerCase(),
  amount,
  inrAmount: amount,
  bankDetails,
  status: 'pending'
});

await redeem.save();


// 🔥 AUTO PROCESS
await payoutQueue.add(
  'payout',
  {
    redeemId: redeem._id.toString(),
    wallet: redeem.wallet,
    amount: redeem.amount,
    bankDetails: redeem.bankDetails
  },
  {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 5000
    }
  }
);

return res.json({
  success: true,
  message: 'Redeem request created successfully',
  redeemId: redeem._id.toString()
});

} catch (error) {
  console.error('Redeem request error:', error);

  return res.status(500).json({
    success: false,
    message: 'Failed to process redeem',
    error: error.message
  });
}
}); 

// ✅ NOW define history route OUTSIDE
router.get('/history/:wallet', async (req, res) => {
  try {
    const { wallet } = req.params;

  const query = { wallet: wallet.toLowerCase() };

const redeems = await Redeem.find(query)
  .select('-bankDetails')
  .sort({ createdAt: -1 });
    res.json({
      success: true,
      redeems
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch redeem history'
    });
  }
});

// ✅ STATUS
router.get('/status/:redeemId', async (req, res) => {
  try {
    const redeem = await Redeem.findById(req.params.redeemId)
      .select('-bankDetails');

    if (!redeem) {
      return res.status(404).json({
        success: false,
        message: 'Redeem not found'
      });
    }

    res.json({
      success: true,
      redeem
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch redeem status'
    });
  }
});

module.exports = router;