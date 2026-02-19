# Business Owner Permissions & Logo Display Fix

## Summary
Fixed issues where business owners (مالك العمل) couldn't edit business information and logos weren't displaying in the sidebar.

## Issues Fixed

### 1. Business Owner Permission Check
**Problem**: The Settings page and backend controller were checking `user.role === 'business_owner'` but the system uses Spatie roles stored in a `roles` array.

**Solution**:
- Updated `SettingsController.php` to use `$user->hasRole('business_owner')` instead of checking `$user->role`
- Updated `Settings.tsx` to check both `user?.roles?.some((r: any) => r.name === 'business_owner')` and fallback to `user?.role === 'business_owner'`
- All form fields now properly enable/disable based on the correct role check

### 2. Logo Display in Sidebar
**Problem**: Business logos weren't showing in the sidebar after upload during onboarding.

**Solution**:
- Added `refreshUser()` method to `auth.ts` service to fetch updated user data from `/auth/me` endpoint
- Updated `BusinessSetupStep.tsx` to call `authService.refreshUser()` after successful logo upload
- Fixed logo URL handling in both `TenantLayout.tsx` and `TechnicianLayout.tsx` to support both `logo_url` and `logo` fields
- Logo now displays correctly for both tenant and technician layouts

### 3. POS Cart RTL Support
**Problem**: The POS page had hardcoded `dir="ltr"` preventing proper RTL layout in Arabic.

**Solution**:
- Changed main container from `dir="ltr"` to `dir={isRTL ? 'rtl' : 'ltr'}`
- Fixed cart border to appear on correct side: `${isRTL ? 'border-r' : 'border-l'}`
- Cart now properly appears on the left side in Arabic (RTL mode)

## Files Modified

### Backend
1. `app/Http/Controllers/Business/SettingsController.php`
   - Changed role check from `$user->role !== 'business_owner'` to `!$user->hasRole('business_owner')`

### Frontend
1. `services/auth.ts`
   - Added `refreshUser()` method to fetch and update user data from API

2. `pages/business/Settings.tsx`
   - Added `isBusinessOwner` constant that checks both role formats
   - Updated all form field `disabled` props to use `!isBusinessOwner`
   - Updated conditional rendering for save button and warning message

3. `pages/onboarding/BusinessSetupStep.tsx`
   - Added `authService.refreshUser()` call after successful business setup
   - Ensures user data is updated with new logo information

4. `components/Layout/TenantLayout.tsx`
   - Updated logo URL handling to support both `logo_url` and `logo` fields
   - Sidebar already has proper RTL support with `side={isRTL ? "right" : "left"}`

5. `components/Layout/TechnicianLayout.tsx`
   - Updated logo URL handling to support both `logo_url` and `logo` fields
   - Sidebar already has proper RTL support with `side={isRTL ? "right" : "left"}`

6. `pages/business/POS.tsx`
   - Changed main container `dir` from hardcoded `"ltr"` to `{isRTL ? 'rtl' : 'ltr'}`
   - Fixed cart border positioning for RTL

## Testing Checklist
- [x] Business owner can edit business information in Settings
- [x] Non-business-owner users see read-only fields with warning
- [x] Logo displays in sidebar after onboarding upload
- [x] Logo displays for both tenant and technician layouts
- [x] POS cart appears on correct side in Arabic (left side in RTL)
- [x] Sidebar appears on right side in Arabic
- [x] Sidebar toggle button works correctly in both LTR and RTL

## Notes
- The sidebar in TenantLayout and TechnicianLayout already has `side={isRTL ? "right" : "left"}` which makes it RTL-compatible
- The `SidebarProvider` has `key={isRTL ? 'rtl' : 'ltr'}` to force re-render when language changes
- Users may need to refresh the page after changing language for the sidebar to switch sides
- The logo refresh happens automatically after onboarding, so new users will see their logo immediately
