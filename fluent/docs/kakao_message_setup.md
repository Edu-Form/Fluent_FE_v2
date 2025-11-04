# Kakao Message Integration Setup

This document explains how to set up Kakao Talk Message API for sending messages to users from the admin dashboard.

## Overview

The Kakao Message module allows admins to send messages to students through Kakao Talk. Currently implemented as a separate module with a test page that can be integrated into the admin dashboard later.

## Files Created

### API Route
- `src/app/api/kakao-message/route.ts` - Backend API for sending Kakao messages

### Test Page
- `src/app/test/kakao-message/page.tsx` - Simple test page for testing message sending

## Setup Instructions

### 1. Create Kakao Developers App

1. Go to [Kakao Developers Console](https://developers.kakao.com/)
2. Sign in with your Kakao account
3. Click "앱 만들기" (Create App)
4. Fill in the required information:
   - App Name: Fluent (or your app name)
   - Admin email: Your email
5. Click "확인" (Confirm)

### 2. Configure App Settings

1. Go to "앱 설정" (App Settings)
2. Add Platform:
   - For Web: Add your domain
3. Set Redirect URI:
   - For now, you can use: `http://localhost:3000` (for testing)
   - For production: `https://fluent-five.vercel.app`

### 4. Enable Kakao Talk Message

1. Go to "제품 설정" (Product Settings)
2. Click "Kakao Talk Message" and enable it
3. Go to "Message" settings

### 5. Get API Keys

1. Go to "제품 설정" > "Kakao Login"
2. Find "REST API Key" - this is your `KAKAO_REST_API_KEY`
3. Go to "앱 설정" > "앱 키"
4. Find "Admin Key" - this is your `KAKAO_ADMIN_KEY`

### 6. Set Environment Variables

Create or update `.env.local` in the `fluent` directory:

```env
# Kakao API Keys
KAKAO_REST_API_KEY=your_rest_api_key_here
KAKAO_ADMIN_KEY=your_admin_key_here

# Existing environment variables
NEXT_PUBLIC_URL=https://fluent-five.vercel.app
```

### 7. Restart Development Server

```bash
yarn dev
```

## Testing

### Access Test Page

Navigate to: `http://localhost:3000/test/kakao-message`

### Send Test Message

1. Enter a phone number (for testing purposes)
2. Enter a message
3. Click "메시지 전송" (Send Message)
4. Check the result

**Note**: The current implementation uses "Send to myself" (나에게 메시지 보내기) feature. To send to actual users, you'll need to:

1. Implement Kakao Login to link user accounts
2. Store user's Kakao user ID
3. Send messages to specific user IDs

## API Reference

### POST /api/kakao-message

Send a message to a user.

**Request Body:**
```json
{
  "phoneNumber": "010-1234-5678",
  "message": "Hello, this is a test message"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": { ... }
}
```

**Response (Error):**
```json
{
  "error": "Error message",
  "details": { ... }
}
```

## Integration into Admin Dashboard

To integrate this into the admin dashboard:

1. Add a "Send Message" button to the admin billing page
2. Use the Kakao Message API to send payment notifications
3. Customize message templates based on the situation

Example integration in admin billing page:

```typescript
const sendKakaoMessage = async (studentName: string, message: string) => {
  const response = await fetch('/api/kakao-message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phoneNumber: studentPhoneNumber,
      message: message
    })
  });
  
  return response.json();
};
```

## Future Improvements

1. **User Linking**: Implement Kakao Login to link user accounts
2. **Message Templates**: Create reusable message templates
3. **Batch Sending**: Add ability to send to multiple users
4. **Scheduled Messages**: Add ability to schedule messages
5. **Message History**: Store sent messages in database
6. **User Preferences**: Let users opt-in/opt-out of messages

## Troubleshooting

### "Kakao Admin Key is not configured" Error

- Make sure `.env.local` file exists in the `fluent` directory
- Check that `KAKAO_ADMIN_KEY` is set correctly
- Restart the development server after adding environment variables

### "Failed to send message" Error

- Check that Kakao Talk Message is enabled in Kakao Developers Console
- Verify that your Admin Key is correct
- Check browser console for detailed error messages

### Message Not Received

- Currently using "Send to myself" feature - only works for the logged-in admin
- To send to actual users, need to implement Kakao Login and user linking
- Check Kakao Developers Console for message sending statistics

## Documentation Links

- [Kakao Developers](https://developers.kakao.com/docs/latest/en/index)
- [Kakao Talk Message API](https://developers.kakao.com/docs/latest/en/kakaotalk-message/common)
- [Kakao Login API](https://developers.kakao.com/docs/latest/en/kakaologin/common)

## Support

For issues or questions:
- Check [Kakao Developers Documentation](https://developers.kakao.com/docs/latest/en/index)
- Review error messages in browser console and server logs
- Contact Kakao Developers support through their console
