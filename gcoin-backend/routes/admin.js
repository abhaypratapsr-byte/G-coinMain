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
    redeemId: redeem._id,
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

  await mintQueue.add('mint', {
    paymentId: payment._id
  });

  res.json({ success: true });
});

module.exports = router;