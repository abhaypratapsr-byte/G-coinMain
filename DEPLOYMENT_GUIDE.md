# 🚀 GCoin Production Deployment Guide

## 📋 Pre-Deployment Checklist

### 1. Smart Contract Deployment
- [ ] Deploy GCoin contract to Polygon Mainnet
- [ ] Verify contract on Polygonscan
- [ ] Note down contract address
- [ ] Transfer ownership to secure wallet
- [ ] Test mint/burn functions

### 2. Environment Preparation
- [ ] MongoDB Atlas production cluster
- [ ] Razorpay Live account & API keys
- [ ] Production wallet with MATIC for gas
- [ ] Domain names (frontend, admin, API)
- [ ] SSL certificates

### 3. Security Checklist
- [ ] Change ADMIN_KEY to strong password
- [ ] Use separate MongoDB user with minimal permissions
- [ ] Enable MongoDB IP whitelist
- [ ] Rotate Razorpay webhook secret
- [ ] Never commit .env files to Git
- [ ] Use environment variables in production

---

## 🌐 Railway Deployment (Recommended)

### Step 1: Backend Deployment

1. **Create Railway Project**:
   ```bash
   # Login to Railway
   railway login
   
   # Initialize project
   cd /app/gcoin-backend
   railway init
   ```

2. **Configure Environment Variables** in Railway Dashboard:
   ```env
   # Blockchain
   RPC_URL=https://polygon-rpc.com
   PRIVATE_KEY=<your_mainnet_private_key>
   CONTRACT_ADDRESS=<mainnet_contract_address>
   
   # Razorpay LIVE keys
   RAZORPAY_KEY_ID=rzp_live_xxx
   RAZORPAY_KEY_SECRET=<live_secret>
   RAZORPAY_ACCOUNT_NUMBER=<account_number>
   
   # MongoDB Production
   MONGODB_URI=<production_mongodb_uri>
   DB_NAME=gcoin_production
   
   # Admin
   ADMIN_KEY=<strong_random_password>
   
   # Server
   PORT=8001
   NODE_ENV=production
   FRONTEND_URL=https://your-frontend-domain.com
   ADMIN_URL=https://your-admin-domain.com
   ```

3. **Deploy**:
   ```bash
   railway up
   ```

4. **Note Backend URL**: `https://gcoin-backend.railway.app`

---

### Step 2: Frontend Deployment

1. **Update `.env.local` with production values**:
   ```env
   NEXT_PUBLIC_API_URL=https://gcoin-backend.railway.app/api
   NEXT_PUBLIC_CONTRACT_ADDRESS=<mainnet_contract_address>
   NEXT_PUBLIC_RPC_URL=https://polygon-rpc.com
   NEXT_PUBLIC_CHAIN_ID=137
   NEXT_PUBLIC_RAZORPAY_KEY=rzp_live_xxx
   ```

2. **Deploy to Vercel** (Recommended for Next.js):
   ```bash
   cd /app/gcoin-frontend
   
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   vercel --prod
   ```

3. **Configure Custom Domain** (optional):
   - Add domain in Vercel dashboard
   - Update DNS records

---

### Step 3: Admin Panel Deployment

1. **Update `.env.local`**:
   ```env
   NEXT_PUBLIC_API_URL=https://gcoin-backend.railway.app/api
   NEXT_PUBLIC_ADMIN_KEY=<strong_random_password>
   ```

2. **Deploy to Vercel**:
   ```bash
   cd /app/gcoin-admin
   vercel --prod
   ```

3. **Restrict Access** (optional):
   - Use Vercel Password Protection
   - Or implement IP whitelisting

---

## 🔐 Security Best Practices

### 1. Environment Variables
```bash
# Never commit these files:
.env
.env.local
.env.production

# Add to .gitignore:
echo ".env*" >> .gitignore
```

### 2. MongoDB Security
```javascript
// Create production user with limited permissions
use gcoin_production
db.createUser({
  user: "gcoin_app",
  pwd: "<strong_password>",
  roles: [
    { role: "readWrite", db: "gcoin_production" }
  ]
})
```

