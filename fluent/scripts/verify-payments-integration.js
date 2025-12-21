#!/usr/bin/env node

/**
 * Verification Script for Payments Collection Integration
 * 
 * This script verifies that the payments collection integration code is correctly set up.
 * It does NOT make actual API calls or modify data - it only checks code structure.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Payments Collection Integration...\n');

let errors = [];
let warnings = [];

// Check if required files exist
const requiredFiles = [
  'fluent/types/payment.d.ts',
  'fluent/lib/payments.ts',
  'fluent/src/app/api/payment/route.ts',
  'fluent/src/app/api/payment/webhook/route.ts',
  'fluent/components/BillingPanel-AdminConfirm.tsx',
];

console.log('📁 Checking required files...');
requiredFiles.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - MISSING`);
    errors.push(`Missing file: ${file}`);
  }
});

// Check payment route.ts for integration
console.log('\n🔌 Checking API integration...');
try {
  const paymentRoutePath = path.join(process.cwd(), 'fluent/src/app/api/payment/route.ts');
  const paymentRouteContent = fs.readFileSync(paymentRoutePath, 'utf-8');
  
  // Check POST handler
  if (paymentRouteContent.includes('createPayment')) {
    console.log('  ✅ POST /api/payment - createPayment integrated');
  } else {
    console.log('  ❌ POST /api/payment - createPayment NOT found');
    errors.push('createPayment not called in POST /api/payment');
  }
  
  if (paymentRouteContent.includes('description')) {
    console.log('  ✅ POST /api/payment - description parameter accepted');
  } else {
    console.log('  ⚠️  POST /api/payment - description parameter might be missing');
    warnings.push('description parameter might not be captured');
  }
  
  // Check GET handler
  if (paymentRouteContent.includes('updatePaymentDoc')) {
    console.log('  ✅ GET /api/payment - updatePaymentDoc integrated');
  } else {
    console.log('  ❌ GET /api/payment - updatePaymentDoc NOT found');
    errors.push('updatePaymentDoc not called in GET /api/payment');
  }
  
  if (paymentRouteContent.includes('tossData')) {
    console.log('  ✅ GET /api/payment - tossData being stored');
  } else {
    console.log('  ⚠️  GET /api/payment - tossData might not be stored');
    warnings.push('tossData might not be fully stored');
  }
} catch (err) {
  console.log(`  ❌ Error reading payment route: ${err.message}`);
  errors.push(`Error reading payment route: ${err.message}`);
}

// Check webhook route
console.log('\n🔔 Checking webhook integration...');
try {
  const webhookPath = path.join(process.cwd(), 'fluent/src/app/api/payment/webhook/route.ts');
  const webhookContent = fs.readFileSync(webhookPath, 'utf-8');
  
  if (webhookContent.includes('updatePaymentDoc')) {
    console.log('  ✅ Webhook - updatePaymentDoc integrated');
  } else {
    console.log('  ❌ Webhook - updatePaymentDoc NOT found');
    errors.push('updatePaymentDoc not called in webhook');
  }
} catch (err) {
  console.log(`  ❌ Error reading webhook route: ${err.message}`);
  errors.push(`Error reading webhook route: ${err.message}`);
}

// Check frontend integration
console.log('\n💻 Checking frontend integration...');
try {
  const billingPanelPath = path.join(process.cwd(), 'fluent/components/BillingPanel-AdminConfirm.tsx');
  const billingPanelContent = fs.readFileSync(billingPanelPath, 'utf-8');
  
  if (billingPanelContent.includes('description')) {
    console.log('  ✅ BillingPanel - description parameter sent');
  } else {
    console.log('  ⚠️  BillingPanel - description parameter might be missing');
    warnings.push('description parameter might not be sent from frontend');
  }
} catch (err) {
  console.log(`  ⚠️  Error reading BillingPanel: ${err.message}`);
  warnings.push(`Error reading BillingPanel: ${err.message}`);
}

// Check payments.ts for test mode
console.log('\n🧪 Checking test mode implementation...');
try {
  const paymentsPath = path.join(process.cwd(), 'fluent/lib/payments.ts');
  const paymentsContent = fs.readFileSync(paymentsPath, 'utf-8');
  
  if (paymentsContent.includes('TEST_MODE')) {
    console.log('  ✅ Test mode implementation found');
  } else {
    console.log('  ⚠️  Test mode implementation might be missing');
    warnings.push('Test mode implementation might be missing');
  }
  
  if (paymentsContent.includes('PAYMENTS_TEST_MODE')) {
    console.log('  ✅ Test mode environment variable check present');
  } else {
    console.log('  ⚠️  Test mode environment variable check might be missing');
    warnings.push('Test mode env var check might be missing');
  }
} catch (err) {
  console.log(`  ❌ Error reading payments.ts: ${err.message}`);
  errors.push(`Error reading payments.ts: ${err.message}`);
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 Verification Summary');
console.log('='.repeat(50));

if (errors.length === 0 && warnings.length === 0) {
  console.log('✅ All checks passed! Integration looks good.\n');
  console.log('🚀 Ready for testing:');
  console.log('  1. Set PAYMENTS_TEST_MODE=true in .env.local for safe testing');
  console.log('  2. Make a test payment');
  console.log('  3. Check console logs for [Payments] or [Payment API] messages');
  console.log('  4. Verify test data in fluent/.test-payments-data.json (if test mode)');
  console.log('  5. Verify MongoDB payments collection (if production mode)');
  process.exit(0);
} else {
  if (errors.length > 0) {
    console.log(`\n❌ Errors found (${errors.length}):`);
    errors.forEach(err => console.log(`   - ${err}`));
  }
  
  if (warnings.length > 0) {
    console.log(`\n⚠️  Warnings (${warnings.length}):`);
    warnings.forEach(warn => console.log(`   - ${warn}`));
  }
  
  console.log('\n⚠️  Please fix errors before testing.');
  process.exit(errors.length > 0 ? 1 : 0);
}

