# 🚀 Quick Start Guide

Get your GCoin platform running in 5 minutes!

## ✅ Prerequisites

- Node.js 18+
- MongoDB account (MongoDB Atlas free tier)
- MetaMask wallet
- Razorpay account (test mode)

---

## 🏃 Quick Start

### 1. Start Backend
```bash
cd /app/gcoin-backend
node server.js
```
✅ Backend running on `http://localhost:8002`

### 2. Start Frontend
```bash
cd /app/gcoin-frontend
yarn dev
```
✅ Frontend running on `http://localhost:3000`

### 3. Start Admin Panel
```bash
cd /app/gcoin-admin
yarn dev
```
✅ Admin panel running on `http://localhost:3001`

---

## 🧪 Test the Platform

### User Flow (Frontend - Port 3000)

1. **Connect Wallet**:
   - Open `http://localhost:3000`
   - Click "Connect Wallet"
   - Approve MetaMask connection

2. **Buy GCoin**:
   - Enter amount (e.g., ₹10)
   - Click "Buy GCoin"
   - Complete Razorpay test payment
   - Wait for tokens to be minted

3. **Transfer GCoin**:
   - Go to "Transfer" tab
   - Enter recipient wallet address
   - Enter amount
   - Click "Send"
   - Approve MetaMask transaction

4. **Redeem GCoin**:
   - Go to "Redeem" tab
   - Enter amount (min ₹100)
   - Enter bank details
   - Click "Submit Redeem Request"

5. **View History**:
   - Go to "History" tab
   - See all your transactions

### Admin Flow (Admin Panel - Port 3001)

1. **Login**:
   - Open `http://localhost:3001`
   - Enter admin key: `Abhishek@1`
   - Click "Login"

2. **View Dashboard**:
   - See platform statistics
   - Total users, minted, redeemed, etc.

3. **Complete Redeems**:
   - Go to "Redeems" tab
   - Review pending redeem requests
   - Click "Complete Redeem"
   - Confirms burn + payout

4. **Monitor Transfers**:
   - Go to "Transfers" tab
   - View all P2P transfers

---

## 🔑 Default Credentials

**Admin Key**: `Abhishek@1`  
**Backend Port**: `8002`  
**Frontend Port**: `3000`  
**Admin Port**: `3001`

**Test Razorpay Cards**:
- Card: `4111 1111 1111 1111`
- CVV: Any 3 digits
- Expiry: Any future date

---

## 📡 API Quick Test

```bash
# Health check
curl http://localhost:8002/api/health

# Get stats (with admin key)
curl -H "x-admin-key: Abhishek@1" http://localhost:8002/api/admin/stats
```

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check if port 8002 is free
lsof -i :8002

# Check MongoDB connection
# Verify MONGODB_URI in /app/gcoin-backend/.env
```

### Frontend won't start
```bash
# Check if port 3000 is free
lsof -i :3000

# Reinstall dependencies
cd /app/gcoin-frontend
rm -rf node_modules yarn.lock
yarn install
```

### Can't connect wallet
- Ensure MetaMask is installed
- Switch to Polygon Mainnet (Chain ID: 137)
- Add network if not present:
  - RPC: `https://polygon-rpc.com`
  - Chain ID: `137`
  - Currency: `MATIC`

### Transaction failed
- Check wallet has MATIC for gas
- Get testnet MATIC from faucet: https://faucet.polygon.technology/
- Check contract is not paused

---

## 📁 Project Structure

```
/app/
├── gcoin-backend/          # Express API
│   ├── db/                 # MongoDB connection
│   ├── middleware/         # Auth middleware
│   ├── models/             # Mongoose models
│   ├── routes/             # API routes
│   ├── services/           # Blockchain & Razorpay
│   ├── .env                # Environment variables
│   ├── server.js           # Main server file
│   └── abi.json            # Smart contract ABI
│
├── gcoin-frontend/         # Next.js User App
│   ├── app/
│   │   ├── page.tsx        # Main page (all tabs)
│   │   ├── layout.tsx      # Root layout
│   │   └── globals.css     # Global styles
│   └── .env.local          # Frontend env vars
│
├── gcoin-admin/            # Next.js Admin Panel
│   ├── app/
│   │   ├── page.tsx        # Admin dashboard
│   │   ├── layout.tsx      # Root layout
│   │   └── globals.css     # Global styles
│   └── .env.local          # Admin env vars
│
├── README.md               # Main documentation
├── DEPLOYMENT_GUIDE.md     # Production deployment
└── QUICK_START.md          # This file
```

---

## 🎯 Next Steps

1. **Test the full flow** (buy → transfer → redeem)
2. **Review the code** to understand how it works
3. **Read DEPLOYMENT_GUIDE.md** for production deployment
4. **Customize the UI** to match your brand
5. **Deploy to production** when ready!

---

## 📚 Learn More

- [GCoin Documentation](./README.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Polygon Docs](https://docs.polygon.technology/)
- [Razorpay Docs](https://razorpay.com/docs/)
- [Next.js Docs](https://nextjs.org/docs)
- [Ethers.js Docs](https://docs.ethers.org/)

---

**Happy Building! 🚀**