### 3. API Rate Limiting
Add to backend `server.js`:
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### 4. CORS Configuration
Update backend `.env`:
```env
FRONTEND_URL=https://gcoin.yourdomain.com
ADMIN_URL=https://admin.gcoin.yourdomain.com
```

---

## 📊 Monitoring & Logging

### 1. Application Monitoring
- Use **Railway Logs** for backend
- Use **Vercel Analytics** for frontend
- Set up **Sentry** for error tracking

### 2. Database Monitoring
- Enable MongoDB Atlas Monitoring
- Set up alerts for:
  - High CPU usage
  - Low disk space
  - Connection errors

### 3. Blockchain Monitoring
- Monitor wallet balance (gas fees)
- Track failed transactions
- Set up alerts for low balance

---

## 🔄 Backup Strategy

### 1. Database Backups
```bash
# Automated MongoDB Atlas backups (recommended)
# Or manual backup:
mongodump --uri="<MONGODB_URI>" --out=/backups/gcoin-$(date +%Y%m%d)
```

### 2. Code Backups
- Maintain Git repository
- Tag releases: `git tag v1.0.0`
- Use GitHub/GitLab for redundancy

---

## 🧪 Testing in Production

### 1. Smoke Tests
```bash
# Backend health
curl https://gcoin-backend.railway.app/api/health

# Create test order (small amount)
curl -X POST https://gcoin-backend.railway.app/api/payment/create-order \
  -H "Content-Type: application/json" \
  -d '{"wallet":"0x...","amount":1}'
```

### 2. Frontend Testing
- Connect MetaMask (Polygon Mainnet)
- Buy ₹1 GCoin (test payment)
- Transfer to another wallet
- Submit redeem request

### 3. Admin Testing
- Login with admin key
- View dashboard stats
- Complete a test redeem

---

## 📈 Scaling Considerations

### 1. Backend Scaling
- Railway auto-scales based on load
- Consider Redis for caching
- Use load balancer for multiple instances

### 2. Database Scaling
- MongoDB Atlas auto-scales storage
- Upgrade cluster tier as needed
- Add read replicas for high traffic

### 3. Frontend Optimization
- Enable Vercel Edge Network
- Optimize images with Next.js Image
- Implement lazy loading

---

## 🚨 Incident Response Plan

### 1. Backend Down
1. Check Railway logs
2. Verify MongoDB connection
3. Check RPC provider status
4. Restart service if needed

### 2. Payment Failure
1. Check Razorpay dashboard
2. Verify webhook configuration
3. Review payment logs
4. Contact Razorpay support if needed

### 3. Smart Contract Issue
1. Check Polygonscan for failed transactions
2. Verify contract is not paused
3. Check wallet has sufficient MATIC
4. Review contract events

---

## 📞 Support Contacts

- **Razorpay Support**: support@razorpay.com
- **MongoDB Support**: support@mongodb.com
- **Railway Support**: team@railway.app
- **Vercel Support**: support@vercel.com

---

## 🔄 Rollback Procedure

### If Issues Occur:

1. **Backend Rollback**:
   ```bash
   railway rollback
   ```

2. **Frontend Rollback**:
   ```bash
   vercel rollback
   ```

3. **Database Rollback**:
   ```bash
   mongorestore --uri="<MONGODB_URI>" /backups/gcoin-20240101
   ```

---

## ✅ Post-Deployment Verification

- [ ] All services running
- [ ] Frontend accessible
- [ ] Admin panel accessible
- [ ] API endpoints responding
- [ ] MongoDB connected
- [ ] Smart contract accessible
- [ ] Test payment successful
- [ ] Test transfer successful
- [ ] Test redeem workflow
- [ ] Monitoring/alerts configured
- [ ] Backups configured

---

## 📝 Maintenance Schedule

### Daily
- Monitor error logs
- Check system health
- Review transaction volume

### Weekly
- Review pending redeems
- Check wallet balance (gas)
- Update dependencies if needed

### Monthly
- Database optimization
- Security audit
- Performance review
- Backup verification

---

**🎉 Your GCoin platform is production-ready!**
