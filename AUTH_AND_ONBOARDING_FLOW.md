# Authentication & Onboarding Flow

## Overview
The WesalTech app has a multi-role authentication system with conditional onboarding for business owners.

## User Roles

### 1. Super Admin (`is_super_admin: true`)
- **Access:** Admin panel at `/admin`
- **Credentials:** `admin@wesaltech.com` / `11235813nJ`
- **Permissions:** Full system access, manage all tenants
- **Onboarding:** Not required

### 2. Business Owner (`business_owner` role)
- **Access:** Business dashboard at `/business`
- **Permissions:** Full access to their tenant, can manage branches, staff, all business operations
- **Onboarding:** **REQUIRED** on first login
- **Example:** `admin@acme.com` / `password`

### 3. Tenant Admin (`tenant_admin` role)
- **Access:** Business dashboard at `/business`
- **Permissions:** Similar to business owner, can manage most business operations
- **Onboarding:** **REQUIRED** if flagged
- **Example:** `admin@riyadh-tech.com` / `password`

### 4. Business Admin (`business_admin` role)
- **Access:** Business dashboard at `/business`
- **Permissions:** Can manage staff and operations
- **Onboarding:** Not required

### 5. Manager (`manager` role)
- **Access:** Business dashboard at `/business`
- **Permissions:** Can view and manage operations, limited admin access
- **Onboarding:** Not required
- **Example:** `manager@acme.com` / `password`

### 6. Salesman/Employee (`salesman`, `employee` roles)
- **Access:** Business dashboard at `/business`
- **Permissions:** Limited to POS, sales, and assigned tasks
- **Onboarding:** Not required
- **Example:** `sales1@acme.com` / `password`

### 7. Technician (`technician` role)
- **Access:** Technician dashboard at `/technician`
- **Permissions:** Manage maintenance visits, parts inventory
- **Onboarding:** Not required

## Authentication Flow

### 1. Login Process
```
User enters credentials
    ↓
POST /api/auth/login
    ↓
Backend validates credentials
    ↓
Returns: { user, token, branch_context }
    ↓
Frontend stores token & user in localStorage
    ↓
Route based on user type
```

### 2. Routing Logic (Login.tsx)
```typescript
if (user.is_super_admin) {
    → navigate('/admin')
} else if (isTechnician) {
    → navigate('/technician')
} else if (isBusinessOwner && !user.onboarding_completed) {
    → navigate('/onboarding')  // ⚠️ Onboarding required
} else {
    → navigate('/business')
}
```

## Onboarding Flow

### Who Goes Through Onboarding?
- **Business Owners** with `onboarding_completed: false`
- **Tenant Admins** with `onboarding_completed: false`

### Who Skips Onboarding?
- Super Admins
- Staff members (managers, salesmen, employees)
- Technicians
- Users with `onboarding_completed: true`

### Onboarding Steps
The onboarding process guides new business owners through:

1. **Welcome Screen**
   - Introduction to the platform
   - Overview of features

2. **Business Information**
   - Company details
   - Tax information
   - Contact details

3. **Branch Setup**
   - Create first branch
   - Set branch details

4. **Product Categories**
   - Set up product categories
   - Configure inventory structure

5. **Completion**
   - Mark `onboarding_completed: true`
   - Redirect to dashboard

### Onboarding Protection (App.tsx)
```typescript
function BusinessRoute({ children }) {
  const user = authService.getCurrentUser();
  
  // Check if business owner needs onboarding
  if (isBusinessOwner && user.onboarding_completed === false) {
    return <Navigate to="/onboarding" replace />;
  }
  
  return <>{children}</>;
}
```

## Protected Routes

### Super Admin Routes (`/admin/*`)
- **Protection:** `SuperAdminRoute` component
- **Check:** `is_super_admin === true`
- **Redirect:** Non-admins → `/business`

### Business Routes (`/business/*`)
- **Protection:** `BusinessRoute` component
- **Checks:**
  1. User is authenticated
  2. User has `tenant_id`
  3. Not a super admin
  4. Onboarding completed (if business owner)
- **Redirect:** 
  - Not authenticated → `/login`
  - No tenant → Access Denied page
  - Onboarding needed → `/onboarding`

### Role-Specific Routes
Some routes have additional role restrictions:

