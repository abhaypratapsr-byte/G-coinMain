const rateLimit = require('express-rate-limit');

const paymentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'Too many payment requests. Try again in a minute.' }
});

const redeemLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { error: 'Too many redeem requests. Try again later.' }
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests.' }
});

const requireAdminSecret = (req, res, next) => {
  const secret = req.headers['x-admin-secret'] || req.headers['x-admin-key'];
  if (!secret || (secret !== process.env.ADMIN_SECRET && secret !== process.env.ADMIN_KEY)) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  next();
};

module.exports = { paymentLimiter, redeemLimiter, generalLimiter, requireAdminSecret };