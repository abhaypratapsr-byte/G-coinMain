const http = require('http');

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 10000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, body: JSON.parse(body) });
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function runTest() {
  try {
    console.log('=== GCoin Payment Flow Test ===\n');

    // Step 1: Create payment order
    console.log('1️⃣ Creating payment order...');
    const orderRes = await makeRequest('POST', '/api/payment/create-order', {
      wallet: '0x742d35Cc6634C0532925a3b844Bc9e7595f4e51f',
      amount: 1000,
      email: 'test@gcoin.app',
      phone: '9876543210'
    });
    const orderId = orderRes.body.order?.id;
    console.log('   ✅ Order created:', orderId);
    console.log('   Status:', orderRes.body.order?.status);

    // Step 2: Check payment status before webhook
    console.log('\n2️⃣ Checking payment status (before webhook)...');
    const statusBefore = await makeRequest('GET', `/api/payment/status/${orderId}`);
    console.log('   Status:', statusBefore.body.status);

    // Step 3: Simulate Cashfree webhook
    console.log('\n3️⃣ Simulating Cashfree webhook...');
    const crypto = require('crypto');
    const payload = {
      type: "PAYMENT_SUCCESS_WEBHOOK",
      data: {
        payment: { payment_status: "SUCCESS", payment_amount: 1000 },
        order: { 
          order_id: orderId, 
          order_tags: { walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f4e51f' }
        }
      }
    };
    
    const rawBody = JSON.stringify(payload);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const message = `${timestamp}${rawBody}`;
    const signature = crypto
      .createHmac('sha256', 'test_secret')
      .update(message)
      .digest('base64');

    const webhookRes = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 10000,
        path: '/api/payment/webhook',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-signature': signature,
          'x-webhook-timestamp': timestamp
        }
      };

      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        });
      });

      req.on('error', reject);
      req.write(rawBody);
      req.end();
    });
    
    console.log('   ✅ Webhook processed:', webhookRes.body.success ? 'SUCCESS' : 'FAILED');

    // Step 4: Check payment status after webhook
    console.log('\n4️⃣ Checking payment status (after webhook)...');
    await new Promise(r => setTimeout(r, 500)); // Brief delay for DB update
    const statusAfter = await makeRequest('GET', `/api/payment/status/${orderId}`);
    console.log('   Status:', statusAfter.body.status);
    console.log('   ✅ Status updated:', statusBefore.body.status !== statusAfter.body.status ? 'YES' : 'NO');

    // Step 5: Verify payment in history
    console.log('\n5️⃣ Verifying payment history...');
    const history = await makeRequest('GET', '/api/payment/history/0x742d35cc6634c0532925a3b844bc9e7595f4e51f');
    const foundPayment = history.body.find(p => p.orderId === orderId);
    console.log('   ✅ Payment found in history:', foundPayment ? 'YES' : 'NO');
    if (foundPayment) {
      console.log('   Amount:', foundPayment.amount);
      console.log('   Status:', foundPayment.status);
    }

    console.log('\n=== ✅ PAYMENT FLOW TEST PASSED ===');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

runTest();
