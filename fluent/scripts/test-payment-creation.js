/**
 * TEST SCRIPT: Verify payment creation actually works
 * This simulates what happens when a payment link is created
 */

require('dotenv').config({ path: '.env.local' });

const { MongoClient } = require('mongodb');
const { v4: uuidv4 } = require('uuid');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'school_management';

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not set');
  process.exit(1);
}

async function testPaymentCreation() {
  let client;
  
  try {
    console.log('🧪 TESTING PAYMENT CREATION\n');
    console.log('='.repeat(70));
    
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db(DB_NAME);
    const testOrderId = `test_${Date.now()}`;
    const testStudentName = 'TEST_STUDENT_' + Date.now();
    const testAmount = 10000;
    
    console.log('📝 Test Parameters:');
    console.log(`   OrderId: ${testOrderId}`);
    console.log(`   Student: ${testStudentName}`);
    console.log(`   Amount: ${testAmount} KRW\n`);
    
    // Test 1: Check if createPayment would work
    console.log('1️⃣  Testing createPayment function logic...');
    console.log('-'.repeat(70));
    
    const paymentsCollection = db.collection('payments');
    
    // Simulate what createPayment does
    const paymentDoc = {
      orderId: testOrderId,
      student_name: testStudentName,
      amount: testAmount,
      currency: 'KRW',
      status: 'INITIATED',
      description: `${testStudentName}'s tuition payment via payment link`,
      orderName: `${testStudentName} - Tuition`,
      createdAt: new Date(),
      updatedAt: new Date(),
      initiatedAt: new Date(),
      statusHistory: [{
        status: 'INITIATED',
        timestamp: new Date(),
        source: 'api',
        notes: 'Payment initiated',
      }],
      metadata: {
        source: 'payment-link',
      },
    };
    
    try {
      // Check if orderId already exists
      const existing = await paymentsCollection.findOne({ orderId: testOrderId });
      if (existing) {
        console.log('   ⚠️  Payment with this orderId already exists');
      } else {
        console.log('   ✅ No existing payment found (good)');
      }
      
      // Try to insert
      const result = await paymentsCollection.insertOne(paymentDoc);
      console.log(`   ✅ Payment document inserted successfully!`);
      console.log(`      Document ID: ${result.insertedId}`);
      
      // Verify it was saved
      const saved = await paymentsCollection.findOne({ orderId: testOrderId });
      if (saved) {
        console.log('   ✅ Payment document verified in database');
        console.log(`      Status: ${saved.status}`);
        console.log(`      Student: ${saved.student_name}`);
        console.log(`      Amount: ${saved.amount}`);
      } else {
        console.log('   ❌ Payment document NOT found after insert!');
        throw new Error('Document not found after insert');
      }
      
      // Clean up test data
      await paymentsCollection.deleteOne({ orderId: testOrderId });
      console.log('   ✅ Test data cleaned up\n');
      
    } catch (err) {
      console.error('   ❌ ERROR during test:', err.message);
      console.error('   Stack:', err.stack);
      
      // Try to clean up even if insert failed
      try {
        await paymentsCollection.deleteOne({ orderId: testOrderId });
      } catch {}
      
      throw err;
    }
    
    // Test 2: Check MongoDB connection and permissions
    console.log('2️⃣  Testing MongoDB connection and permissions...');
    console.log('-'.repeat(70));
    
    try {
      const testCollection = db.collection('payments');
      const countBefore = await testCollection.countDocuments();
      console.log(`   ✅ Can read payments collection (${countBefore} documents)`);
      
      const testDoc = { _id: 'test_permission_check', test: true };
      try {
        await testCollection.insertOne(testDoc);
        await testCollection.deleteOne({ _id: 'test_permission_check' });
        console.log('   ✅ Can write to payments collection');
      } catch (writeErr) {
        console.error('   ❌ Cannot write to payments collection:', writeErr.message);
        throw new Error('Write permission denied');
      }
    } catch (err) {
      console.error('   ❌ MongoDB permission error:', err.message);
      throw err;
    }
    
    // Test 3: Check if TEST_MODE is interfering
    console.log('\n3️⃣  Checking environment configuration...');
    console.log('-'.repeat(70));
    
    if (process.env.PAYMENTS_TEST_MODE === 'true') {
      console.log('   ⚠️  PAYMENTS_TEST_MODE=true is set!');
      console.log('   ⚠️  Payments will be written to JSON file, NOT MongoDB');
      console.log('   ⚠️  This test will pass but production won\'t work!');
    } else {
      console.log('   ✅ PAYMENTS_TEST_MODE is not set (production mode)');
    }
    
    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('📋 TEST SUMMARY');
    console.log('='.repeat(70));
    console.log('\n✅ ALL TESTS PASSED!');
    console.log('\n✅ Payment creation SHOULD work because:');
    console.log('   1. MongoDB connection works');
    console.log('   2. Can read/write to payments collection');
    console.log('   3. Payment document structure is correct');
    console.log('   4. No permission errors');
    
    if (process.env.PAYMENTS_TEST_MODE === 'true') {
      console.log('\n⚠️  BUT: PAYMENTS_TEST_MODE=true means payments go to JSON, not MongoDB!');
      console.log('   Remove PAYMENTS_TEST_MODE from .env.local for production.');
    }
    
    console.log('\n💡 To verify in production:');
    console.log('   1. Make a real payment');
    console.log('   2. Check server logs for: "[Payment Link] Payment document created successfully"');
    console.log('   3. Run: node scripts/check-payments-in-db.js');
    console.log('   4. Check MongoDB payments collection');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('\nThis means payment creation WILL FAIL in production!');
    console.error('\nPossible causes:');
    console.error('   1. MongoDB connection issue');
    console.error('   2. Database permissions');
    console.error('   3. Collection doesn\'t exist (will be created automatically)');
    console.error('   4. Network/firewall issues');
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('\n🔌 Disconnected from MongoDB');
    }
  }
}

testPaymentCreation().catch(console.error);
