# Toss Payment Integration Setup

## Environment Variables Required

Create a `.env.local` file in the fluent directory with the following variables:

```env
# Toss Payments Configuration
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq
TOSS_SECRET_KEY=test_sk_4vJj1LqK2RQbOaPzrW3nY9x8B7c6D5e
NEXT_PUBLIC_URL=https://fluent-five.vercel.app
```

## How to Get Your Toss Payment Keys

1. Go to [Toss Payments Developer Console](https://developers.tosspayments.com/)
2. Sign up or log in to your account
3. Create a new project or select existing project
4. Go to "API Keys" section
5. Copy your Client Key and Secret Key

## Test vs Live Keys

- **Test Keys**: Start with `test_ck_` and `test_sk_` (for development)
- **Live Keys**: Start with `live_ck_` and `live_sk_` (for production)

## Updated Payment Flow

The payment button now:
1. Calls `/api/payment` to create payment order
2. Uses Toss Payments SDK to open payment window
3. Redirects to success/failure pages
4. Verifies payment on success page

## Debug Information

The payment page now includes debug information that shows:
- Whether the Toss client key is set
- Whether the Toss SDK is loaded
- Console logs for troubleshooting

## Troubleshooting

### Common Issues:

1. **"TossPayments SDK is not loaded"**
   - Check if the script is loaded in `layout.tsx`
   - Ensure the page has fully loaded before clicking payment button

2. **"Toss client key is not configured"**
   - Verify `.env.local` file exists with `NEXT_PUBLIC_TOSS_CLIENT_KEY`
   - Restart the development server after adding environment variables

3. **Payment window doesn't open**
   - Check browser console for errors
   - Verify the payment API (`/api/payment`) is working
   - Ensure Toss secret key is configured for the API

## Files Modified

- `src/app/teacher/payment/page.tsx` - Updated payment button integration with debug info
- `src/app/layout.tsx` - Already includes Toss SDK script
- `src/app/api/payment/route.ts` - Already implemented payment API
- `src/app/payment/success/page.tsx` - Already implemented success handling
- `src/app/payment/fail/page.tsx` - Already implemented failure handling

## Testing Steps

1. Set up environment variables in `.env.local`
2. Start the development server
3. Navigate to `/teacher/payment` with proper query parameters
4. Check debug info shows "Client Key: Set, SDK: Loaded"
5. Click "Toss 간편결제" button
6. Verify payment window opens
7. Complete test payment
8. Verify redirect to success page
