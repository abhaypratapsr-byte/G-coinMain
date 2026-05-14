const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Redeem = require('../models/Redeem');
const Transfer = require('../models/Transfer');
const User = require('../models/User');
const blockchainService = require('../services/blockchain');

// Get user profile and stats
router.get('/profile/:wallet', async (req, res) => {
  try {
    const { wallet } = req.params;
    const walletLower = wallet.toLowerCase();

    // Get user from DB
    let user = await User.findOne({ wallet: walletLower });
    
    if (!user) {
      user = {
        wallet: walletLower,
        totalMinted: 0,
        totalRedeemed: 0,
        totalTransferred: 0
      };
    }

    // Get current blockchain balance
    const balance = await blockchainService.getBalance(walletLower);

    res.json({
      success: true,
      profile: {
        ...user.toObject ? user.toObject() : user,
        currentBalance: parseFloat(balance)
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message
    });
  }
});

// Get all transactions for a wallet
router.get('/transactions/:wallet', async (req, res) => {
  try {
    const { wallet } = req.params;
    const walletLower = wallet.toLowerCase();

    console.log(`📋 Fetching transactions for wallet: ${walletLower}`);

    // Get all transaction types
    const [payments, redeems, transfers] = await Promise.all([
      Payment.find({ wallet: walletLower }).sort({ createdAt: -1 }),
      Redeem.find({ wallet: walletLower }).sort({ createdAt: -1 }).select('-bankDetails'),
      Transfer.find({
        $or: [{ from: walletLower }, { to: walletLower }]
      }).sort({ createdAt: -1 })
    ]);

    console.log(`  Payments: ${payments.length}, Redeems: ${redeems.length}, Transfers: ${transfers.length}`);

    // Combine and format all transactions
    const allTransactions = [
      ...payments.map(p => ({
        type: 'buy',
        amount: p.gcoinAmount || p.amount,
        status: p.status,
        txHash: p.txHash,
        createdAt: p.createdAt,
        id: p._id
      })),
      ...redeems.map(r => ({
        type: 'redeem',
        amount: r.amount,
        status: r.status,
        txHash: r.burnTxHash,
        createdAt: r.createdAt,
        id: r._id
      })),
      ...transfers.map(t => ({
        type: t.from === walletLower ? 'transfer_sent' : 'transfer_received',
        amount: t.amount,
        status: t.status,
        txHash: t.txHash,
        from: t.from,
        to: t.to,
        createdAt: t.createdAt,
        id: t._id
      }))
    ];

    // Sort by date
    allTransactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    console.log(`✅ Returning ${allTransactions.length} total transactions for ${walletLower}`);

    res.json({
      success: true,
      transactions: allTransactions,
      count: allTransactions.length
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error.message
    });
  }
});

// DEBUG: Get all payments in DB (admin only)
router.get('/debug/all-payments', async (req, res) => {
  try {
    const payments = await Payment.find({}).limit(20).sort({ createdAt: -1 });
    res.json({
      success: true,
      count: payments.length,
      payments: payments.map(p => ({
        wallet: p.wallet,
        amount: p.amount,
        status: p.status,
        txHash: p.txHash,
        createdAt: p.createdAt,
        orderId: p.orderId
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;