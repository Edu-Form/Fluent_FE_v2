/**
 * Check payments in MongoDB database
 * Usage: node scripts/check-payments-in-db.js
 */

require('dotenv').config({ path: '.env.local' });

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'school_management';

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not set in .env.local');
  process.exit(1);
}

async function checkPayments() {
  let client;
  
  try {
    console.log('🔌 Connecting to MongoDB...\n');
    // Use same connection options as Next.js app
    const options = {};
    client = new MongoClient(MONGODB_URI, options);
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db(DB_NAME);
    
    console.log('='.repeat(70));
    console.log('📊 PAYMENT CHECK');
    console.log('='.repeat(70));
    console.log('');
    
    // Check payments collection
    console.log('1️⃣  PAYMENTS COLLECTION');
    console.log('-'.repeat(70));
    const paymentsCollection = db.collection('payments');
    const paymentsCount = await paymentsCollection.countDocuments();
    const recentPayments = await paymentsCollection
      .find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();
    
    console.log(`   Total documents: ${paymentsCount}`);
    
    if (recentPayments.length > 0) {
      console.log(`\n   Recent payments (last 10):`);
      recentPayments.forEach((p, i) => {
        console.log(`   ${i + 1}. OrderId: ${p.orderId}`);
        console.log(`      Student: ${p.student_name}`);
        console.log(`      Amount: ${p.amount?.toLocaleString()} KRW`);
        console.log(`      Status: ${p.status}`);
        console.log(`      Created: ${p.createdAt}`);
        if (p.tossData?.method) {
          console.log(`      Method: ${p.tossData.method}`);
        }
        console.log('');
      });
    } else {
      console.log('   ⚠️  No payments found');
      console.log('   (This is normal if no payments made since integration)\n');
    }
    
    // Check students with payments
    console.log('2️⃣  STUDENTS COLLECTION (with payment data)');
    console.log('-'.repeat(70));
    const studentsCollection = db.collection('students');
    const studentsWithPayments = await studentsCollection
      .find({
        $or: [
          { orderId: { $exists: true } },
          { paymentId: { $exists: true } },
          { paymentStatus: { $exists: true } },
        ]
      })
      .sort({ orderId: -1 })
      .limit(10)
      .toArray();
    
    console.log(`   Students with payment data: ${studentsWithPayments.length}`);
    
    if (studentsWithPayments.length > 0) {
      console.log(`\n   Recent students with payments:`);
      studentsWithPayments.slice(0, 10).forEach((s, i) => {
        console.log(`   ${i + 1}. ${s.name}`);
        if (s.orderId) console.log(`      OrderId: ${s.orderId}`);
        if (s.paymentId) console.log(`      PaymentId: ${s.paymentId}`);
        if (s.paymentStatus) {
          const icon = s.paymentStatus === 'COMPLETED' ? '✅' : s.paymentStatus === 'PENDING' ? '⏳' : '❌';
          console.log(`      Status: ${icon} ${s.paymentStatus}`);
        }
        console.log('');
      });
    }
    
    // Check billing collection
    console.log('3️⃣  BILLING COLLECTION (PaymentConfirm)');
    console.log('-'.repeat(70));
    const billingCollection = db.collection('billing');
    const paymentConfirms = await billingCollection
      .find({ step: 'PaymentConfirm' })
      .sort({ savedAt: -1 })
      .limit(10)
      .toArray();
    
    console.log(`   PaymentConfirm documents: ${paymentConfirms.length}`);
    
    if (paymentConfirms.length > 0) {
      console.log(`\n   Recent confirmations:`);
      paymentConfirms.forEach((b, i) => {
        const studentNames = Array.isArray(b.student_names) ? b.student_names : [b.student_names];
        console.log(`   ${i + 1}. Month: ${b.yyyymm}`);
        console.log(`      Students: ${studentNames.join(', ')}`);
        if (b.meta?.amount) console.log(`      Amount: ${b.meta.amount.toLocaleString()} KRW`);
        if (b.meta?.status) {
          const icon = b.meta.status === 'DONE' ? '✅' : '❌';
          console.log(`      Status: ${icon} ${b.meta.status}`);
        }
        console.log('');
      });
    }
    
    // Summary
    console.log('='.repeat(70));
    console.log('📋 SUMMARY');
    console.log('='.repeat(70));
    console.log(`\n   Payments collection: ${paymentsCount} documents`);
    console.log(`   Students with payments: ${studentsWithPayments.length}`);
    console.log(`   Billing confirmations: ${paymentConfirms.length}`);
    
    if (process.env.PAYMENTS_TEST_MODE === 'true') {
      console.log('\n   ⚠️  WARNING: PAYMENTS_TEST_MODE=true is set!');
      console.log('   Payments are being written to JSON file, not MongoDB.');
    }
    
    console.log('\n' + '='.repeat(70));
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('\n🔌 Disconnected from MongoDB');
    }
  }
}

checkPayments().catch(console.error);
