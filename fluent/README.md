This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

---

## Payment Flow

This application integrates with Toss Payments for handling student payments. The payment system uses a centralized `payments` collection that complements existing `students` and `billing` collections.

### Payment Flow Overview

1. **Payment Initiation** (`POST /api/payment`)
   - Student initiates payment from `/student/payment` page
   - System generates unique `orderId` (UUID)
   - Saves initial state to `students` collection (paymentStatus: 'PENDING')
   - Creates payment document in `payments` collection (if enabled)
   - Returns payment details to frontend for Toss Payments SDK

2. **Payment Completion** (`GET /api/payment`)
   - User completes payment on Toss Payments page
   - Redirected back with `paymentKey`, `orderId`, `amount`
   - System confirms payment with Toss Payments API
   - Updates `students` collection (paymentStatus: 'COMPLETED', paymentHistory)
   - Updates `billing` collection (adds student to PaymentConfirm for month)
   - Updates `payments` collection document (if enabled)

3. **Payment Webhook** (`POST /api/payment/webhook`)
   - Toss Payments sends real-time payment status updates
   - Updates `students` collection
   - Updates `payments` collection document (if enabled)

### Payment Data Storage

The system stores payment information in **three collections**:

#### 1. `students` Collection
- **Fields**: `orderId`, `paymentId`, `paymentStatus`, `paymentHistory`, `paymentYyyymm`
- **Used by**: Student home page, payment history page, admin billing status checks
- **Purpose**: Quick access to student payment status and history

#### 2. `billing` Collection
- **Fields**: Documents with `step: "PaymentConfirm"`, `student_names` array, `meta` object
- **Used by**: Admin billing page (`/teacher/admin_billing`)
- **Purpose**: Monthly billing tracking and payment confirmations

#### 3. `payments` Collection (New)
- **Fields**: Comprehensive payment documents with full Toss Payments response data
- **Used by**: Centralized payment tracking (currently additive, pages still use students/billing)
- **Purpose**: Complete payment audit trail, receipt generation, future admin views

### Test Mode

To test payments without affecting production MongoDB:

1. **Enable Test Mode** in `.env.local`:
   ```bash
   PAYMENTS_TEST_MODE=true
   ```

2. **Test Data Location**:
   - **File**: `test-payments-data.json` (visible file)
   - **Full path**: `fluent/test-payments-data.json`
   - **View the file**:
     ```bash
     # From project root
     cat fluent/test-payments-data.json
     
     # Or open in editor
     code fluent/test-payments-data.json
     
     # Or view with JSON formatter
     cat fluent/test-payments-data.json | jq .
     ```
   - **Note**: The file is created automatically when test mode is enabled and a payment is made

3. **Test Payment Flow**:
   ```bash
   # Run test script (requires server running)
   PAYMENTS_TEST_MODE=true node fluent/scripts/test-payments-collection.js
   ```

4. **Production Mode** (default):
   - Set `PAYMENTS_TEST_MODE=false` or omit the variable
   - Data writes to MongoDB `school_management.payments` collection

### Payment History

Students can view their payment history at `/student/payment/history?user={studentName}&id={phoneNumber}`.

**Data Sources**:
- Primary: `billing` collection (PaymentConfirm documents)
- Fallback: `students.paymentHistory` string
- Credit deductions: Parsed from `students.paymentHistory` and `schedules` collection

### Admin Billing

Teachers can view billing status at `/teacher/admin_billing`.

**Data Source**: `billing` collection with `step: "PaymentConfirm"` for each month.

### API Endpoints

- `POST /api/payment` - Initiate payment
- `GET /api/payment` - Confirm payment (after Toss redirect)
- `POST /api/payment/webhook` - Receive payment status updates from Toss
- `GET /api/payment/history?studentName={name}` - Get student payment history

### Documentation

For detailed payment system documentation, see:
- `fluent/docs/payments_collection.md` - Complete payments collection guide
- `fluent/docs/payment_database_structure.md` - Database structure details

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
