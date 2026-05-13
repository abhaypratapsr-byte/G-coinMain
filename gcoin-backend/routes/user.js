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

    // Get all transaction types
    const [payments, redeems, transfers] = await Promise.all([
      Payment.find({ wallet: walletLower }).sort({ createdAt: -1 }),
      Redeem.find({ wallet: walletLower }).sort({ createdAt: -1 }).select('-bankDetails'),
      Transfer.find({
        $or: [{ from: walletLower }, { to: walletLower }]
      }).sort({ createdAt: -1 })
    ]);

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

    res.json({
      success: true,
      transactions: allTransactions
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

module.exports = router;