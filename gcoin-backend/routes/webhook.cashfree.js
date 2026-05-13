const express  = require('express');
const axios    = require('axios');
const router   = express.Router();
const { verifyCashfreeSignature } = require('../middleware/cashfreeWebhook');
// const { enqueueMint }             = require('../services/mintQueue');

router.post('/cashfree',
  express.raw({ type: 'application/json', verify: (req, _, buf) => { req.rawBody = buf.toString(); } }),
  verifyCashfreeSignature,
  async (req, res) => {
    const body  = JSON.parse(req.rawBody);
    const event = body.data;

    if (body.type !== 'PAYMENT_SUCCESS_WEBHOOK') {
      return res.status(200).json({ received: true });
    }

    const orderId       = event.order?.order_id;
    const walletAddress = event.order?.order_tags?.walletAddress;
    const amountINR     = parseFloat(event.payment?.payment_amount);

    if (!orderId || !walletAddress || !amountINR) {
      console.error('[WEBHOOK] Missing fields:', { orderId, walletAddress, amountINR });
      return res.status(400).json({ error: 'Invalid payload' });
    }

    // Double-check with Cashfree API — never trust webhook alone
    try {
      const verify = await axios.get(
        `https://sandbox.cashfree.com/pg/orders/${orderId}`,
        { headers: {
          'x-client-id':     process.env.CASHFREE_APP_ID,
          'x-client-secret': process.env.CASHFREE_SECRET_KEY,
          'x-api-version':   '2023-08-01',
        }}
      );

      if (verify.data.order_status !== 'PAID') {
        console.warn(`[WEBHOOK] Order ${orderId} not PAID — status: ${verify.data.order_status}`);
        return res.status(200).json({ received: true });
      }

      if (Math.abs(verify.data.order_amount - amountINR) > 0.01) {
        console.error(`[WEBHOOK] Amount mismatch for ${orderId}`);
        return res.status(200).json({ received: true });
      }
    } catch (err) {
      console.error('[WEBHOOK] Cashfree API verify failed:', err.message);
      return res.status(500).json({ error: 'Verification failed' });
    }

    try {
      // const jobId = await enqueueMint({ orderId, walletAddress, amountINR });
      res.status(200).json({ success: true });
    } catch (err) {
      console.error('[WEBHOOK] Enqueue failed:', err.message);
      res.status(500).json({ error: 'Failed to queue mint' });
    }
  }
);

module.exports = router;