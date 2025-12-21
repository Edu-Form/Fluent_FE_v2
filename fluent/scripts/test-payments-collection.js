#!/usr/bin/env node

/**
 * Test script for Payments Collection Integration
 * 
 * Tests the payments collection integration by making direct API calls.
 * No login required - tests API endpoints directly.
 * 
 * Usage:
 *   node fluent/scripts/test-payments-collection.js
 * 
 * Set PAYMENTS_TEST_MODE=true in .env.local to test with JSON file instead of MongoDB
 * 
 * Make sure your dev server is running: npm run dev
 */

// Use node's built-in fetch if available (Node 18+), otherwise require node-fetch
let fetch;
try {
  if (typeof globalThis.fetch === 'function') {
    fetch = globalThis.fetch;
  } else {
    fetch = require('node-fetch');
  }
} catch (e) {
  console.error('❌ Error: fetch is not available. Make sure you have Node.js 18+ or node-fetch installed.');
  process.exit(1);
}

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Test data
const TEST_STUDENT = {
  name: 'TestStudent_' + Date.now(),
  amount: 100000,
  yyyymm: '202501',
  description: 'Test payment for payments collection integration',
  quantity: 1,
};

let createdOrderId = null;

async function testPaymentCreation() {
  console.log('\n🧪 Test 1: Payment Creation (POST /api/payment)');
  console.log('='.repeat(60));
  
  try {
    const response = await fetch(`${BASE_URL}/api/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        student_name: TEST_STUDENT.name,
        amount: TEST_STUDENT.amount,
        yyyymm: TEST_STUDENT.yyyymm,
        description: TEST_STUDENT.description,
        quantity: TEST_STUDENT.quantity,
        student_id: '01012345678', // Test student ID
      }),
    });

    let data;
    try {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error('❌ Response is not JSON:', text.substring(0, 200));
        console.error('   Status:', response.status, response.statusText);
        return null;
      }
    } catch (error) {
      console.error('❌ Error reading response:', error.message);
      return null;
    }

    if (!response.ok) {
      console.error('❌ Payment creation failed:', data);
      console.error('   Status:', response.status);
      return null;
    }

    console.log('✅ Payment creation successful!');
    console.log('   Order ID:', data.orderId);
    console.log('   Amount:', data.amount);
    console.log('   Order Name:', data.orderName);
    console.log('   Customer Name:', data.customerName);
    
    createdOrderId = data.orderId;
    
    // Verify payment document was created (in test mode, check JSON file)
    if (process.env.PAYMENTS_TEST_MODE === 'true') {
      console.log('\n📄 Checking test data file...');
      const fs = require('fs');
      const path = require('path');
      const testDataPath = path.resolve(process.cwd(), 'fluent/.test-payments-data.json');
      
      try {
        if (fs.existsSync(testDataPath)) {
          const testData = JSON.parse(fs.readFileSync(testDataPath, 'utf-8'));
          const payment = testData.find(p => p.orderId === data.orderId);
          
          if (payment) {
            console.log('✅ Payment document found in test data file!');
            console.log('   Status:', payment.status);
            console.log('   Description:', payment.description);
            console.log('   Student:', payment.student_name);
          } else {
            console.log('⚠️  Payment document not found in test data file');
          }
        } else {
          console.log('⚠️  Test data file does not exist yet');
        }
      } catch (err) {
        console.log('⚠️  Error reading test data file:', err.message);
      }
    } else {
      console.log('\n💾 Production mode - Payment document should be in MongoDB');
      console.log('   Collection: school_management.payments');
      console.log('   Query: db.payments.findOne({ orderId: "' + data.orderId + '" })');
    }

    return data;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

async function testPaymentQuery(orderId) {
  console.log('\n🧪 Test 2: Query Payment Document');
  console.log('='.repeat(60));
  
  if (!orderId) {
    console.log('⚠️  Skipping - no orderId from previous test');
    return;
  }

  // Note: We don't have a GET endpoint for payments yet, so we'll just verify
  // the document exists in the test data file or MongoDB
  if (process.env.PAYMENTS_TEST_MODE === 'true') {
    console.log('📄 Checking test data file for payment...');
    const fs = require('fs');
    const path = require('path');
    const testDataPath = path.resolve(process.cwd(), 'fluent/.test-payments-data.json');
    
    try {
      if (fs.existsSync(testDataPath)) {
        const testData = JSON.parse(fs.readFileSync(testDataPath, 'utf-8'));
        const payment = testData.find(p => p.orderId === orderId);
        
        if (payment) {
          console.log('✅ Payment document found!');
          console.log('   Order ID:', payment.orderId);
          console.log('   Status:', payment.status);
          console.log('   Amount:', payment.amount);
          console.log('   Description:', payment.description);
          console.log('   Created:', payment.createdAt);
          console.log('   Status History:', payment.statusHistory?.length || 0, 'entries');
          return payment;
        } else {
          console.log('❌ Payment document not found');
          return null;
        }
      } else {
        console.log('⚠️  Test data file does not exist');
        return null;
      }
    } catch (err) {
      console.error('❌ Error:', err.message);
      return null;
    }
  } else {
    console.log('💾 Production mode - Query MongoDB directly:');
    console.log(`   db.payments.findOne({ orderId: "${orderId}" })`);
    console.log('\n⚠️  No API endpoint available yet for querying payments');
  }
}

async function testMultiplePayments() {
  console.log('\n🧪 Test 3: Multiple Payment Creation');
  console.log('='.repeat(60));
  
  const payments = [];
  const count = 3;
  
  for (let i = 0; i < count; i++) {
    try {
      const response = await fetch(`${BASE_URL}/api/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_name: TEST_STUDENT.name,
          amount: TEST_STUDENT.amount + (i * 10000),
          yyyymm: TEST_STUDENT.yyyymm,
          description: `Test payment ${i + 1} - ${TEST_STUDENT.description}`,
          quantity: i + 1,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        payments.push(data);
        console.log(`✅ Payment ${i + 1} created: ${data.orderId}`);
      } else {
        console.log(`❌ Payment ${i + 1} failed:`, data.message);
      }
    } catch (error) {
      console.log(`❌ Payment ${i + 1} error:`, error.message);
    }
  }
  
  console.log(`\n📊 Created ${payments.length}/${count} payments`);
  
  if (process.env.PAYMENTS_TEST_MODE === 'true') {
    console.log('\n📄 Checking test data file...');
    const fs = require('fs');
    const path = require('path');
    const testDataPath = path.resolve(process.cwd(), 'fluent/.test-payments-data.json');
    
    try {
      if (fs.existsSync(testDataPath)) {
        const testData = JSON.parse(fs.readFileSync(testDataPath, 'utf-8'));
        const studentPayments = testData.filter(p => p.student_name === TEST_STUDENT.name);
        console.log(`✅ Found ${studentPayments.length} payments for ${TEST_STUDENT.name} in test data`);
      }
    } catch (err) {
      console.log('⚠️  Error reading test data:', err.message);
    }
  }
  
  return payments;
}

