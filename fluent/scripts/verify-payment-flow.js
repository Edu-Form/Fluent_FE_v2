/**
 * Verify Complete Payment Flow Integration
 * This script checks if all payment paths are properly integrated
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 VERIFYING COMPLETE PAYMENT FLOW\n');
console.log('='.repeat(70));

let issues = [];
let warnings = [];

// 1. Check Payment Link Creation
console.log('\n1️⃣  PAYMENT LINK CREATION');
console.log('-'.repeat(70));

const linkRoute = path.join(process.cwd(), 'src/app/api/payment/link/route.ts');
const linkContent = fs.readFileSync(linkRoute, 'utf-8');

if (linkContent.includes('saveInitialPayment')) {
  console.log('   ✅ saveInitialPayment() called');
} else {
  console.log('   ❌ saveInitialPayment() NOT called');
  issues.push('Payment link does not save to students collection');
}

if (linkContent.includes('createPayment')) {
  console.log('   ✅ createPayment() called (creates payments collection record)');
} else {
  console.log('   ❌ createPayment() NOT called');
  issues.push('Payment link does not create payments collection record');
}

// 2. Check Payment Generate
console.log('\n2️⃣  PAYMENT GENERATE');
console.log('-'.repeat(70));

const generateRoute = path.join(process.cwd(), 'src/app/api/payment/generate/route.ts');
const generateContent = fs.readFileSync(generateRoute, 'utf-8');

if (generateContent.includes('saveInitialPayment')) {
  console.log('   ✅ saveInitialPayment() called');
} else {
  console.log('   ❌ saveInitialPayment() NOT called');
  issues.push('Payment generate does not save to students collection');
}

if (generateContent.includes('createPayment')) {
  console.log('   ✅ createPayment() called (creates payments collection record)');
} else {
  console.log('   ❌ createPayment() NOT called');
  issues.push('Payment generate does not create payments collection record');
}

// 3. Check Webhook
console.log('\n3️⃣  WEBHOOK HANDLER');
console.log('-'.repeat(70));

const webhookRoute = path.join(process.cwd(), 'src/app/api/payment/webhook/route.ts');
const webhookContent = fs.readFileSync(webhookRoute, 'utf-8');

if (webhookContent.includes('updatePaymentStatus')) {
  console.log('   ✅ updatePaymentStatus() called (updates students collection)');
} else {
  console.log('   ❌ updatePaymentStatus() NOT called');
  issues.push('Webhook does not update students collection');
}

if (webhookContent.includes('updatePaymentDoc') || webhookContent.includes('updatePaymentStatus: updatePaymentDoc')) {
  console.log('   ✅ updatePaymentDoc() called (updates payments collection)');
} else {
  console.log('   ❌ updatePaymentDoc() NOT called');
  issues.push('Webhook does not update payments collection');
}

// Check if webhook handles missing document
if (webhookContent.includes('Payment document not found')) {
  console.log('   ⚠️  Webhook warns if payment document not found (expected behavior)');
  warnings.push('Webhook can only UPDATE existing documents, cannot CREATE');
}

// 4. Check Success Redirect Handler
console.log('\n4️⃣  SUCCESS REDIRECT HANDLER (GET /api/payment)');
console.log('-'.repeat(70));

const paymentRoute = path.join(process.cwd(), 'src/app/api/payment/route.ts');
const paymentContent = fs.readFileSync(paymentRoute, 'utf-8');

if (paymentContent.includes('updatePaymentStatus')) {
  console.log('   ✅ updatePaymentStatus() called (updates students collection)');
} else {
  console.log('   ❌ updatePaymentStatus() NOT called');
  issues.push('Success handler does not update students collection');
}

if (paymentContent.includes('updatePaymentDoc') || paymentContent.includes('updatePaymentStatus: updatePaymentDoc')) {
  console.log('   ✅ updatePaymentDoc() called (updates payments collection)');
} else {
  console.log('   ❌ updatePaymentDoc() NOT called');
  issues.push('Success handler does not update payments collection');
}

// 5. Check updatePaymentStatus function
console.log('\n5️⃣  PAYMENTS COLLECTION UPDATE FUNCTION');
console.log('-'.repeat(70));

const paymentsLib = path.join(process.cwd(), 'lib/payments.ts');
const paymentsContent = fs.readFileSync(paymentsLib, 'utf-8');

if (paymentsContent.includes('collection.findOne({ orderId })')) {
  console.log('   ✅ updatePaymentStatus() checks if document exists');
} else {
  console.log('   ❌ updatePaymentStatus() does not check if document exists');
  issues.push('updatePaymentStatus may fail if document does not exist');
}

if (paymentsContent.includes('Payment with orderId') && paymentsContent.includes('not found')) {
  console.log('   ✅ Returns null if document not found (safe behavior)');
} else {
  console.log('   ⚠️  May throw error if document not found');
  warnings.push('updatePaymentStatus might throw if document does not exist');
}

// Summary
console.log('\n' + '='.repeat(70));
console.log('📋 SUMMARY');
console.log('='.repeat(70));

if (issues.length === 0 && warnings.length === 0) {
  console.log('\n✅ ALL CHECKS PASSED - Payment flow is properly integrated!');
  console.log('\n📊 Payment Flow:');
  console.log('   1. Payment Link Created → Creates record in payments collection ✅');
  console.log('   2. User pays via Toss → Toss sends webhook ✅');
  console.log('   3. Webhook received → Updates payments collection ✅');
  console.log('   4. User redirected → Updates payments collection (backup) ✅');
  console.log('\n⚠️  IMPORTANT: Webhook can only UPDATE existing documents.');
  console.log('   If initial creation fails, webhook will log warning but payment still works.');
  console.log('   Payment will be in students/billing collections (existing flow).');
} else {
  if (issues.length > 0) {
    console.log(`\n❌ ISSUES FOUND (${issues.length}):`);
    issues.forEach((issue, i) => {
      console.log(`   ${i + 1}. ${issue}`);
    });
  }
  
  if (warnings.length > 0) {
    console.log(`\n⚠️  WARNINGS (${warnings.length}):`);
    warnings.forEach((warn, i) => {
      console.log(`   ${i + 1}. ${warn}`);
    });
  }
}

console.log('\n' + '='.repeat(70));
