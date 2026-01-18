# Single-Database Multi-Tenant Architecture

## Overview

This system uses **row-level tenant isolation** within a single database, which is much more efficient and practical than database-per-tenant approaches.

## How Tenant Isolation Works

### 1. **Single Database with Tenant ID Column**
- All tenant-specific data includes a `tenant_id` foreign key
- Users belong to a specific tenant via `users.tenant_id`
- Data models automatically scope queries to the current user's tenant

### 2. **Automatic Tenant Scoping**
Using the `BelongsToTenant` trait, models automatically:
- Filter queries to only show data for the current user's tenant
- Set `tenant_id` when creating new records
- Prevent cross-tenant data access

### 3. **Example Models with Tenant Isolation**

```php
// Posts are automatically scoped to the current user's tenant
$posts = Post::all(); // Only returns posts for current tenant

// Creating a post automatically sets tenant_id
$post = Post::create([
    'title' => 'My Post',
    'content' => 'Content here'
    // tenant_id is set automatically
]);
```

## Database Structure

### Core Tables
- `tenants` - Tenant organizations
- `users` - Users belong to tenants via `tenant_id`
- `plans` - Subscription plans
- `subscriptions` - Tenant subscriptions

### Tenant-Scoped Data Tables
- `posts` - Blog posts scoped by `tenant_id`
- `projects` - Projects scoped by `tenant_id`
- Any other business data with `tenant_id`

## Benefits of This Approach

### ✅ **Advantages**
1. **Simple & Efficient**: Single database, easy to manage
2. **Cost Effective**: No need for multiple databases
3. **Easy Backups**: One database to backup
4. **Cross-tenant Analytics**: Can analyze data across tenants
5. **Resource Sharing**: Efficient use of database resources
6. **Easy Scaling**: Standard database scaling techniques apply

### ❌ **Previous Database-per-Tenant Issues**
1. **Complex Management**: Multiple databases to maintain
2. **Resource Intensive**: Each tenant needs separate DB resources
3. **Backup Complexity**: Multiple databases to backup
4. **Migration Challenges**: Schema changes across all tenant DBs
5. **Cost**: Higher infrastructure costs

## Security & Isolation

### Row-Level Security
- Global scopes ensure users only see their tenant's data
- Middleware validates tenant access
- Super admins can access all data when needed

### Example Usage

```php
// Tenant user sees only their data
auth()->user()->tenant_id = 1;
$posts = Post::all(); // Only tenant 1 posts

// Super admin can see all data
$allPosts = Post::withoutTenantScope()->get();
```

## API Endpoints

### Tenant-Scoped Endpoints
- `GET /api/tenant/posts` - Posts for current tenant
- `GET /api/tenant/projects` - Projects for current tenant
- `GET /api/tenant/users` - Users in current tenant
- `GET /api/tenant/stats` - Tenant statistics

### Admin Endpoints (Super Admin Only)
- `GET /api/admin/tenants` - Manage all tenants
- `GET /api/admin/dashboard` - System-wide analytics

## Sample Data

The system includes sample tenants:
1. **Acme Corporation** (Professional Plan)
2. **TechStart Inc** (Starter Plan)  
3. **Enterprise Solutions** (Enterprise Plan)

Each tenant has:
- Admin user and regular users
- Sample posts and projects
- Isolated data that doesn't cross tenant boundaries

## Testing Tenant Isolation

1. Login as a tenant user
2. Create posts/projects - they're automatically scoped
3. Switch to different tenant - data is completely isolated
4. Super admin can see all data across tenants

This approach provides excellent tenant isolation while maintaining simplicity and efficiency!