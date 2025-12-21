# Payments Collection - Complete Guide

## Overview

This document covers the new `payments` collection implementation. This collection serves as a centralized, comprehensive payment tracking system that **complements** (not replaces) existing payment storage in `students` and `billing` collections.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Current System](#current-system)
3. [Schema & Types](#schema--types)
4. [Integration](#integration)
5. [Test Mode](#test-mode)
6. [Testing Guide](#testing-guide)
7. [Database Indexes](#database-indexes)

---

## Quick Start

### Default Behavior (Production)

- ✅ Writes to MongoDB `payments` collection
- ✅ Works alongside existing `students` and `billing` collections
- ✅ No environment variable needed
- ✅ Production-ready

### Enable Test Mode (Local Testing Only)

Add to `.env.local`:
```bash
PAYMENTS_TEST_MODE=true
```

This writes to JSON file instead of MongoDB for safe testing.

---

## Current System

### Existing Payment Storage

**1. `students` collection:**
- `orderId`, `paymentId`, `paymentStatus`, `paymentHistory`, `paymentYyyymm`

**2. `billing` collection:**
- Documents with `step: "PaymentConfirm"`
- Used by admin billing page to check payment status
- **MUST continue to be updated** (admin workflow depends on it)

### Payment Flow Points:
1. **Initiation**: `POST /api/payment` → `saveInitialPayment()`
2. **Success**: `GET /api/payment` → `updatePaymentStatus()` + `savePaymentConfirmStatus()`
3. **Webhook**: `POST /api/payment/webhook` → `updatePaymentStatus()`

---

## Schema & Types

Types are defined in `fluent/types/payment.d.ts`.

**Key Types:**
- `PaymentStatus`: 'INITIATED' | 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED' | 'PARTIALLY_REFUNDED' | 'EXPIRED'
- `PaymentMethod`: '카드' | '가상계좌' | '계좌이체' | '휴대폰' | '간편결제' | 'UNKNOWN'
- `PaymentDocument`: Complete payment document interface

**Key Fields:**
- Identifiers: `orderId`, `paymentKey`, `student_name`, `student_id`
- Payment Details: `amount`, `currency`, `method`, `status`, `description`, `quantity`
- Billing: `yyyymm`
- Toss Data: Complete Toss response in `tossData` field
- Timestamps: `createdAt`, `updatedAt`, status-specific timestamps
- History: `statusHistory` array tracks all status changes

---

## Integration

### Already Integrated

The code is already integrated into:
- ✅ `POST /api/payment` - Creates payment document on initiation
- ✅ `GET /api/payment` - Updates payment document on success
- ✅ `POST /api/payment/webhook` - Updates payment document from webhook
- ✅ `BillingPanel-AdminConfirm.tsx` - Sends `description` parameter

### How It Works

**Payment Initiation:**
```typescript
// Creates payment document in payments collection (non-blocking)
try {
  await createPayment({ orderId, student_name, amount, description, ... });
} catch (err) {
  // Log but don't fail - existing flow continues
}
```

**Payment Success:**
```typescript
// Updates payment document with Toss data (non-blocking)
try {
  await updatePaymentDoc(orderId, { status: 'COMPLETED', tossData, ... });
} catch (err) {
  // Log but don't fail - existing flow continues
}
```

**Safety Features:**
- ✅ All operations wrapped in try-catch
- ✅ Failures don't break existing payment flow
- ✅ Existing collections (`students`, `billing`) still updated normally
- ✅ Additive only - never modifies existing data

---

## Test Mode

### Enable Test Mode

Add to `.env.local` (for local testing only):
```bash
PAYMENTS_TEST_MODE=true
```

### How Test Mode Works

**When Enabled (`PAYMENTS_TEST_MODE=true`):**
- ✅ Writes to JSON file: `fluent/.test-payments-data.json`
- ✅ No MongoDB writes for payments collection
- ✅ Existing payment flow still works (students/billing still use MongoDB)
- ✅ Safe for testing without touching production DB

**When Disabled (default):**
- ✅ Writes to MongoDB (production mode)
- ✅ No environment variable needed
- ✅ Production-ready

### Test Data File

**Location:** `fluent/.test-payments-data.json` (gitignored)

**Format:** JSON array of payment documents

**View Test Data:**
```bash
cat fluent/.test-payments-data.json
# or with formatting
cat fluent/.test-payments-data.json | jq
```

**Clear Test Data:**
```bash
rm fluent/.test-payments-data.json
# or
echo "[]" > fluent/.test-payments-data.json
```

### Console Logs

When test mode is active:
```
[Payments Test Mode] ⚠️ TEST MODE ACTIVE - Writing to JSON file instead of MongoDB
[Payments Test Mode] ✅ Created payment (TEST): orderId=xxx, student=TestStudent, amount=100000
[Payments Test Mode] 📄 Test data file: ./fluent/.test-payments-data.json
```

---

## Testing Guide

### Pre-Testing Checklist

- [ ] Code is deployed/restarted
- [ ] Check console logs for `[Payments]` or `[Payment API]` messages
- [ ] (Optional) Enable test mode: `PAYMENTS_TEST_MODE=true` in `.env.local`

### Test 1: Payment Initiation

**Steps:**
1. Go to payment page
2. Initiate a payment
3. Check console logs

**Expected:**
- ✅ Payment proceeds normally
- ✅ Console shows: `[Payment API] Payment document created successfully`
- ✅ If test mode: JSON file created/updated
- ✅ If production: MongoDB document created

**Verify:**
```javascript
// MongoDB (production)
db.payments.findOne({ orderId: "your-test-orderId" });

// JSON file (test mode)
cat fluent/.test-payments-data.json | jq '.[] | select(.orderId == "your-test-orderId")'
```

### Test 2: Payment Success

**Steps:**
1. Complete a test payment (use test card: 4111-1111-1111-1111)
2. Check console logs

**Expected:**
- ✅ Payment completes normally
- ✅ Console shows: `[Payment API] Payment document updated successfully`
- ✅ Existing `students` and `billing` collections updated (as before)
- ✅ Payment document status updated to 'COMPLETED'

**Verify:**
```javascript
// Check payment status
db.payments.findOne({ orderId: "your-test-orderId" });
// Should have status: "COMPLETED" and tossData populated

// Verify existing collections still work
db.students.findOne({ orderId: "your-test-orderId" });
db.billing.findOne({ "meta.orderId": "your-test-orderId" });
```

### Test 3: Admin Billing Status

**Steps:**
1. Go to `/teacher/admin_billing`
2. Verify payment status shows correctly

**Expected:**
- ✅ Admin billing page works exactly as before
- ✅ Uses `billing` collection (unchanged)
- ✅ Shows "paid" status correctly

**Verify:**
```javascript
// Check billing collection still works
db.billing.find({ step: "PaymentConfirm", yyyymm: "202501" });
```

### Troubleshooting

**Payment document not created:**
- Check console for errors
- Verify MongoDB connection (production mode)
- Check file permissions (test mode)
- **Non-critical** - existing flow continues

**Payment document not updated:**
- May be normal if payment was created before integration
- Check console logs for warnings
- **Non-critical** - existing flow continues

---

## Database Indexes

Create these indexes for optimal performance (production only):

```javascript
use school_management;

db.payments.createIndex({ orderId: 1 }, { unique: true });
db.payments.createIndex({ student_name: 1, createdAt: -1 });
db.payments.createIndex({ status: 1, createdAt: -1 });
db.payments.createIndex({ paymentKey: 1 }, { sparse: true });
db.payments.createIndex({ yyyymm: 1, status: 1 });
db.payments.createIndex({ createdAt: -1 });
```

---

## Important Notes

### Safety

1. **Never modifies existing data** - only creates new documents
2. **Non-breaking** - all operations wrapped in try-catch
3. **Additive only** - existing collections still updated normally
4. **Test mode available** - safe testing without touching production DB

### Critical Requirements

1. **Description field** - Already integrated, captured from frontend
2. **Billing collection** - MUST continue to be updated (admin billing depends on it)
3. **Default behavior** - Production mode (MongoDB) by default
4. **Test mode** - Only enable for local testing, disable for production

### Data Flow

```
Payment Succeeds
    ↓
1. Update students collection (existing - keeps working)
    ↓
2. Update billing collection (existing - keeps working - admin checks this!)
    ↓
3. Update payments collection (NEW - additional storage)
```

All three happen in parallel - no breaking changes!

---

## Helper Functions

All functions in `fluent/lib/payments.ts`:

- `createPayment()` - Create new payment document
- `updatePaymentStatus()` - Update status with history tracking
- `getPaymentByOrderId()` - Get payment by orderId
- `getPaymentsByStudent()` - Get all payments for a student
- `getPaymentsByStatus()` - Query by status
- `addPaymentError()` - Log errors
- `getPaymentStatistics()` - Get payment stats

---

## Files

- **Types**: `fluent/types/payment.d.ts`
- **Functions**: `fluent/lib/payments.ts`
- **Integration**: `fluent/src/app/api/payment/route.ts`, `fluent/src/app/api/payment/webhook/route.ts`
- **Frontend**: `fluent/components/BillingPanel-AdminConfirm.tsx`

---

## Summary

✅ **Ready for production** - Defaults to MongoDB (production mode)  
✅ **Test mode available** - Set `PAYMENTS_TEST_MODE=true` for local testing  
✅ **Safe design** - Non-breaking, additive only  
✅ **Existing system** - Continues to work unchanged  
✅ **Admin billing** - Still uses `billing` collection (unchanged)  

