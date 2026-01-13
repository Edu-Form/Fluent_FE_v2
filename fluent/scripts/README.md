# Payment Scripts

Helper scripts for testing and managing payments in the database.

## Scripts

### 1. `check-payments-in-db.js`

Check payment status in MongoDB collections.

**Usage:**
```bash
node scripts/check-payments-in-db.js
```

**What it shows:**
- Total payments in `payments` collection
- Recent payments with orderId, student name, amount, and status
- Students with payment data from `students` collection
- Billing confirmations from `billing` collection

**Example output:**
```
1️⃣  PAYMENTS COLLECTION
   Total documents: 5
   Recent payments:
   1. OrderId: 1768289350509
      Student: TEST_STUDENT
      Amount: 5,000 KRW
      Status: COMPLETED
```

---

### 2. `create-test-payment.sh`

Create a test payment in the database.

**Usage:**
```bash
# With custom student name and amount
./scripts/create-test-payment.sh "John Doe" 10000

# With defaults (TEST_STUDENT, 5000 KRW)
./scripts/create-test-payment.sh
```

**Parameters:**
- `studentName` (optional): Student name (default: "TEST_STUDENT")
- `amount` (optional): Payment amount in KRW (default: 5000)

**What it does:**
- Creates a payment via `/api/payment/link` endpoint
- Saves payment to `students` collection
- Saves payment to `payments` collection
- Returns a Toss payment link (for testing actual payment flow)

**Example:**
```bash
./scripts/create-test-payment.sh "Jane Smith" 15000
```

---

### 3. `test-webhook-simple.js`

Test webhook updates by simulating a Toss webhook call.

**Usage:**
```bash
node scripts/test-webhook-simple.js <orderId> [status] [amount]
```

**Parameters:**
- `orderId` (required): The payment orderId to update
- `status` (optional): Payment status - "DONE", "CANCELED", "ABORTED", "EXPIRED" (default: "DONE")
- `amount` (optional): Payment amount in KRW (default: 5000)

**What it does:**
- Sends a webhook payload to `/api/payment/webhook` endpoint
- Updates payment status in `students` collection
- Updates payment status in `payments` collection
- Simulates what Toss Payments sends automatically

**Examples:**
```bash
# Test successful payment (DONE)
node scripts/test-webhook-simple.js 1768289350509 DONE 10000

# Test cancelled payment
node scripts/test-webhook-simple.js 1768289350509 CANCELED 10000

# Test with defaults
node scripts/test-webhook-simple.js 1768289350509
```

**Status values:**
- `DONE` → Payment completed (status becomes `COMPLETED`)
- `CANCELED` → Payment cancelled (status becomes `CANCELLED`)
- `ABORTED` → Payment aborted (status becomes `FAILED`)
- `EXPIRED` → Payment expired (status becomes `FAILED`)

---

## Common Workflows

### Create and Test a Payment

```bash
# 1. Create a test payment
./scripts/create-test-payment.sh "Test Student" 10000

# 2. Check the database to get the orderId
node scripts/check-payments-in-db.js

# 3. Test webhook update (use orderId from step 2)
node scripts/test-webhook-simple.js <orderId> DONE 10000

# 4. Verify the update
node scripts/check-payments-in-db.js
```

### Quick Payment Check

```bash
# Just check what payments exist
node scripts/check-payments-in-db.js
```

---

## Prerequisites

1. **Next.js server must be running:**
   ```bash
   npm run dev
   ```

2. **Environment variables configured:**
   - `MONGODB_URI` - MongoDB connection string
   - `TOSS_SECRET_KEY` - Toss Payments secret key (for payment creation)

3. **PAYMENTS_TEST_MODE:**
   - Should be **NOT SET** or set to `false` for production
   - Only set to `true` in `.env.local` for local testing (writes to JSON instead of MongoDB)

---

## Notes

- All scripts connect directly to MongoDB (they don't go through the Next.js API)
- The webhook test script simulates what Toss Payments sends automatically
- In production, Toss calls `/api/payment/webhook` automatically when payment status changes
- Payments are saved to both `students` and `payments` collections for backward compatibility

---

## Troubleshooting

**"Cannot connect to MongoDB"**
- Check that `MONGODB_URI` is set in `.env.local`
- Verify MongoDB connection is accessible

**"Payment not found"**
- Make sure the orderId exists in the database
- Run `check-payments-in-db.js` to see available payments

**"Webhook test fails"**
- Ensure Next.js server is running (`npm run dev`)
- Check server logs for error messages
