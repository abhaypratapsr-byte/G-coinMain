const dotenv = require('dotenv');
dotenv.config();

// require('./workers/payoutWorker');
// require('./workers/mintWorker');

const express = require('express');
const cors = require('cors');
const connectDB = require('./db');
const blockchainService = require('./services/blockchain');
const adminAuth = (req, res, next) => {
  if (!req.headers['x-admin-key'] || req.headers['x-admin-key'] !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};

const rateLimit = require('express-rate-limit');
const { generalLimiter, paymentLimiter, redeemLimiter } = require('./middleware/security');
//const mintQueue = require('./queues/mintQueue');


const app = express();
app.set("trust proxy", 1);
// ─── CORS ────────────────────────────────────────────────────────────────────
// FIX: Trailing slashes in origin strings cause mismatches — strip them.
// Web3Auth OAuth popup also needs credentials support.
const allowedOrigins = [
  'https://g-coinmain.onrender.com',
  'https://g-coin-main-7lh2.vercel.app',
  'https://g-coin-main.vercel.app',
  process.env.FRONTEND_URL,
  process.env.ADMIN_URL
].filter(Boolean).map((o) => o.replace(/\/$/, '')); // strip trailing slash




const corsOptions = {
  origin: function (origin, callback) {
  if (!origin) return callback(null, true);

  const cleanOrigin = origin.replace(/\/$/, '');

  const allowed =
    allowedOrigins.includes(cleanOrigin) ||
    cleanOrigin.endsWith('.vercel.app');

  if (allowed) {
    callback(null, true);
  } else {
    console.log('Blocked origin:', cleanOrigin);
    callback(new Error('CORS: not allowed'));
  }
},
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key','X-Requested-With']
};

// FIX: Handle preflight OPTIONS requests globally
app.options('*', cors(corsOptions));
app.use(cors(corsOptions));

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use('/api/payment/webhook', express.raw({ 
  type: 'application/json', 
  verify: (req, _, buf) => { req.rawBody = buf.toString(); } 
}));
app.use('/webhook', express.raw({ 
  type: 'application/json', 
  verify: (req, _, buf) => { req.rawBody = buf.toString(); } 
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Request Logging (dev) ────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}


// ─── Routes ───────────────────────────────────────────────────────────────────
const paymentRoutes  = require('./routes/payment');
const redeemRoutes   = require('./routes/redeem');
const transferRoutes = require('./routes/transfer');
const userRoutes     = require('./routes/user');
const adminRoutes    = require('./routes/admin');

app.use('/api/payment', (req, res, next) => {
  if (req.path === '/webhook') {
    return next();
  }
  return paymentLimiter(req, res, next);
});
app.use('/api/redeem',  redeemLimiter);
app.use(generalLimiter);
app.use('/api/payment',  paymentRoutes);
app.use('/api/redeem',   redeemRoutes);
app.use('/api/transfer', transferRoutes);
app.use('/api/user',     userRoutes);
app.use('/api/admin',    adminRoutes);
// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'GCoin Backend is running',
    timestamp: new Date().toISOString(),
    blockchain: blockchainService.initialized,
    environment: process.env.NODE_ENV || 'development',
  });
});

app.get('/', (_req, res) => {
  res.json({
    name: 'GCoin Stablecoin Backend',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      payment:  '/api/payment',
      redeem:   '/api/redeem',
      transfer: '/api/transfer',
      user:     '/api/user',
      admin:    '/api/admin',
     payout: 'Handled via /api/redeem (queue system)',
      health:   '/api/health',
    },
  });
});

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.path}` });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('Global error:', err);

  // Handle CORS errors specifically
  if (err.message && err.message.startsWith('CORS:')) {
    return res.status(403).json({ success: false, message: err.message });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ─── Bootstrap ───────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 8001;

const startServer = async () => {
  try {
    console.log('\n🚀 Starting GCoin Backend...\n');

    await connectDB();
    console.log('✅ MongoDB connected');

    await blockchainService.initialize();
    console.log('✅ Blockchain service initialized');
    // const { startMintWorker }     = require('./services/mintQueue');
    // const { startRedeemListener } = require('./services/redeemListener');
    // startMintWorker();
    // startRedeemListener();
    // console.log('✅ Mint worker and redeem listener started');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n✅ Server running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 http://localhost:${PORT}\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => { console.log('SIGTERM → shutting down'); process.exit(0); });
process.on('SIGINT',  () => { console.log('SIGINT → shutting down');  process.exit(0); });

startServer();
