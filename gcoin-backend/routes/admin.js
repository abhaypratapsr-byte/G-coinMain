const express = require('express');
const router = express.Router();
const Redeem = require('../models/Redeem');
const Payout = require('../models/Payout');
const Payment = require('../models/Payment');
const Transfer = require('../models/Transfer');
const User = require('../models/User');
const blockchainService = require('../services/blockchain');
const payoutService = require('../services/payout');
const { adminAuth } = require('../middleware/auth');
const payoutQueue = require('../queues/queue');
const mintQueue = require('../queues/mintQueue');
const MintLedger   = require('../middleware/MintLedger');
const RedeemLedger = require('../middleware/RedeemLedger');

router.post('/login', (req, res) => {
  const { key } = req.body;

  if (!key) {
    return res.status(400).json({
      success: false,
      message: 'Admin key required'
    });
  }

  if (key !== process.env.ADMIN_KEY) {
    return res.status(401).json({
      success: false,
      message: 'Invalid admin key'
    });
  }

  res.json({
    success: true,
    message: 'Authenticated'
  });
});


// All admin routes require authentication
router.use(adminAuth);

// Get dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, totalPayments, totalRedeems, totalTransfers, pendingRedeems] = await Promise.all([
      User.countDocuments(),
      Payment.countDocuments({ status: 'completed' }),
      Redeem.countDocuments(),
      Transfer.countDocuments(),
      Redeem.countDocuments({ status: 'pending' })
    ]);

    const totalMinted = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: { $ifNull: ['$gcoinAmount', '$amount'] } } } }
    ]);

    const totalRedeemed = await Redeem.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

   res.json({
  totalUsers,
  totalMinted: totalMinted[0]?.total || 0,
  totalRedeemed: totalRedeemed[0]?.total || 0,
  totalPayments,
  pendingRedeems,
  totalTransfers
});

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stats',
      error: error.message
    });
  }
});

// --- New Admin Control Endpoints ---

