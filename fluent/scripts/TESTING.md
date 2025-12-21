# Payments Collection Testing Guide

## Quick Start

The payments collection integration can be tested via API calls without needing to log in through the UI.

## Prerequisites

1. **MongoDB Connection**: Even if using test mode, other parts of the API need MongoDB configured
   ```bash
   # In .env.local
   MONGODB_URI=your_mongodb_connection_string
   ```

2. **Test Mode (Optional)**: To test without affecting production MongoDB
   ```bash
   # In .env.local
   PAYMENTS_TEST_MODE=true  # Defaults to false (production mode)
   PAYMENTS_TEST_DATA_FILE=./fluent/.test-payments-data.json  # Optional, has default
   ```

3. **Start your dev server**:
   ```bash
   npm run dev
   ```

## Running the Test

```bash
# With test mode (recommended for testing)
PAYMENTS_TEST_MODE=true node fluent/scripts/test-payments-collection.js

# Without test mode (writes to real MongoDB)
node fluent/scripts/test-payments-collection.js
```

## What Gets Tested

1. **Payment Creation (POST /api/payment)**
   - Creates a payment with description and quantity
   - Verifies payment document is created in payments collection
   - Checks test data file (if test mode) or MongoDB (production mode)

2. **Payment Retrieval**
   - Retrieves payment by orderId
   - Gets payments by student name

3. **Multiple Payments**
   - Tests creating multiple payments
   - Verifies all are stored correctly

## Test Data Location

- **Test Mode**: `fluent/.test-payments-data.json`
- **Production Mode**: MongoDB collection `school_management.payments`

## Expected Console Output

Look for these messages in your server console:
- `[Payment API] Payment document created successfully for orderId: ...`
- `[Payment API] Failed to create payment document (non-critical): ...` (if there's an error, but payment still proceeds)

## Troubleshooting

### Error: "MONGODB_URI is not defined"
- **Solution**: Add `MONGODB_URI` to your `.env.local` file
- Even in test mode, other parts of the API need MongoDB

### Error: "Cannot connect to server"
- **Solution**: Make sure your dev server is running (`npm run dev`)

### Test mode not working
- **Solution**: Ensure `PAYMENTS_TEST_MODE=true` is set in `.env.local` and restart your dev server
- Check that the test data file path is writable

## Integration Points Verified

✅ POST /api/payment - Creates payment documents  
✅ GET /api/payment - Updates payment status on completion  
✅ POST /api/payment/webhook - Updates payment status from webhook  
✅ Frontend - Sends description and quantity parameters  

