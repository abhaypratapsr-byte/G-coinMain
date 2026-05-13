const express = require('express');
const router = express.Router();
const Transfer = require('../models/Transfer');
const User = require('../models/User');
const blockchainService = require('../services/blockchain');
const { ethers } = require('ethers');
const wallet = require("../utils/wallet");

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

const abi = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)"
];

router.post("/gasless-transfer", async (req, res) => {
  try {
    const { to, amount } = req.body;

    // 🔐 STEP 1: AUTH CHECK FIRST
    if (!req.headers["x-api-key"] || req.headers["x-api-key"] !== process.env.API_SECRET) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // 🧠 STEP 2: VALIDATION
    if (!ethers.isAddress(to)) {
      return res.status(400).json({ error: "Invalid address" });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, wallet);

    // 💰 STEP 3: CHECK BACKEND BALANCE
    const balance = await contract.balanceOf(wallet.address);

    if (balance < ethers.parseUnits(amount.toString(), 2)) {
      return res.status(400).json({ error: "Insufficient backend balance" });
    }

    // 🚀 STEP 4: SEND TX
    const tx = await contract.transfer(
      to,
      ethers.parseUnits(amount.toString(), 2),
      {
        gasLimit: 100000
      }
    );

    await tx.wait();

    res.json({
      success: true,
      txHash: tx.hash
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Transfer failed" });
  }
});

// Record a transfer (called after user transfers via frontend)
router.post('/record', async (req, res) => {
  try {
    const { from, to, amount, txHash } = req.body;

    if (!from || !to || !amount || !txHash) {
      return res.status(400).json({
        success: false,
        message: 'From, to, amount, and txHash are required'
      });
    }

    // Validate addresses
    if (!ethers.isAddress(from) || !ethers.isAddress(to)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid wallet addresses'
      });
    }

    // Check if transfer already recorded
    const existing = await Transfer.findOne({ txHash });
    if (existing) {
      return res.json({
        success: true,
        message: 'Transfer already recorded',
        transfer: existing
      });
    }

    // Verify transaction on blockchain
    const receipt = await blockchainService.getTransactionReceipt(txHash);
    
    if (!receipt) {
      return res.status(400).json({
        success: false,
        message: 'Transaction not found on blockchain'
      });
    }

    // Create transfer record
    const transfer = new Transfer({
      from: from.toLowerCase(),
      to: to.toLowerCase(),
      amount: amount,
      txHash: txHash,
      status: receipt.status === 1 ? 'confirmed' : 'failed'
    });

    await transfer.save();

    // Update user stats
    if (receipt.status === 1) {
      await User.findOneAndUpdate(
        { wallet: from.toLowerCase() },
        { $inc: { totalTransferred: amount } },
        { upsert: true }
      );
    }

    res.json({
      success: true,
      message: 'Transfer recorded successfully',
      transfer: transfer
    });
  } catch (error) {
    console.error('Record transfer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record transfer',
      error: error.message
    });
  }
});

// Get transfer history for a wallet
router.get('/history/:wallet', async (req, res) => {
  try {
    const { wallet } = req.params;
    const walletLower = wallet.toLowerCase();

    // Get both sent and received transfers
    const transfers = await Transfer.find({
      $or: [
        { from: walletLower },
        { to: walletLower }
      ]
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      transfers: transfers.map(t => ({
        ...t.toObject(),
        type: t.from === walletLower ? 'sent' : 'received'
      }))
    });
  } catch (error) {
    console.error('Get transfer history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transfer history',
      error: error.message
    });
  }
});

// Get transfer details
router.get('/details/:txHash', async (req, res) => {
  try {
    const { txHash } = req.params;

    const transfer = await Transfer.findOne({ txHash });

    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: 'Transfer not found'
      });
    }

    res.json({
      success: true,
      transfer: transfer
    });
  } catch (error) {
    console.error('Get transfer details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transfer details',
      error: error.message
    });
  }
});

module.exports = router;