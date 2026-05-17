# GCoin - INR-Backed Stablecoin Platform

Complete production-ready platform for GCoin, an INR-backed stablecoin on Polygon blockchain.

## 🏗️ Architecture

```
/
├── gcoin-backend/          # Node.js + Express API
├── gcoin-frontend/         # Next.js User Frontend
└── gcoin-admin/            # Next.js Admin Panel
```

---

## 🧩 Root Workspace

This repository is organized as a Yarn workspace monorepo. The root project centrally manages the three apps below:

- `gcoin-frontend`
- `gcoin-admin`
- `gcoin-backend`

### Root commands

```bash
# Install dependencies for all workspaces
yarn install

# Start all services together
yarn dev

# Start a single service
yarn dev:frontend
yarn dev:admin
yarn dev:backend

# Build the Next.js apps
yarn build:frontend
yarn build:admin
```

---

## 🚀 Features

### User Frontend (`gcoin-frontend`)
- 🔐 MetaMask wallet connection
- 💰 Buy GCoin with Razorpay (INR → GCoin)
- 🔄 Redeem GCoin to INR (with bank details)
- 📤 P2P Transfer (wallet to wallet)
- 📊 Transaction history

### Admin Panel (`gcoin-admin`)
- 🔑 Secure admin authentication
- 📈 Dashboard with platform statistics
- ✅ Manage redeem requests (burn + payout)
- 👁️ Monitor all P2P transfers
- 📋 View all transactions

### Backend API (`gcoin-backend`)
- 💳 Razorpay payment integration
- ⛓️ Smart contract integration (mint, burn)
- 🗄️ MongoDB data storage
- 🔒 Admin authentication middleware
- 📡 RESTful API endpoints

---

## 📦 Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, MongoDB
- **Blockchain**: Polygon Mainnet, Ethers.js v6
- **Payment**: Razorpay (Orders, Payments, Payouts)

---

## 🔧 Setup & Installation

### 1. Backend Setup

```bash
cd /app/gcoin-backend

# Install dependencies (already done)
yarn install

# Configure environment variables
# Edit .env file with your credentials

# Start backend
node server.js
```

Backend runs on: `http://localhost:8002`

### 2. Frontend Setup

```bash
cd /app/gcoin-frontend

# Install dependencies (already done)
yarn install

# Configure environment variables
# Edit .env.local file

# Start development server
yarn dev
```

Frontend runs on: `http://localhost:3000`

### 3. Admin Panel Setup

```bash
cd /app/gcoin-admin

# Install dependencies (already done)
yarn install

# Configure environment variables
# Edit .env.local file

# Start development server
yarn dev
```

Admin panel runs on: `http://localhost:3001`

---

## 🔑 Environment Variables

### Backend (`.env`)
```env
# Blockchain
RPC_URL=https://polygon-rpc.com
PRIVATE_KEY=your_wallet_private_key
CONTRACT_ADDRESS=0xa08862c6eaBBF4a8527B1C7abd9E3FE38A2d943f

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx
RAZORPAY_ACCOUNT_NUMBER=xxx

# MongoDB
MONGODB_URI=mongodb://...
DB_NAME=gcoin

# Admin
ADMIN_KEY=Abhishek@1

# Server
PORT=8002
NODE_ENV=production
```

