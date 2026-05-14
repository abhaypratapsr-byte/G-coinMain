#!/bin/bash

# Generate webhook test data
PAYLOAD='{"type":"PAYMENT_SUCCESS_WEBHOOK","data":{"payment":{"payment_status":"SUCCESS","payment_amount":1000},"order":{"order_id":"test_order_'$(date +%s)'","order_tags":{"walletAddress":"0x742d35Cc6634C0532925a3b844Bc9e7595f4e51f"}}}}'

TIMESTAMP=$(date +%s)
MESSAGE="${TIMESTAMP}${PAYLOAD}"

# Generate signature with dummy secret
SIGNATURE=$(echo -n "$MESSAGE" | openssl dgst -sha256 -hmac "test_secret" -binary | base64)

echo "Testing Webhook with proper raw body..."
echo ""
echo "Payload: $PAYLOAD"
echo "Timestamp: $TIMESTAMP"
echo "Signature: $SIGNATURE"
echo ""

# Send webhook
curl -X POST http://localhost:10000/api/payment/webhook \
  -H 'Content-Type: application/json' \
  -H "x-webhook-signature: $SIGNATURE" \
  -H "x-webhook-timestamp: $TIMESTAMP" \
  -d "$PAYLOAD" -v

echo ""
echo "Done"
