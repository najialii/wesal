# Google OAuth Configuration Guide

## Current Configuration
- **Client ID**: `731847354740-eoghtim5ple035p4kdb2ukbiia274t8r.apps.googleusercontent.com`
- **Current Origin**: `http://localhost:5175`

## Required Steps to Fix Google Login

### 1. Go to Google Cloud Console
Visit: https://console.cloud.google.com/apis/credentials

### 2. Select Your Project
Find the project associated with the Client ID above.

### 3. Edit OAuth 2.0 Client ID
Click on the OAuth 2.0 Client ID: `731847354740-eoghtim5ple035p4kdb2ukbiia274t8r`

### 4. Add Authorized JavaScript Origins
Add these origins to the "Authorized JavaScript origins" section:

```
http://localhost:5175
http://127.0.0.1:5175
http://localhost:8000
http://127.0.0.1:8000
```

### 5. Add Authorized Redirect URIs
Add these URIs to the "Authorized redirect URIs" section:

```
http://localhost:5175
http://localhost:5175/
http://localhost:5175/login
http://127.0.0.1:5175
http://127.0.0.1:5175/
http://127.0.0.1:5175/login
```

### 6. Save Changes
Click "Save" at the bottom of the page.

### 7. Wait for Propagation
Changes may take 5-10 minutes to propagate. Clear your browser cache after waiting.

## Testing Google Login

After updating the origins:

1. Clear browser cache (Ctrl+Shift+Delete)
2. Refresh the login page (Ctrl+Shift+R for hard refresh)
3. Try Google login again

## Common Issues

### "redirect_uri_mismatch" Error
- Make sure all the URIs above are added
- Check for typos (http vs https, trailing slashes)
- Wait 5-10 minutes for changes to propagate

### "popup_closed_by_user" Error
- Check if popup blockers are enabled
- Try allowing popups for localhost

### "idpiframe_initialization_failed" Error
- Clear browser cookies
- Try in incognito/private mode
- Disable third-party cookie blocking

## Alternative: Create New OAuth Client

If you don't have access to the existing client, create a new one:

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click "Create Credentials" → "OAuth client ID"
3. Choose "Web application"
4. Add the origins and redirect URIs listed above
5. Copy the new Client ID
6. Update `frontend/src/config/google.ts` with the new Client ID

## Current Client ID Location
File: `frontend/src/config/google.ts`
Line: 2

```typescript
export const GOOGLE_CONFIG = {
  clientId: 'YOUR_NEW_CLIENT_ID_HERE',
  // ... rest of config
};
```
