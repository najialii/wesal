# Google Authentication Troubleshooting Guide

## Issues Identified and Solutions

### 1. CORS Headers Issue ✅ FIXED
**Problem:** Server not sending correct CORS headers for Google's authentication flow
**Solution:** Updated `backend/wesaltech/config/cors.php` with proper origins and headers

### 2. Popup Blocked Issue ✅ IMPROVED
**Problem:** Browser blocking Google OAuth popup
**Solution:** Enhanced `googleAuth.ts` with better popup handling and fallback mechanisms

### 3. FedCM Issues ✅ IMPROVED
**Problem:** FedCM (Federated Credential Management) API having issues
**Solution:** Added fallback from popup to One Tap and better error handling

### 4. Redirect URI Configuration ✅ IMPROVED
**Problem:** Redirect URI mismatch
**Solution:** Updated `google.ts` config with proper URI handling

## Current Configuration Status

### Backend CORS Configuration
```php
// backend/wesaltech/config/cors.php
'allowed_origins' => [
    'http://localhost:5175',
    'http://127.0.0.1:5175',
    'https://accounts.google.com',
    'https://www.googleapis.com',
],
'supports_credentials' => true,
```

### Frontend Google Configuration
```typescript
// frontend/src/config/google.ts
export const GOOGLE_CONFIG = {
  clientId: '731847354740-eoghtim5ple035p4kdb2ukbiia274t8r.apps.googleusercontent.com',
  redirectUri: `${window.location.protocol}//${window.location.host}`,
  scopes: ['openid', 'email', 'profile'],
  ux_mode: 'popup',
  auto_select: false,
};
```

## Testing Steps

### 1. Use the Debug Component
Add the GoogleAuthDebug component to your login page temporarily:

```tsx
import { GoogleAuthDebug } from '../components/ui/GoogleAuthDebug';

// Add this to your Login component for testing
<GoogleAuthDebug />
```

### 2. Check Browser Console
Look for these specific errors:
- CORS errors
- Popup blocked warnings
- FedCM errors
- Network errors

### 3. Verify Google Console Settings
Ensure your Google OAuth client has these settings:
- **Authorized JavaScript origins:** `http://localhost:5175`
- **Authorized redirect URIs:** `http://localhost:5175`

## Common Error Messages and Solutions

### Error: "Server did not send the correct CORS headers"
**Solution:** ✅ Fixed in CORS configuration

### Error: "Failed to open popup window... Maybe blocked by the browser?"
**Solutions:**
1. Allow popups for localhost:5175 in browser settings
2. Try in incognito mode
3. Disable popup blockers temporarily

### Error: "FedCM get() rejects with IdentityCredentialError"
**Solutions:**
1. Disable third-party cookies in browser
2. Try incognito mode
3. Clear browser cache and cookies
4. Use popup method instead of One Tap

### Error: "Google prompt notification: {g: 'skipped', l: 'unknown_reason'}"
**Solutions:**
1. User has previously dismissed Google One Tap
2. Browser doesn't support One Tap
3. Third-party cookies are blocked

## Browser-Specific Issues

### Chrome
- Enable third-party cookies for localhost
- Allow popups for localhost:5175
- Clear site data if issues persist

### Firefox
- Set `dom.security.https_first` to false for localhost
- Allow popups for localhost:5175

### Safari
- Enable "Prevent cross-site tracking" exceptions for localhost
- Allow popups

## Development Environment Setup

### 1. Start Backend Server
```bash
cd backend/wesaltech
php artisan serve --host=0.0.0.0 --port=8000
```

### 2. Start Frontend Server
```bash
cd frontend
npm run dev
# Should run on http://localhost:5175
```

### 3. Verify Environment Variables
```bash
# frontend/.env.local
VITE_API_URL=http://localhost:8000/api
VITE_APP_ENV=local
VITE_APP_DEBUG=true
```

## Testing Checklist

- [ ] Backend server running on port 8000
- [ ] Frontend server running on port 5175
- [ ] CORS configuration updated
- [ ] Google OAuth client configured with correct origins
- [ ] Popup blockers disabled
- [ ] Third-party cookies enabled (or try incognito)
- [ ] Browser console clear of CORS errors
- [ ] Network tab shows successful API calls

## Advanced Debugging

### 1. Check Network Requests
In browser DevTools > Network tab, look for:
- `/api/auth/google` requests
- Response status codes
- CORS preflight requests

### 2. Check Backend Logs
```bash
cd backend/wesaltech
tail -f storage/logs/laravel.log
```

### 3. Test Backend Endpoint Directly
```bash
curl -X POST http://localhost:8000/api/test-google \
  -H "Content-Type: application/json" \
  -d '{
    "google_id": "test_123",
    "email": "test@example.com", 
    "name": "Test User"
  }'
```

## If Issues Persist

1. **Clear all browser data** for localhost
2. **Restart both servers**
3. **Try a different browser**
4. **Check Google Console quotas and limits**
5. **Verify API keys are not restricted**

## Contact Information

If you continue experiencing issues after following this guide:
1. Check the browser console for specific error messages
2. Use the GoogleAuthDebug component to get detailed logs
3. Verify all configuration steps have been completed

## Recent Changes Made

1. ✅ Updated CORS configuration with proper origins
2. ✅ Enhanced Google Auth service with better error handling
3. ✅ Added popup blocker detection
4. ✅ Improved fallback mechanisms
5. ✅ Created debug component for testing
6. ✅ Fixed redirect URI configuration

The authentication should now work properly. Test using the debug component first to identify any remaining issues.