### Frontend (`.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8002/api
NEXT_PUBLIC_CONTRACT_ADDRESS=0xa08862c6eaBBF4a8527B1C7abd9E3FE38A2d943f
NEXT_PUBLIC_RPC_URL=https://polygon-rpc.com
NEXT_PUBLIC_CHAIN_ID=137
NEXT_PUBLIC_RAZORPAY_KEY=rzp_test_xxx
```

### Admin (`.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8002/api
NEXT_PUBLIC_ADMIN_KEY=Abhishek@1
```

---

## 📡 API Endpoints

### Payment Routes
- `POST /api/payment/create-order` - Create Razorpay order
- `POST /api/payment/verify-payment` - Verify payment & mint tokens
- `POST /api/payment/webhook` - Razorpay webhook

### Redeem Routes
- `POST /api/redeem/request` - Submit redeem request
- `GET /api/redeem/history/:wallet` - Get redeem history
- `GET /api/redeem/status/:redeemId` - Get redeem status

### Transfer Routes
- `POST /api/transfer/record` - Record P2P transfer
- `GET /api/transfer/history/:wallet` - Get transfer history
- `GET /api/transfer/details/:txHash` - Get transfer details

### User Routes
- `GET /api/user/profile/:wallet` - Get user profile & stats
- `GET /api/user/transactions/:wallet` - Get all transactions

### Admin Routes (requires auth header)
- `GET /api/admin/stats` - Get platform statistics
- `GET /api/admin/redeems` - Get all redeems
- `POST /api/admin/redeems/:id/complete` - Complete redeem (burn + payout)
- `GET /api/admin/transfers` - Get all transfers
- `GET /api/admin/users` - Get all users

### Payout Routes
- `POST /api/payout/create` - Create payout (admin only)
- `GET /api/payout/:id/status` - Get payout status
- `GET /api/payout/list` - List all payouts

---

## 🔐 Security

- Admin routes protected with `x-admin-key` header
- Payment verification with Razorpay signature
- Wallet-based authentication for user actions
- Bank details encrypted in database

---

## 🌐 Deployment

### Option 1: Railway (Recommended)

1. **Push to GitHub**:
   - Use Emergent's "Save to GitHub" feature
   
2. **Deploy Backend**:
   - Connect GitHub repo to Railway
   - Set root directory: `gcoin-backend`
   - Add environment variables
   - Railway will auto-deploy

3. **Deploy Frontend**:
   - Create new Railway service
   - Set root directory: `gcoin-frontend`
   - Add environment variables
   - Update `NEXT_PUBLIC_API_URL` to backend URL

4. **Deploy Admin**:
   - Create new Railway service
   - Set root directory: `gcoin-admin`
   - Add environment variables
   - Update `NEXT_PUBLIC_API_URL` to backend URL

### Option 2: Separate Hosting

- **Backend**: Deploy to Railway, Render, or any Node.js host
- **Frontend**: Deploy to Vercel, Netlify
- **Admin**: Deploy to Vercel, Netlify

---

## 🚀 Mainnet Deployment

To move from testnet to mainnet:

1. **Deploy Contract to Polygon Mainnet**:
   ```bash
   # Use your Hardhat/Foundry setup
   # Deploy to Polygon mainnet
   ```

2. **Update Environment Variables**:
   ```env
   # Backend
   RPC_URL=https://polygon-rpc.com
   CONTRACT_ADDRESS=<new_mainnet_contract_address>
   
   # Frontend
   NEXT_PUBLIC_RPC_URL=https://polygon-rpc.com
   NEXT_PUBLIC_CONTRACT_ADDRESS=<new_mainnet_contract_address>
   NEXT_PUBLIC_CHAIN_ID=137
   ```

3. **Switch Razorpay to Live Mode**:
   - Replace test keys with live keys
   - Remove `test_` prefix from keys

---

## 📊 Database Schema

### User Collection
```javascript
{
  wallet: String (unique),
  totalMinted: Number,
  totalRedeemed: Number,
  totalTransferred: Number,
  createdAt: Date
}
```

### Payment Collection
```javascript
{
  wallet: String,
  amount: Number,
  gcoinAmount: Number,
  razorpay_order_id: String,
  razorpay_payment_id: String,
  status: 'pending' | 'completed' | 'failed',
  txHash: String,
  createdAt: Date
}
```

### Redeem Collection
```javascript
{
  wallet: String,
  amount: Number,
  inrAmount: Number,
  bankDetails: {
    accountNumber: String,
    ifsc: String,
    accountHolderName: String,
    bankName: String
  },
  status: 'pending' | 'processing' | 'completed' | 'failed',
  burnTxHash: String,
  payoutId: String,
  createdAt: Date,
  completedAt: Date
}
```

### Transfer Collection
```javascript
{
  from: String,
  to: String,
  amount: Number,
  txHash: String,
  status: 'pending' | 'confirmed' | 'failed',
  createdAt: Date
}
```

---

## 🧪 Testing

1. **Backend Health Check**:
   ```bash
   curl http://localhost:8002/api/health
   ```

2. **User Flow**:
   - Connect MetaMask
   - Buy GCoin (test with ₹1)
   - Transfer to another wallet
   - Submit redeem request

3. **Admin Flow**:
   - Login with admin key
   - View pending redeems
   - Complete redeem (test mode)

---

## 🔄 User Flow

1. User connects MetaMask wallet
2. User buys GCoin with Razorpay
3. Backend verifies payment
4. Backend mints GCoin to user's wallet
5. User can:
   - Transfer GCoin to other wallets (P2P)
   - Redeem GCoin to INR (submit bank details)
6. Admin reviews redeem requests
7. Admin completes redeem:
   - Burns GCoin from user's wallet
   - Initiates INR payout via Razorpay

---

## 📝 Notes

- **Current Network**: Polygon Mainnet (Chain ID: 137)
- **1 GCoin = 1 INR** (1:1 peg)
- Minimum redeem: ₹100
- Backend port: 8002 (default FastAPI on 8001)

---

## 🆘 Support

For issues or questions:
1. Check backend logs: `/tmp/gcoin-backend.log`
2. Check MongoDB connection
3. Verify smart contract on Polygonscan
4. Test Razorpay webhooks

---

## 📜 License

MIT License - Feel free to use for your project!

---

**Built with ❤️ for the future of stablecoins**
