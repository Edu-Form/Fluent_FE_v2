# Kakao Message Troubleshooting

## Common Error: "this access token does not exist" (401)

### Cause
The Admin Key in your `.env.local` file is incorrect or invalid.

### Solution Steps

1. **Go to Kakao Developers Console**
   - Visit: https://developers.kakao.com/
   - Log in with your Kakao account

2. **Select Your App**
   - Click on your app in the dashboard

3. **Get Admin Key**
   - Go to "앱 설정" (App Settings)
   - Click "앱 키" (App Keys)
   - Copy the "Admin Key" value (NOT the REST API Key)

4. **Update .env.local**
   ```env
   KAKAO_ADMIN_KEY=your_actual_admin_key_here
   ```

5. **Admin Key Format**
   - Admin keys are usually long strings (50-60 characters)
   - Example format: `b1a2c3d4e5f6g7h8i9j0k1l2m3n4o5p6...`
   - Do NOT include quotes around the key
   - No spaces before or after the key

6. **Restart Dev Server**
   ```bash
   # Stop the current server (Ctrl+C)
   # Then restart:
   yarn dev
   ```

### Important Notes

- ❌ **REST API Key** ≠ Admin Key
- ✅ Use **Admin Key** for server-side API calls
- ✅ No quotes needed in `.env.local`
- ✅ Restart server after changing `.env.local`

### Still Having Issues?

1. Check that you enabled "Kakao Talk Message" in:
   - 제품 설정 > Kakao Talk Message > 활성화

2. Verify app platform is set correctly:
   - For web: Add your domain
   - Redirect URI configured

3. Check Admin Key permissions:
   - Admin Key should have "Message" permission enabled

### Alternative: Use Development Mode

If you're in development/testing phase:
- Some Kakao features require app approval
- Development mode has limited functionality
- Production mode requires additional verification

For more help:
- Kakao Developers Support: https://devtalk.kakao.com/
- Check server logs for detailed error messages
