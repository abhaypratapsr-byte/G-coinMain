const crypto = require('crypto');

const verifyCashfreeSignature = (req, res, next) => {
  const signature = req.headers['x-webhook-signature'];
  const timestamp = req.headers['x-webhook-timestamp'];

  if (!signature || !timestamp) {
    return res.status(401).json({ error: 'Missing webhook headers' });
  }

  // Reject webhooks older than 5 minutes (replay attack protection)
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp)) > 300) {
    return res.status(401).json({ error: 'Webhook timestamp too old' });
  }

  const rawBody = req.rawBody;
  const message = `${timestamp}${rawBody}`;

  const expectedSignature = crypto
    .createHmac('sha256', process.env.CASHFREE_SECRET_KEY)
    .update(message)
    .digest('base64');

  if (expectedSignature !== signature) {
    console.warn('[SECURITY] Invalid Cashfree signature — possible spoofing attempt');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  next();
};

module.exports = { verifyCashfreeSignature };