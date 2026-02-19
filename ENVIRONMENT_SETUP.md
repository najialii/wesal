# Environment Configuration Guide

This project supports easy switching between local development and production environments.

## Quick Start

### Windows Users
```bash
# Switch to local development
switch-env.bat local

# Switch to production
switch-env.bat production
```

### Linux/Mac Users
```bash
# Make script executable (first time only)
chmod +x switch-env.sh

# Switch to local development
./switch-env.sh local

# Switch to production
./switch-env.sh production
```

## What Gets Switched

When you run the environment switcher, it updates:

1. **Frontend Configuration**
   - `frontend/.env` - Environment variables for Vite
   - `frontend/src/config/environment.ts` - TypeScript configuration

2. **Backend Configuration**
   - `backend/wesaltech/.env` - Laravel environment variables

## Environment Files

### Frontend
- `frontend/.env.local` - Local development settings
- `frontend/.env.production` - Production settings
- `frontend/.env` - Current active environment (auto-generated)

### Backend
- `backend/wesaltech/.env.local` - Local Laravel settings
- `backend/wesaltech/.env.production` - Production Laravel settings
- `backend/wesaltech/.env` - Current active environment (auto-generated)

### TypeScript Config
- `frontend/src/config/environment.ts` - Centralized configuration

## Configuration Details

### Local Environment
- **Frontend URL**: `http://localhost:8000/api`
- **Backend URL**: `http://localhost:8000`
- **Database**: `wesaltech_local`
- **Debug Mode**: Enabled
- **Mail**: Log driver (emails saved to logs)

### Production Environment
- **Frontend URL**: `https://wesaaltech.com/api`
- **Backend URL**: `https://wesaaltech.com`
- **Database**: `wesaltech_production`
- **Debug Mode**: Disabled
- **Mail**: SMTP driver (real emails)

## Manual Configuration

If you prefer to switch manually, you can:

1. **Edit TypeScript Config**:
   ```typescript
   // In frontend/src/config/environment.ts
   
   // For Local:
   export const config = localConfig;
   
   // For Production:
   export const config = productionConfig;
   ```

2. **Copy Environment Files**:
   ```bash
   # For Local
   cp frontend/.env.local frontend/.env
   cp backend/wesaltech/.env.local backend/wesaltech/.env
   
   # For Production
   cp frontend/.env.production frontend/.env
   cp backend/wesaltech/.env.production backend/wesaltech/.env
   ```

## Important Notes

1. **Never commit `.env` files** - They are auto-generated
2. **Update credentials** in `.env.production` before deploying
3. **Restart servers** after switching environments
4. **Clear cache** when switching to production

## Customizing Environments

### Adding New Environment Variables

1. Add to both `.env.local` and `.env.production`
2. Update `frontend/src/config/environment.ts` if needed
3. Use in your code via the config object

### Example Usage in Code

```typescript
import { API_URL, IS_PRODUCTION, DEBUG_MODE } from '@/config/environment';

// Use the configured API URL
const response = await fetch(`${API_URL}/users`);

// Conditional behavior
if (DEBUG_MODE) {
  console.log('Debug info:', response);
}

// Environment-specific features
if (IS_PRODUCTION) {
  // Production-only code
} else {
  // Development-only code
}
```

## Troubleshooting

### Script Not Working?
- **Windows**: Make sure PowerShell execution policy allows scripts
- **Linux/Mac**: Make sure script is executable (`chmod +x switch-env.sh`)

### Environment Not Switching?
1. Check if `.env.local` and `.env.production` files exist
2. Restart your development servers
3. Clear browser cache
4. Check console for errors

### Database Issues?
- Update database credentials in the respective `.env` files
- Make sure databases exist
- Run migrations after switching

## Security Checklist

- [ ] Production `.env` has secure passwords
- [ ] Debug mode is disabled in production
- [ ] HTTPS is enabled in production
- [ ] Database credentials are secure
- [ ] API keys are production-ready
- [ ] Mail configuration is correct