// Get Contract Status
router.get('/contract-status', async (req, res) => {
  try {
    const status = await blockchainService.getContractStatus();
    res.json({ success: true, status });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Pause/Unpause
router.post('/contract/pause', async (req, res) => {
  try {
    const receipt = await blockchainService.pause();
    res.json({ success: true, txHash: receipt.hash });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/contract/unpause', async (req, res) => {
  try {
    const receipt = await blockchainService.unpause();
    res.json({ success: true, txHash: receipt.hash });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Blacklist management
router.post('/users/:wallet/blacklist', async (req, res) => {
  try {
    const { wallet } = req.params;
    const { reason = 'Blacklisted by admin' } = req.body;
    const receipt = await blockchainService.blacklist(wallet, reason);
    res.json({ success: true, txHash: receipt.hash });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/users/:wallet/unblacklist', async (req, res) => {
  try {
    const { wallet } = req.params;
    const receipt = await blockchainService.unBlacklist(wallet);
    res.json({ success: true, txHash: receipt.hash });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// KYC management
router.post('/users/:wallet/verify-kyc', async (req, res) => {
  try {
    const { wallet } = req.params;
    const receipt = await blockchainService.verifyKYC(wallet);
    res.json({ success: true, txHash: receipt.hash });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/users/:wallet/revoke-kyc', async (req, res) => {
  try {
    const { wallet } = req.params;
    const receipt = await blockchainService.revokeKYC(wallet);
    res.json({ success: true, txHash: receipt.hash });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Supply management
router.post('/contract/max-supply', async (req, res) => {
  try {
    const { amount } = req.body;
    const receipt = await blockchainService.setMaxSupply(amount);
    res.json({ success: true, txHash: receipt.hash });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/contract/min-redeem', async (req, res) => {
  try {
    const { amount } = req.body;
    const receipt = await blockchainService.setMinRedeemAmount(amount);
    res.json({ success: true, txHash: receipt.hash });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Manual Minting
router.post('/contract/mint', async (req, res) => {
  try {
    const { to, amount, reason = 'Admin manual mint' } = req.body;
    if (!to || !amount) {
      return res.status(400).json({ success: false, message: 'Recipient and amount required' });
    }
    const orderId = `MANUAL_${Date.now()}`;
    const result = await blockchainService.mintTokens(to, amount, orderId);

    // Track in database as a completed payment
    await Payment.create({
      wallet: to,
      amount: amount,
      gcoinAmount: amount,
      razorpay_order_id: orderId,
      status: 'completed',
      txHash: result.txHash,
      notes: reason
    });

    res.json({ success: true, txHash: result.txHash });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin Manual Burn
router.post('/users/:wallet/burn', async (req, res) => {
  try {
    const { wallet } = req.params;
    const { amount, reason = 'Admin manual burn' } = req.body;

    if (!amount) {
      return res.status(400).json({ success: false, message: 'Amount required' });
    }

    const receipt = await blockchainService.adminBurn(wallet, amount);

    const AuditLog = require('../models/AuditLog');
    await AuditLog.create({
      action: 'ADMIN_MANUAL_BURN',
      user: wallet,
      data: { amount, txHash: receipt.hash, reason }
    });

    res.json({ success: true, txHash: receipt.hash });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all pending redeems
router.get('/redeems/pending', async (req, res) => {
  try {
    const redeems = await Redeem.find({ status: 'pending' })
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      redeems: redeems
    });
  } catch (error) {
    console.error('Get pending redeems error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending redeems',
      error: error.message
    });
  }
});

// Get all redeems (with filters)
router.get('/redeems', async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;
    
    const query = status ? { status } : {};
    
    const redeems = await Redeem.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      redeems: redeems
    });
  } catch (error) {
    console.error('Get redeems error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch redeems',
      error: error.message
    });
  }
});

// Complete a redeem (burn tokens + initiate payout)
router.post('/redeems/:id/complete', async (req, res) => {
  try {
    const { paymentRef } = req.body;

if (!paymentRef) {
  return res.status(400).json({
    success: false,
    message: 'Payment reference required'
  });
}
    const { id } = req.params;

    const redeem = await Redeem.findById(id);

    if (!redeem) {
      return res.status(404).json({
        success: false,
        message: 'Redeem request not found'
      });
    }

    if (redeem.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Redeem is already ${redeem.status}`
      });
    }
if (!redeem.bankDetails || !redeem.amount) {
  return res.status(400).json({
    success: false,
    message: 'Invalid redeem data'
  });
}
res.json({
  success: true,
  message: "Payout queued"
});

redeem.status = 'processing';
redeem.paymentRef = paymentRef;
await redeem.save();


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
    // ✅ Audit log
    const AuditLog = require('../models/AuditLog');
    await AuditLog.create({
      action: 'REDEEM_INITIATED',
      user: redeem.wallet,
      data: {
        amount: redeem.amount,
        redeemId: redeem._id
      }
    });

  
   
   

  } catch (error) {
    console.error('Complete redeem error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process redeem',
      error: error.message
    });
  }
});


     
// Get all payouts
router.get('/payouts', async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;
    
    const query = status ? { status } : {};
    
    const payouts = await Payout.find(query)
      .populate('redeemId')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      payouts: payouts
    });
  } catch (error) {
    console.error('Get payouts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payouts',
      error: error.message
    });
  }
});


// Get all users
router.get('/users', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    
    const users = await User.find()
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      users: users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
});

// Get Audit Logs
router.get('/audit-logs', async (req, res) => {
  try {
    const AuditLog = require('../models/AuditLog');
    const logs = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(20);
    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all transfers
router.get('/transfers', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    
    const transfers = await Transfer.find()
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      transfers: transfers
    });
  } catch (error) {
    console.error('Get transfers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transfers',
      error: error.message
    });
  }
});


router.post('/retry-mint/:id', async (req, res) => {
  const payment = await Payment.findById(req.params.id);

  if (!payment || payment.status !== 'failed') {
    return res.status(400).json({ message: 'Invalid payment' });
  }

  if (!mintQueue) {
  return res.status(503).json({
    success: false,
    message: 'Mint queue unavailable'
  });
}

await mintQueue.add('mint', {
  paymentId: payment._id
});

  res.json({ success: true });
});


router.get('/reconcile', async (req, res) => {
  try {
    const [inr, gcn] = await Promise.all([
      MintLedger.aggregate([{ $match: { status: 'minted' } }, { $group: { _id: null, total: { $sum: '$amountINR' } } }]),
      RedeemLedger.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: null, total: { $sum: '$amountINR' } } }]),
    ]);
    const totalMinted   = inr[0]?.total || 0;
    const totalRedeemed = gcn[0]?.total || 0;
    const outstanding   = totalMinted - totalRedeemed;
    res.json({ totalMinted, totalRedeemed, outstanding, balanced: Math.abs(outstanding) < 1 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/redeem/:id/paid', async (req, res) => {
  try {
    const { payoutRef } = req.body;
    const doc = await RedeemLedger.findByIdAndUpdate(
      req.params.id,
      { status: 'paid', payoutRef, paidAt: new Date() },
      { new: true }
    );
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;