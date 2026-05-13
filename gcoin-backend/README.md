# GCoin Stablecoin Backend

## 🚀 Deploy to Railway (5 Minutes)

### Step 1: Create .env File
```bash
cp .env.example .env
# All credentials are already filled in!
```

### Step 2: Push to GitHub
```bash
git init
git add .
git commit -m "GCoin backend initial commit"
git remote add origin https://github.com/YOUR_USERNAME/gcoin-backend.git
git push -u origin main
```

### Step 3: Deploy on Railway
1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your `gcoin-backend` repository
4. Railway will auto-detect Node.js

### Step 4: Add Environment Variables
In Railway dashboard → Variables → Raw Editor, paste:

```env
MONGODB_URI=mongodb://gcoin_admin:Gcoin%4012345@ac-ryota5o-shard-00-00.axy02uc.mongodb.net:27017,ac-ryota5o-shard-00-01.axy02uc.mongodb.net:27017,ac-ryota5o-shard-00-02.axy02uc.mongodb.net:27017/?ssl=true&replicaSet=atlas-11mnu2-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0
RPC=https://polygon-rpc.com
PRIVATE_KEY=3b88e27e1e99e0ed0cdff8a2d3b00dd1681ae69983628ae1f1478d951f2006c8
CONTRACT=0xa08862c6eaBBF4a8527B1C7abd9E3FE38A2d943f
RAZORPAY_KEY=rzp_test_STwx0saGKQbjnX
RAZORPAY_SECRET=gC9lPpLjv2uRO6adt33jWZwu
RAZORPAY_ACCOUNT_NUMBER=ST9SLfpYEWvU0P
ADMIN_KEY=Abhishek@1
PORT=3001
NODE_ENV=production
CORS_ORIGINS=http://localhost:3000,https://polygon-gcn.preview.emergentagent.com
```

### Step 5: Get Your URL
- Railway will deploy automatically
- Copy your deployment URL (e.g., `https://gcoin-backend-production.up.railway.app`)
- Add this URL to `CORS_ORIGINS` environment variable
- Restart the deployment

### Step 6: Update Frontend (if needed)
If your backend URL is different from frontend URL, update `/app/frontend/.env`:
```env
REACT_APP_BACKEND_URL=https://your-railway-url.up.railway.app
```

---

## 🚀 Alternative: Deploy to Render

1. Go to [render.com](https://render.com)
2. New → Web Service → Connect GitHub
3. Configure:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Add all environment variables from above
5. Deploy!

---

## 📁 Project Structure

```
gcoin-backend/
├── server.js              # Main Express server
├── package.json           # Dependencies
├── .env.example           # Environment template
├── .gitignore            # Git ignore rules
├── abi.json              # Smart contract ABI
├── README.md             # This file
├── models/               # MongoDB models
│   ├── User.js
│   ├── Payment.js
│   └── Redeem.js
└── routes/               # API routes
    ├── payment.js        # Razorpay + minting
    ├── redeem.js         # Token redemption
    ├── user.js           # User history
    ├── admin.js          # Admin operations
    └── transfer.js       # Token transfers
```

---

## 🔧 Local Development

```bash
# Install dependencies
npm install

# Create .env from template
cp .env.example .env

# Start server
npm start

# Or with auto-reload
npm run dev
```

---

## 📊 API Endpoints

### Payment
- `POST /api/payment/create-order` - Create Razorpay order
- `POST /api/payment/verify-payment` - Verify payment & mint GCoin

### Redeem
- `POST /api/redeem/request` - Request GCoin redemption (burns tokens)

### User
- `GET /api/user/history/:wallet` - Get user transaction history

### Admin (requires `x-admin-key` header)
- `GET /api/admin/redeems/pending` - Get pending redemptions
- `POST /api/admin/redeems/:id/complete` - Mark redemption as completed
- `POST /api/transfer` - Transfer GCoin tokens

### Health Check
- `GET /test` - Check server status
- `GET /ping` - Simple ping test

---

## 🧪 Testing

```bash
# Test health endpoint
curl https://your-backend-url.com/test

# Should return:
# {"status":"ok","mongo":true,"wallet":"0x...","contract":"0xa08..."}
```

---

## 🔐 Security

- Never commit `.env` file
- Keep private keys secure
- Use environment variables for all sensitive data
- CORS is enabled only for whitelisted origins
- Admin routes require `ADMIN_KEY` header

---

## 📞 Support

For deployment issues, check:
1. Railway/Render logs
2. Environment variables are set correctly
3. MongoDB connection string is valid
4. Blockchain RPC is accessible

All credentials are pre-configured and ready to use!
