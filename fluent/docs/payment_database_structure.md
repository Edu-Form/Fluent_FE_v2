# Payment Database Structure

## Overview
When a Toss payment is successful, payment information is recorded in **two MongoDB collections**:

1. **`students` collection** - Stores payment status and history for individual students
2. **`billing` collection** - Stores payment confirmations grouped by month (yyyymm) for billing purposes

---

## 1. `students` Collection

**Database**: `school_management`  
**Collection**: `students`

### Fields Updated When Payment is Successful:

#### Initial Payment (Before Toss Payment):
- **`orderId`** (string) - Unique UUID generated for the transaction
- **`paymentStatus`** (string) - Set to `'PENDING'`
- **`paymentYyyymm`** (string) - Optional: Month in format "YYYYMM" (e.g., "202401")

#### After Successful Payment:
- **`paymentId`** (string) - Toss payment key (`payment.paymentKey` from Toss API)
- **`paymentStatus`** (string) - Updated to `'COMPLETED'` (if status is 'DONE') or `'FAILED'`
- **`paymentHistory`** (string) - Appended with new entry: `"{ISO_DATE}: {payment.method} {payment.totalAmount}"`
  - Example: `"2024-01-15T10:30:00.000Z: 카드 480000"`

### Code Location:
- **Initial Payment**: `fluent/lib/data.ts` → `saveInitialPayment()` (line 1717)
- **Update After Success**: `fluent/lib/data.ts` → `updatePaymentStatus()` (line 1689)

### MongoDB Query:
```javascript
// Find by orderId (used to update after payment)
db.collection("students").updateOne(
  { orderId: "uuid-here" },
  {
    $set: {
      paymentId: "payment_key_from_toss",
      paymentStatus: "COMPLETED",
      paymentHistory: "2024-01-15T10:30:00.000Z: 카드 480000"
    }
  }
)
```

---

## 2. `billing` Collection

**Database**: `school_management`  
**Collection**: `billing`

### Document Structure:

**Filter Criteria**:
- **`yyyymm`** (string) - Month in format "YYYYMM" (e.g., "202401")
- **`step`** (string) - Always `"PaymentConfirm"` for payment confirmations

**Fields in Document**:
- **`student_names`** (array or string) - Array of student names who have paid for this month
  - Uses `$addToSet` to avoid duplicates
- **`savedAt`** (Date) - Timestamp when payment was confirmed
- **`savedBy`** (string) - Usually `"payment-api"`
- **`meta`** (object) - Contains payment details:
  - **`meta.orderId`** (string) - Toss order ID
  - **`meta.paymentKey`** (string) - Toss payment key
  - **`meta.amount`** (number) - Payment amount (e.g., 480000)
  - **`meta.method`** (string) - Payment method (e.g., "카드", "간편결제")
  - **`meta.status`** (string) - Payment status (e.g., "DONE")
  - **`meta.approvedAt`** (string) - ISO timestamp when payment was approved by Toss
- **`createdAt`** (Date) - Set only on document creation
- **`type`** (string) - `"paymentconfirm_status"` (set only on creation)

### Code Location:
- **Save Payment Confirm**: `fluent/lib/data.ts` → `savePaymentConfirmStatus()` (line 1287)
- **Called from**: `fluent/src/app/api/payment/route.ts` → GET handler (line 122)

### MongoDB Query:
```javascript
// Upsert payment confirmation
db.collection("billing").findOneAndUpdate(
  { yyyymm: "202401", step: "PaymentConfirm" },
  {
    $addToSet: { student_names: { $each: ["StudentName"] } },
    $set: {
      savedAt: new Date(),
      savedBy: "payment-api",
      meta: {
        orderId: "order-id",
        paymentKey: "payment-key",
        amount: 480000,
        method: "카드",
        status: "DONE",
        approvedAt: "2024-01-15T10:30:00.000Z"
      }
    },
    $setOnInsert: {
      createdAt: new Date(),
      type: "paymentconfirm_status"
    }
  },
  { upsert: true, returnDocument: "after" }
)
```

---

## Payment Flow Summary

### Step 1: Payment Initiation
1. Frontend calls `/api/payment/link` (POST)
2. `saveInitialPayment()` saves to `students` collection:
   - Sets `orderId`, `paymentStatus: 'PENDING'`, `paymentYyyymm`

### Step 2: User Completes Payment on Toss
- User redirected to Toss Payments
- After payment, redirected back with `paymentKey`, `orderId`, `amount` in URL

### Step 3: Payment Confirmation (Success)
1. Frontend calls `/api/payment` (GET) with payment details
2. Backend confirms with Toss Payments API (`/v1/payments/confirm`)
3. If successful:
   - **`updatePaymentStatus()`** updates `students` collection:
     - Sets `paymentId`, `paymentStatus: 'COMPLETED'`, appends to `paymentHistory`
   - **`savePaymentConfirmStatus()`** creates/updates `billing` collection:
     - Adds student to `student_names` array for the month
     - Saves payment details in `meta` object

---

## Important Notes

1. **Credits**: The payment system does **NOT automatically increment student credits**. Credits appear to be managed separately (possibly manually or through a different process).

2. **Multiple Payments**: If a student makes multiple payments in the same month, they will be added to the same `billing` document (same `yyyymm` + `step: "PaymentConfirm"`), but the `meta` object will be overwritten with the latest payment details.

3. **Order ID**: The `orderId` is a UUID generated on the server side and is unique per transaction.

4. **Payment Key**: The `paymentKey` is provided by Toss Payments and is used to reference the payment in Toss's system.

5. **Payment History**: The `paymentHistory` field in `students` collection is a string that gets appended to, not an array. Format: `"{ISO_DATE}: {method} {amount}"`

---

## Query Examples

### Find all payments for a student:
```javascript
// From students collection
db.students.findOne(
  { name: "StudentName" },
  { projection: { paymentHistory: 1, paymentId: 1, paymentStatus: 1, orderId: 1 } }
)

// From billing collection (all months)
db.billing.find({
  step: "PaymentConfirm",
  $or: [
    { student_names: "StudentName" },
    { student_names: { $in: ["StudentName"] } }
  ]
})
```

### Find all payments for a specific month:
```javascript
db.billing.findOne({
  yyyymm: "202401",
  step: "PaymentConfirm"
})
```

