// Test script for Toss Payments integration
// Run with: node scripts/test-payment.js

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testPaymentCreation() {
  console.log('🧪 Testing Payment Creation...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        student_name: 'test_student',
        amount: 10000
      }),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Payment creation successful!');
      console.log('Order ID:', data.orderId);
      console.log('Payment URL:', data.paymentUrl);
      return data;
    } else {
      console.log('❌ Payment creation failed:', data.message);
      return null;
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
    return null;
  }
}

async function testPaymentVerification(orderId, paymentKey, amount) {
  console.log('🧪 Testing Payment Verification...');
  
  try {
    const response = await fetch(
      `${BASE_URL}/api/payment?orderId=${orderId}&paymentKey=${paymentKey}&amount=${amount}`,
      {
        method: 'GET',
      }
    );

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Payment verification successful!');
      console.log('Payment Status:', data.status);
      return data;
    } else {
      console.log('❌ Payment verification failed:', data.message);
      return null;
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
    return null;
  }
}

async function runTests() {
  console.log('🚀 Starting Toss Payments Integration Tests...\n');
  
  // Test 1: Payment Creation
  const payment = await testPaymentCreation();
  
  if (payment) {
    console.log('\n📋 Test Results:');
    console.log('- Payment creation: ✅');
    console.log('- Next step: Complete payment on Toss Payments page');
    console.log('- Then test verification with the returned payment key');
  } else {
    console.log('\n❌ Tests failed. Check your environment variables and database connection.');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { testPaymentCreation, testPaymentVerification };
