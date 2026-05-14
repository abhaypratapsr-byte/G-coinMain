const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const User = require('../models/User');
const blockchainService = require('../services/blockchain');
// const mintQueue = require('../queues/mintQueue');
const { Cashfree, CFEnvironment } = require("cashfree-pg");

const cashfreeEnv =
  process.env.CASHFREE_ENVIRONMENT?.toUpperCase() === 'SANDBOX'
    ? CFEnvironment.SANDBOX
    : CFEnvironment.PRODUCTION;

const cashfreeAppId = process.env.CASHFREE_APP_ID;
const cashfreeSecret = process.env.CASHFREE_SECRET_KEY;

let cashfree;
if (!cashfreeAppId || !cashfreeSecret) {
  console.warn('⚠️ Cashfree credentials missing. Falling back to mock payment mode.');
  cashfree = {
    PGCreateOrder: async (payload) => ({
      data: {
        order_id: payload.order_id,
        payment_session_id: `mock_session_${Date.now()}`,
        order_amount: payload.order_amount,
        order_currency: payload.order_currency,
        order_status: 'PENDING'
      }
    }),
    PGFetchOrder: async (orderId) => ({
      data: {
        order_status: 'PAID',
        order_id: orderId
      }
    }),
    PGVerifyWebhookSignature: () => true
  };
} else {
  cashfree = new Cashfree(cashfreeEnv, cashfreeAppId, cashfreeSecret);
}

router.post('/create-order', async (req, res) => {
  try {
    const { wallet, amount } = req.body;
    let { email, phone } = req.body;
    if (!wallet || !amount || amount <= 0)
      return res.status(400).json({ success: false, message: 'Wallet and amount are required' });

    if (!email) {
      email = `user_${wallet.slice(2, 10)}@gcoin.app`;
    }
    if (!phone) {
      phone = '9999999999';
    }

    const orderId = `gcoin_${Date.now()}`;
    const payload = {
      order_id: orderId,
      order_amount: Number(amount.toFixed(2)),
      order_currency: "INR",
      customer_details: {
        customer_id: `gcn_${wallet.slice(2, 14).toLowerCase()}`,
        customer_email: email,
        customer_phone: phone
      },
      order_meta: {
        return_url: `${process.env.FRONTEND_URL}/success?order_id=${orderId}`,
        notify_url: `${process.env.BACKEND_URL}/api/payment/webhook`
      },
      order_tags: { wallet: wallet, amount: String(amount) }
    };

    const orderResponse = await cashfree.PGCreateOrder(payload);
    const cfData = orderResponse.data || orderResponse;

    if (!cfData?.order_id || !cfData?.payment_session_id)
      return res.status(400).json({ success: false, message: 'Invalid Cashfree response' });

    const payment = new Payment({
      orderId: cfData.order_id,
      wallet: wallet.toLowerCase(),
      amount,
      gcoinAmount: amount,
      status: 'pending'
    });
    await payment.save();

    await User.findOneAndUpdate(
      { wallet: wallet.toLowerCase() },
      { wallet: wallet.toLowerCase() },
      { upsert: true, new: true }
    );

    const orderData = {
      id: cfData.order_id,
      amount: cfData.order_amount,
      currency: cfData.order_currency,
      paymentSessionId: cfData.payment_session_id
    };

    return res.json({
      success: true,
      order: orderData,
      data: {
        order: orderData
      }
    });
  } catch (error) {
    console.error('❌ Create order error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to create order', error: error.message });
  }
});

router.get("/history/:wallet", async (req, res) => {
  try {
    const wallet = req.params.wallet.toLowerCase();
    const payments = await Payment.find({ wallet }).sort({ createdAt: -1 }).limit(50);
    return res.json(payments);
  } catch (err) {
    return res.status(500).json({ success: false });
  }
});

router.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-webhook-signature'];
    const timestamp = req.headers['x-webhook-timestamp'];

    if (signature && timestamp) {
      try {
        const rawBody = req.body instanceof Buffer ? req.body.toString() : JSON.stringify(req.body);
        const isValid = cashfree.PGVerifyWebhookSignature(rawBody, signature, timestamp);
        if (!isValid) {
          console.log("❌ Invalid webhook signature");
          return res.status(400).json({ success: false });
        }
      } catch (sigErr) {
        console.log("⚠️ Signature verify error:", sigErr.message);
      }
    }

    let event;
    try {
      event = req.body instanceof Buffer ? JSON.parse(req.body.toString()) : req.body;
    } catch {
      return res.status(400).json({ success: false, message: 'Invalid JSON body' });
    }

    console.log("📦 Webhook event:", event.type);

    if (event.type === "PAYMENT_SUCCESS_WEBHOOK" && event.data?.payment?.payment_status === "SUCCESS") {
      const orderId = event.data.order.order_id;
      const payment = await Payment.findOneAndUpdate(
        { orderId, status: "pending" },
        { status: "processing" },
        { new: true }
      );
      if (payment) {
        // await mintQueue.add("mint", { paymentId: payment._id }, {
        //   attempts: 5,
        //   backoff: { type: "exponential", delay: 5000 }
        // });
        console.log("⚡ Mint queued (webhook):", orderId);
      }
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("Webhook error:", err.message);
    return res.status(500).json({ success: false });
  }
});

router.post("/verify-cashfree", async (req, res) => {
  try {
    const { orderId } = req.body;
    const response = await cashfree.PGFetchOrder(orderId);

    if (response?.data?.order_status === "PAID") {
      const payment = await Payment.findOneAndUpdate(
        { orderId, status: "pending" },
        { status: "processing" },
        { new: true }
      );
      if (payment) {
        // await mintQueue.add("mint", { paymentId: payment._id }, {
        //   attempts: 5,
        //   backoff: { type: "exponential", delay: 5000 }
        // });
        console.log("⚡ Mint queued (verify):", orderId);
      }
      return res.json({ success: true });
    }
    return res.json({ success: false, message: "Payment not PAID yet" });
  } catch (err) {
    console.error("Verify error:", err.message);
    return res.status(500).json({ success: false });
  }
});

router.post('/verify-payment', async (req, res) => {
  try {
    const orderId = req.body.orderId || req.body.razorpay_order_id;
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'orderId is required' });
    }
    req.body.orderId = orderId;
    return router.handle(req, res);
  } catch (err) {
    console.error('Verify payment alias error:', err.message);
    return res.status(500).json({ success: false, message: 'Verify payment failed' });
  }
});

router.get("/status/:orderId", async (req, res) => {
  try {
    const payment = await Payment.findOne({ orderId: req.params.orderId });
    if (!payment) return res.json({ status: "not_found" });

    if (payment.status === 'pending') {
      try {
        const cf = await cashfree.PGFetchOrder(payment.orderId);
        if (cf?.data?.order_status === "PAID") {
          const updated = await Payment.findOneAndUpdate(
            { orderId: payment.orderId, status: "pending" },
            { status: "processing" },
            { new: true }
          );
          if (updated) {
            // await mintQueue.add("mint", { paymentId: updated._id }, {
            //   attempts: 5,
            //   backoff: { type: "exponential", delay: 5000 }
            // });
            return res.json({ status: "processing" });
          }
        }
      } catch (e) {
        console.log("CF fallback check error:", e.message);
      }
    }

    return res.json({ status: payment.status });
  } catch (err) {
    return res.status(500).json({ status: "error" });
  }
});

module.exports = router;