/**
 * Simple Node.js script to test webhook updates
 * Usage: node scripts/test-webhook-simple.js [orderId] [status] [amount]
 * 
 * Examples:
 *   node scripts/test-webhook-simple.js <orderId> DONE 5000
 *   node scripts/test-webhook-simple.js <orderId> CANCELED 5000
 */

const http = require('http');

const orderId = process.argv[2];
const status = process.argv[3] || 'DONE';
const amount = parseInt(process.argv[4] || '5000', 10);

if (!orderId) {
  console.error('❌ Error: orderId is required');
  console.log('\nUsage:');
  console.log('  node scripts/test-webhook-simple.js <orderId> [status] [amount]');
  console.log('\nExamples:');
  console.log('  node scripts/test-webhook-simple.js 1768289350509 DONE 5000');
  console.log('  node scripts/test-webhook-simple.js 1768289350509 CANCELED 5000');
  process.exit(1);
}

const paymentKey = `test_payment_key_${Date.now()}`;

const webhookPayload = JSON.stringify({
  orderId,
  paymentKey,
  status,
  method: '카드',
  totalAmount: amount,
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/payment/webhook',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(webhookPayload),
  },
};

console.log('🧪 Testing Webhook Update');
console.log('='.repeat(60));
console.log(`OrderId: ${orderId}`);
console.log(`Status: ${status}`);
console.log(`Amount: ${amount} KRW`);
console.log(`PaymentKey: ${paymentKey}`);
console.log('='.repeat(60));
console.log('');

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`Response Status: ${res.statusCode}`);
    console.log('Response Body:');
    try {
      const json = JSON.parse(data);
      console.log(JSON.stringify(json, null, 2));
    } catch (e) {
      console.log(data);
    }
    
    if (res.statusCode === 200) {
      console.log('');
      console.log('✅ Webhook processed successfully!');
      console.log('');
      console.log('To verify, run:');
      console.log('  node scripts/check-payments-in-db.js');
    } else {
      console.log('');
      console.log('❌ Webhook may have failed. Check server logs.');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
  console.log('');
  console.log('Make sure your Next.js server is running:');
  console.log('  npm run dev');
});

req.write(webhookPayload);
req.end();
