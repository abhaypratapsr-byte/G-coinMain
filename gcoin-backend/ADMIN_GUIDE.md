# 🔐 GCoin Admin Guide

## 📋 **Admin Overview**

Your GCoin backend has built-in admin features for managing redemptions and token transfers.

**Admin Key:** `Abhishek@1` (stored in backend `.env` as `ADMIN_KEY`)

---

## 🎯 **Admin Features**

### ✅ **What Admin Can Do:**

1. **View Pending Redemptions** - See all users waiting for INR payout
2. **Complete Redemptions** - Mark redemptions as paid
3. **Transfer Tokens** - Send GCoin to any wallet address

---

## 🔧 **Admin API Endpoints**

All admin routes require the `x-admin-key` header with value `Abhishek@1`

### 1. **Get Pending Redemptions**
```bash
GET /api/admin/redeems/pending
```

**Example:**
```bash
curl -X GET https://your-backend-url.com/api/admin/redeems/pending \
  -H "x-admin-key: Abhishek@1"
```

**Response:**
```json
[
  {
    "_id": "65abc123...",
    "wallet": "0x742d35cc6634c0532925a3b844bc9e7595f0beb7",
    "amount": 1000,
    "txHash": "0x123abc...",
    "status": "pending",
    "createdAt": "2025-04-07T10:30:00.000Z"
  }
]
```

---

### 2. **Complete Redemption (Mark as Paid)**
```bash
POST /api/admin/redeems/:id/complete
```

**Example:**
```bash
curl -X POST https://your-backend-url.com/api/admin/redeems/65abc123/complete \
  -H "x-admin-key: Abhishek@1"
```

**Response:**
```json
{
  "_id": "65abc123...",
  "wallet": "0x742d35cc6634c0532925a3b844bc9e7595f0beb7",
  "amount": 1000,
  "status": "completed",
  "processedAt": "2025-04-07T11:00:00.000Z"
}
```

---

### 3. **Transfer Tokens**
```bash
POST /api/transfer
```

**Example:**
```bash
curl -X POST https://your-backend-url.com/api/transfer \
  -H "x-admin-key: Abhishek@1" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "0x742d35cc6634c0532925a3b844bc9e7595f0beb7",
    "amount": 500
  }'
```

**Response:**
```json
{
  "success": true,
  "txHash": "0xabc123..."
}
```

---

## 📊 **Admin Workflow**

### **Redemption Process:**

1. **User requests redemption** (via frontend)
   - User clicks "Redeem GCoin → INR"
   - Tokens are burned immediately on blockchain
   - Redemption record created with `status: "pending"`

2. **Admin views pending redemptions**
   ```bash
   GET /api/admin/redeems/pending
   ```

3. **Admin processes payment offline**
   - Admin transfers INR to user's bank account
   - Admin notes the redemption ID

4. **Admin marks redemption as completed**
   ```bash
   POST /api/admin/redeems/{id}/complete
   ```

5. **User sees status updated** in frontend history

---

## 🖥️ **Admin Dashboard (Optional)**

You can build a simple admin dashboard or use tools like:

### **Option 1: Use Postman/Thunder Client**
1. Create a collection with admin endpoints
2. Add `x-admin-key: Abhishek@1` header to all requests
3. Save common requests

### **Option 2: Build Admin UI** (Future Enhancement)
Create a simple React admin panel at `/admin` route with:
- Login with admin key
- Table of pending redemptions
- "Mark as Paid" buttons
- Token transfer form

### **Option 3: Use MongoDB Compass** (Quick View)
1. Connect to your MongoDB
2. Browse `redeems` collection
3. Manually update `status` field (not recommended for production)

---

## 🔒 **Security Notes**

1. **Admin Key Protection:**
   - Never expose `ADMIN_KEY` in frontend code
   - Only use in backend environment variables
   - Only share with trusted admins

2. **Admin Endpoints:**
   - All admin routes check for valid `x-admin-key` header
   - Unauthorized requests return `401 Unauthorized`

3. **Token Transfers:**
   - Only admin can transfer tokens
   - Requires private key (stored securely in backend `.env`)
   - All transfers recorded on blockchain

---

## 📝 **Example Admin Script**

Create a simple Node.js script to manage redemptions:

```javascript
// admin-tools.js
const axios = require('axios');

const BACKEND_URL = 'https://your-backend-url.com';
const ADMIN_KEY = 'Abhishek@1';

const headers = {
  'x-admin-key': ADMIN_KEY,
  'Content-Type': 'application/json'
};

// Get pending redemptions
async function getPendingRedeems() {
  const response = await axios.get(
    `${BACKEND_URL}/api/admin/redeems/pending`,
    { headers }
  );
  console.log('Pending Redeems:', response.data);
  return response.data;
}

// Complete redemption
async function completeRedeem(redeemId) {
  const response = await axios.post(
    `${BACKEND_URL}/api/admin/redeems/${redeemId}/complete`,
    {},
    { headers }
  );
  console.log('Completed:', response.data);
  return response.data;
}

// Transfer tokens
async function transferTokens(toAddress, amount) {
  const response = await axios.post(
    `${BACKEND_URL}/api/transfer`,
    { to: toAddress, amount },
    { headers }
  );
  console.log('Transfer:', response.data);
  return response.data;
}

// Run
(async () => {
  // Get pending
  const pending = await getPendingRedeems();
  
  // Complete first one (example)
  if (pending.length > 0) {
    await completeRedeem(pending[0]._id);
  }
})();
```

**Usage:**
```bash
node admin-tools.js
```

---

## 🎯 **Current Status**

| Feature | Status | Access |
|---------|--------|--------|
| **View Pending Redeems** | ✅ Working | API endpoint |
| **Complete Redeems** | ✅ Working | API endpoint |
| **Transfer Tokens** | ✅ Working | API endpoint |
| **Admin UI Dashboard** | ❌ Not built | (Optional future feature) |

---

## 📞 **Admin Credentials**

**Admin Key:** `Abhishek@1`
**Location:** Backend `.env` as `ADMIN_KEY`
**Usage:** Add as header: `x-admin-key: Abhishek@1`

---

## 🚀 **Next Steps**

Once backend is deployed:

1. **Test admin endpoints** using curl or Postman
2. **Set up admin workflow** for redemption processing
3. **(Optional) Build admin UI** for easier management

All admin features are ready to use once you deploy the backend! 🎉
