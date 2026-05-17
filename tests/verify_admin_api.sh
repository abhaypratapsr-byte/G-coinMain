#!/bin/bash

# Configuration
API_URL="http://localhost:8001/api/admin"
ADMIN_KEY="${ADMIN_KEY:-Abhishek@1}"

echo "🔍 Testing Admin API Endpoints..."

# 1. Test Stats
echo -n "Stats: "
curl -s -H "x-admin-key: $ADMIN_KEY" "$API_URL/stats" | grep -q "totalUsers" && echo "✅ PASS" || echo "❌ FAIL"

# 2. Test Contract Status
echo -n "Contract Status: "
curl -s -H "x-admin-key: $ADMIN_KEY" "$API_URL/contract-status" | grep -q "paused" && echo "✅ PASS" || echo "❌ FAIL"

# 3. Test Users List
echo -n "Users List: "
curl -s -H "x-admin-key: $ADMIN_KEY" "$API_URL/users" | grep -q "users" && echo "✅ PASS" || echo "❌ FAIL"

# 4. Test Transfers List
echo -n "Transfers List: "
curl -s -H "x-admin-key: $ADMIN_KEY" "$API_URL/transfers" | grep -q "transfers" && echo "✅ PASS" || echo "❌ FAIL"

echo "🎉 Admin API Verification Complete!"
