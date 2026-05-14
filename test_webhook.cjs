const axios = require('axios');
const crypto = require('crypto');

const testWebhook = async () => {
  const rawBody = JSON.stringify({
    type: "PAYMENT_SUCCESS_WEBHOOK",
    data: {
      payment: {
        payment_status: "SUCCESS",
        payment_amount: 1000
      },
      order: {
        order_id: "test_order_" + Date.now(),
        order_tags: {
          walletAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f4e51f"
        }
      }
    }
  });

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const message = `${timestamp}${rawBody}`;
  const signature = crypto
    .createHmac('sha256', 'test_secret')
    .update(message)
    .digest('base64');

  try {
    const response = await axios.post('http://localhost:10000/api/payment/webhook', rawBody, {
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-signature': signature,
        'x-webhook-timestamp': timestamp
      }
    });
    
    console.log("✅ Webhook response:", response.data);
  } catch (error) {
    console.error("❌ Webhook error:", error.response?.data || error.message);
  }
};

testWebhook();
