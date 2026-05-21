const { ethers }   = require('ethers');
const RedeemLedger = require('../models/RedeemLedger');
const GCoinABI     = require('../abi.json');

const startRedeemListener = () => {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, GCoinABI, provider);

  // Event: Redeemed(address user, uint256 amount, bytes32 redeemId)
  contract.on('Redeemed', async (user, amount, redeemId, event) => {
    const txHash    = event.log.transactionHash;
    const gcnUnits  = Number(amount);
    const amountINR = gcnUnits / 100;

    console.log(`[REDEEM] ${user} | ₹${amountINR} | redeemId: ${redeemId} | tx: ${txHash}`);

    try {
      await RedeemLedger.create({
        walletAddress: user,
        gcnUnits,
        amountINR,
        redeemId,       // bytes32 from contract
        utrRef: '',     // filled later by admin when processing payout
        txHash,
        blockNumber: event.log.blockNumber,
        status: 'pending',
      });
      console.log(`[REDEEM] ✅ Saved | ₹${amountINR} pending payout`);
    } catch (err) {
      if (err.code === 11000) {
        console.warn(`[REDEEM] Duplicate txHash — already recorded`);
      } else {
        console.error('[REDEEM] DB error:', err.message);
      }
    }
  });

  provider.on('error', () => {
    console.error('[REDEEM LISTENER] Provider error — reconnecting in 10s');
    setTimeout(startRedeemListener, 10000);
  });

  console.log('[REDEEM LISTENER] Active');
};

module.exports = { startRedeemListener };