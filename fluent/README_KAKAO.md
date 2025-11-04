# Kakao Message Integration - Quick Start

## Overview
This module allows admins to send Kakao Talk messages to users from the dashboard.

## Quick Setup

### 1. Environment Variables
Add these to your `.env.local` file:

```env
KAKAO_REST_API_KEY=your_rest_api_key
KAKAO_ADMIN_KEY=your_admin_key
```

### 2. Get Kakao API Keys
1. Go to [Kakao Developers Console](https://developers.kakao.com/)
2. Create/Select your app
3. Enable "Kakao Talk Message" product
4. Get Admin Key from "앱 설정 > 앱 키"

### 3. Test the Feature
1. Start the dev server: `yarn dev`
2. Navigate to: `http://localhost:3000/test/kakao-message`
3. Enter phone number and message
4. Click "메시지 전송"

## Files
- **API**: `src/app/api/kakao-message/route.ts`
- **Test Page**: `src/app/test/kakao-message/page.tsx`
- **Docs**: `docs/kakao_message_setup.md`
- **Summary**: `docs/kakao_implementation_summary.md`

## Current Status
✅ API endpoint ready  
✅ Test page working  
✅ Documentation complete  

⚠️ Currently uses "Send to myself" feature only  
🔨 Need to implement Kakao Login for production

## Next Steps
1. Set up Kakao Developers account
2. Add API keys to `.env.local`
3. Test using the test page
4. Integrate into admin dashboard when ready

For detailed instructions, see `docs/kakao_message_setup.md`