```typescript
// Staff Management - Only owners and admins
<Route path="staff" element={
  <RoleRoute allowedRoles={['business_owner', 'business_admin']}>
    <Staff />
  </RoleRoute>
} />

// Branches - Only owners
<Route path="branches" element={
  <RoleRoute allowedRoles={['business_owner', 'tenant_admin', 'business_admin']}>
    <Branches />
  </RoleRoute>
} />
```

### Technician Routes (`/technician/*`)
- **Protection:** `TechnicianRoute` component
- **Check:** User has `technician` role
- **Redirect:** Non-technicians → `/business`

## Branch Context

### Multi-Branch Support
Business owners with multiple branches can:
- Switch between branches using `BranchSelector`
- View branch-specific data
- Manage branch inventory separately

### Branch Assignment
- **Owners/Admins:** See all branches
- **Staff:** See only assigned branches
- **Default Branch:** Auto-selected on login

## Session Management

### Token Storage
- **Location:** `localStorage`
- **Keys:**
  - `auth_token` - JWT token
  - `user` - User object with roles

### Token Expiry
- **Duration:** 24 hours
- **Refresh:** Manual re-login required
- **Auto-logout:** On 401 response

### Logout Flow
```
User clicks logout
    ↓
POST /api/auth/logout (revoke token)
    ↓
Clear localStorage
    ↓
Redirect to /login
```

## Database Fields

### Users Table
```sql
- is_super_admin: boolean (for super admins)
- tenant_id: foreign key (null for super admins)
- onboarding_completed: boolean (default: false)
- onboarding_step: integer (tracks progress)
- language_preference: string (en/ar)
```

### Roles (via Spatie Permission)
- Stored in `model_has_roles` pivot table
- Multiple roles per user supported
- Role names: `system_admin`, `business_owner`, `tenant_admin`, `business_admin`, `manager`, `employee`, `salesman`, `technician`

## Testing Accounts

### Super Admin
```
Email: admin@wesaltech.com
Password: 11235813nJ
Access: /admin
```

### Business Owners (Onboarding Required)
```
Acme Corp:
  Email: admin@acme.com
  Password: password
  Access: /business (after onboarding)

TechStart:
  Email: admin@techstart.com
  Password: password
  
Enterprise:
  Email: admin@enterprise.com
  Password: password
```

### Tenant Admins
```
Arabic Business:
  Email: admin@riyadh-tech.com
  Password: password
  Role: tenant_admin
  Access: /business
```

### Managers
```
Email: manager@acme.com
Password: password
Access: /business (no onboarding)
```

### Sales Staff
```
Email: sales1@acme.com
Password: password
Access: /business (limited permissions)
```

## Common Issues

### Issue: Stuck in Onboarding Loop
**Cause:** `onboarding_completed` is false
**Fix:** Update database:
```sql
UPDATE users SET onboarding_completed = true WHERE email = 'user@example.com';
```

### Issue: Can't Access Branches Menu
**Cause:** User doesn't have required role
**Fix:** User needs `business_owner`, `tenant_admin`, or `business_admin` role

### Issue: Redirected to Wrong Dashboard
**Cause:** Role check logic mismatch
**Fix:** Check user.roles array and user.role field

### Issue: 401 Unauthorized
**Cause:** Token expired or invalid
**Fix:** Re-login to get new token

## Security Notes

1. **Token Security:** Tokens stored in localStorage (consider httpOnly cookies for production)
2. **Role Verification:** Both frontend and backend verify roles
3. **CORS:** Configured to accept localhost for development
4. **Password Hashing:** Using bcrypt via Laravel Hash
5. **SQL Injection:** Protected via Laravel ORM
6. **XSS Protection:** React escapes output by default

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register new business
- `POST /api/auth/logout` - Logout
- `POST /api/auth/google` - Google OAuth
- `GET /api/auth/me` - Get current user

### User Management
- `GET /api/business/staff` - List staff
- `POST /api/business/staff` - Create staff
- `PUT /api/business/staff/{id}` - Update staff
- `DELETE /api/business/staff/{id}` - Delete staff

### Branch Management
- `GET /api/business/branches` - List branches
- `POST /api/business/branches` - Create branch
- `POST /api/business/branches/switch` - Switch current branch