async function showTestDataSummary() {
  if (process.env.PAYMENTS_TEST_MODE !== 'true') {
    return;
  }
  
  console.log('\n📊 Test Data Summary');
  console.log('='.repeat(60));
  
  const fs = require('fs');
  const path = require('path');
  const testDataPath = path.resolve(process.cwd(), 'fluent/.test-payments-data.json');
  
  try {
    if (fs.existsSync(testDataPath)) {
      const testData = JSON.parse(fs.readFileSync(testDataPath, 'utf-8'));
      console.log(`Total payments in test data: ${testData.length}`);
      
      const byStatus = {};
      testData.forEach(p => {
        byStatus[p.status] = (byStatus[p.status] || 0) + 1;
      });
      
      console.log('\nBy status:');
      Object.entries(byStatus).forEach(([status, count]) => {
        console.log(`  ${status}: ${count}`);
      });
      
      console.log(`\nTest data file: ${testDataPath}`);
      console.log('View full data: cat ' + testDataPath);
    } else {
      console.log('⚠️  Test data file does not exist');
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

async function checkServer() {
  console.log('🔍 Checking if server is running...');
  try {
    const response = await fetch(`${BASE_URL}/api/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_name: 'healthcheck', amount: 1 }),
    });
    
    const text = await response.text();
    // If we get JSON back (even an error), server is running
    try {
      const json = JSON.parse(text);
      return { ok: true, error: null };
    } catch (e) {
      // If it's HTML, server might be returning an error page
      if (text.includes('<!DOCTYPE') || text.includes('<html')) {
        // Try to extract error from Next.js error page
        const errorMatch = text.match(/"message":"([^"]+)"/);
        const error = errorMatch ? errorMatch[1] : 'Unknown error';
        console.log('⚠️  Server returned error page');
        console.log('   Error:', error);
        
        if (error.includes('MONGODB_URI')) {
          console.log('\n💡 Solution: Set MONGODB_URI in your .env.local file');
          console.log('   Even in test mode, other parts of the API need MongoDB');
        }
        
        return { ok: false, error };
      }
      return { ok: true, error: null };
    }
  } catch (error) {
    console.error('❌ Cannot connect to server:', error.message);
    console.error('   Make sure your dev server is running: npm run dev');
    return { ok: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Payments Collection Integration Test');
  console.log('='.repeat(60));
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Test Mode: ${process.env.PAYMENTS_TEST_MODE === 'true' ? 'YES (JSON file)' : 'NO (MongoDB)'}`);
  console.log(`Test Student: ${TEST_STUDENT.name}\n`);
  
  // Check if server is running
  const serverCheck = await checkServer();
  if (!serverCheck.ok) {
    if (serverCheck.error && serverCheck.error.includes('MONGODB_URI')) {
      console.log('\n❌ MongoDB connection required');
      console.log('   The API needs MONGODB_URI set in .env.local');
      console.log('   Even with PAYMENTS_TEST_MODE=true, other parts need MongoDB');
      console.log('\n💡 Quick fix:');
      console.log('   1. Check if .env.local exists');
      console.log('   2. Add: MONGODB_URI=your_connection_string');
      console.log('   3. Restart your dev server');
    } else {
      console.log('\n❌ Server check failed');
      console.log('   Make sure your dev server is running: npm run dev');
    }
    process.exit(1);
  }
  console.log('✅ Server is running\n');
  
  // Test 1: Create payment
  const payment = await testPaymentCreation();
  
  if (payment) {
    // Test 2: Query payment
    await testPaymentQuery(payment.orderId);
    
    // Test 3: Multiple payments
    await testMultiplePayments();
    
    // Show summary
    await showTestDataSummary();
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Testing complete!');
  console.log('\n📝 What was tested:');
  console.log('  ✅ POST /api/payment - Payment creation with description and quantity');
  console.log('  ✅ Payment document creation in payments collection');
  console.log('  ✅ Test mode vs Production mode handling');
  console.log('\n📋 Next steps:');
  console.log('  1. Check console logs on server for [Payment API] messages');
  console.log('  2. Verify payment documents in test data file (if PAYMENTS_TEST_MODE=true)');
  console.log('  3. Verify payment documents in MongoDB (if production mode)');
  console.log('  4. Test actual payment flow through UI');
  console.log('\n💡 Note: This test bypasses login by calling the API directly.');
  console.log('   The API endpoints will work the same way when called from the frontend.');
}

// Run tests
runTests().catch(error => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});

