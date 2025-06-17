# Google Cloud Console Setup - Redirect URIs

## 1. OAuth 2.0 Client ID Configuration

When setting up your OAuth 2.0 Client ID in Google Cloud Console, add these redirect URIs:

### For Development:
```
http://localhost:3000/api/auth/google/callback
```

### For Production:
```
https://yourdomain.com/api/auth/google/callback
```

## 2. Step-by-Step Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
4. Select **Web application**
5. Add these **Authorized redirect URIs**:
   - `http://localhost:3000/api/auth/google/callback` (development)
   - `https://yourdomain.com/api/auth/google/callback` (production)
6. Copy the **Client ID** and **Client Secret**

## 3. OAuth Consent Screen

Make sure your OAuth consent screen is configured:
1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **External** user type
3. Fill in required fields:
   - App name
   - User support email
   - Developer contact information
4. Add scopes: `https://www.googleapis.com/auth/calendar`
5. Add test users (your email) during development

## 4. API Restrictions (Optional but Recommended)

For your API Key:
1. Go to **APIs & Services** → **Credentials**
2. Click on your API key
3. Under **API restrictions**, select **Restrict key**
4. Choose **Google Calendar API**
5. Under **Website restrictions**, add your domains:
   - `http://localhost:3000/*` (development)
   - `https://fluent-five.vercel.app/*` (production)

## 5. Testing Your Setup

Your OAuth flow will work like this:
1. User clicks "Sign In" → Redirects to Google OAuth
2. User authorizes → Google redirects to `/api/auth/google/callback`
3. Your API route exchanges code for tokens
4. User is redirected back to `/calendar` with tokens
5. Frontend stores tokens and completes authentication

## 6. Security Notes

- Never expose `GOOGLE_CLIENT_SECRET` in frontend code
- Use HTTPS in production
- Consider implementing CSRF protection with state parameter
- Store tokens securely (consider httpOnly cookies for production)