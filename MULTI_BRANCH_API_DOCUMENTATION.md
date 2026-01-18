# Multi-Branch Management API Documentation

## Overview

The multi-branch management system allows businesses to manage multiple physical locations (branches) within a single tenant. This document describes the API endpoints, authentication requirements, and data scoping rules.

## Authentication

All endpoints require authentication via Bearer token:
```
Authorization: Bearer {token}
```

## Branch Context

The system maintains an "active branch" context for each user session. This context determines which branch's data is displayed and which branch operations are performed on.

### Setting Branch Context

The active branch is determined by:
1. Explicit branch switching via `/api/business/branches/switch`
2. Session storage (persists across requests)
3. User's default branch (first assigned branch)

## Branch Endpoints

### List Branches

**GET** `/api/business/branches`

Returns all branches accessible to the authenticated user.

**Authorization:**
- Owners: See all branches in their tenant
- Staff: See only assigned branches

**Response:**
```json
{
  "branches": [
    {
      "id": 1,
      "tenant_id": 1,
      "name": "Main Branch",
      "code": "MAIN",
      "address": "123 Main St",
      "city": "New York",
      "phone": "+1234567890",
      "email": "main@example.com",
      "is_default": true,
      "is_active": true,
      "users_count": 5,
      "products_count": 150,
      "sales_count": 1250
    }
  ],
  "total": 1
}
```

### Create Branch

**POST** `/api/business/branches`

Creates a new branch (owner only).

**Authorization:** Owner only

**Request Body:**
```json
{
  "name": "Downtown Branch",
  "code": "DT",
  "address": "456 Downtown Ave",
  "city": "New York",
  "phone": "+1234567891",
  "email": "downtown@example.com"
}
```

**Response:** `201 Created`
```json
{
  "message": "Branch created successfully",
  "branch": { /* branch object */ }
}
```

**Error Codes:**
- `403 UNAUTHORIZED`: User is not an owner
- `422 VALIDATION_ERROR`: Invalid input data

### Get Branch Details

**GET** `/api/business/branches/{id}`

Returns detailed information about a specific branch.

**Authorization:** User must have access to the branch

**Response:**
```json
{
  "branch": {
    "id": 1,
    "name": "Main Branch",
    "code": "MAIN",
    "users": [ /* array of users */ ],
    "products": [ /* array of products */ ],
    "users_count": 5,
    "products_count": 150,
    "sales_count": 1250
  }
}
```

**Error Codes:**
- `403 BRANCH_ACCESS_DENIED`: User doesn't have access to this branch
- `404`: Branch not found

### Update Branch

**PUT** `/api/business/branches/{id}`

Updates branch information (owner only).

**Authorization:** Owner only

**Request Body:**
```json
{
  "name": "Updated Branch Name",
  "address": "New Address",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "message": "Branch updated successfully",
  "branch": { /* updated branch object */ }
}
```

**Error Codes:**
- `403 UNAUTHORIZED`: User is not an owner
- `422 VALIDATION_ERROR`: Invalid input data

### Deactivate Branch

**DELETE** `/api/business/branches/{id}`

Deactivates a branch (owner only). Historical data is preserved.

**Authorization:** Owner only

**Response:**
```json
{
  "message": "Branch deactivated successfully"
}
```

**Error Codes:**
- `403 UNAUTHORIZED`: User is not an owner
- `400 CANNOT_DEACTIVATE_DEFAULT`: Cannot deactivate the default branch

## Branch Context Endpoints

### Get Current Branch

**GET** `/api/business/branches/current`

Returns the user's currently active branch.

**Response:**
```json
{
  "id": 1,
  "name": "Main Branch",
  "code": "MAIN",
  "is_default": true,
  "is_active": true
}
```

### Switch Branch

**POST** `/api/business/branches/switch`

Switches the user's active branch context.

**Request Body:**
```json
{
  "branch_id": 2
}
```

**Response:**
```json
{
  "message": "Branch switched successfully",
  "branch": { /* new active branch */ }
}
```

**Error Codes:**
- `403 BRANCH_ACCESS_DENIED`: User doesn't have access to the requested branch
- `404`: Branch not found or inactive

### Get User's Branches

**GET** `/api/business/branches/my-branches`

Returns all branches assigned to the authenticated user.

**Response:**
```json
[
  {
    "id": 1,
    "name": "Main Branch",
    "code": "MAIN",
    "is_manager": true
  },
  {
    "id": 2,
    "name": "Downtown Branch",
    "code": "DT",
    "is_manager": false
  }
]
```

## Staff Branch Assignment Endpoints

### Get Staff Branches

**GET** `/api/business/staff/{id}/branches`

Returns branches assigned to a staff member.

**Response:**
```json
{
  "branches": [
    {
      "id": 1,
      "name": "Main Branch",
      "code": "MAIN",
      "is_manager": true
    }
  ]
}
```

### Assign Staff to Branches

**POST** `/api/business/staff/{id}/branches`

Assigns a staff member to one or more branches.

**Request Body:**
```json
{
  "branches": [
    {
      "branch_id": 1,
      "is_manager": true
    },
    {
      "branch_id": 2,
      "is_manager": false
    }
  ]
}
```

**Response:**
```json
{
  "message": "Staff assigned to branches successfully"
}
```

### Remove Staff from Branch

**DELETE** `/api/business/staff/{id}/branches/{branchId}`

Removes a staff member's assignment from a specific branch.

**Response:**
```json
{
  "message": "Staff removed from branch successfully"
}
```

## Stock Transfer Endpoints

### List Stock Transfers

**GET** `/api/business/stock-transfers`

Returns stock transfers filtered by user's branch access.

**Query Parameters:**
- `status`: Filter by status (pending, in_transit, completed, cancelled)
- `from_branch_id`: Filter by source branch
- `to_branch_id`: Filter by destination branch

**Response:**
```json
{
  "transfers": [
    {
      "id": 1,
      "product": { /* product details */ },
      "from_branch": { /* branch details */ },
      "to_branch": { /* branch details */ },
      "quantity": 50,
      "status": "pending",
      "initiated_by": { /* user details */ },
      "created_at": "2026-01-16T10:00:00Z"
    }
  ]
}
```

### Initiate Stock Transfer

**POST** `/api/business/stock-transfers`

Initiates a new stock transfer between branches.

**Request Body:**
```json
{
  "product_id": 1,
  "from_branch_id": 1,
  "to_branch_id": 2,
  "quantity": 50,
  "notes": "Restocking downtown branch"
}
```

**Response:** `201 Created`
```json
{
  "message": "Stock transfer initiated successfully",
  "transfer": { /* transfer object */ }
}
```

**Error Codes:**
- `400 INSUFFICIENT_STOCK`: Not enough stock in source branch
- `403 BRANCH_ACCESS_DENIED`: User doesn't have access to one or both branches

### Complete Stock Transfer

**POST** `/api/business/stock-transfers/{id}/complete`

Marks a transfer as completed and updates stock levels.

**Response:**
```json
{
  "message": "Stock transfer completed successfully",
  "transfer": { /* updated transfer object */ }
}
```

### Cancel Stock Transfer

**POST** `/api/business/stock-transfers/{id}/cancel`

Cancels a pending stock transfer.

**Request Body:**
```json
{
  "reason": "No longer needed"
}
```

**Response:**
```json
{
  "message": "Stock transfer cancelled successfully"
}
```

## Branch Analytics Endpoints

### Get Branch Metrics

**GET** `/api/business/analytics/branch/{id}`

Returns analytics for a specific branch.

**Query Parameters:**
- `start_date`: Start date (YYYY-MM-DD)
- `end_date`: End date (YYYY-MM-DD)

**Response:**
```json
{
  "branch": { /* branch details */ },
  "period": {
    "start": "2026-01-01",
    "end": "2026-01-31"
  },
  "sales": {
    "total_revenue": 125000.00,
    "total_sales": 450,
    "average_sale_value": 277.78
  },
  "inventory": {
    "total_products": 150,
    "low_stock_products": 12,
    "total_stock_value": 75000.00
  },
  "maintenance": {
    "active_contracts": 25,
    "completed_visits": 18
  },
  "staff": {
    "total_staff": 5
  }
}
```

### Compare Branches

**GET** `/api/business/analytics/compare`

Compares metrics across multiple branches (owner only).

**Query Parameters:**
- `branch_ids[]`: Array of branch IDs to compare
- `start_date`: Start date
- `end_date`: End date

**Response:**
```json
{
  "branches": [
    {
      "branch_id": 1,
      "name": "Main Branch",
      "metrics": { /* branch metrics */ }
    },
    {
      "branch_id": 2,
      "name": "Downtown Branch",
      "metrics": { /* branch metrics */ }
    }
  ]
}
```

### Get Consolidated Metrics

**GET** `/api/business/analytics/consolidated`

Returns aggregated metrics across all branches (owner only).

**Authorization:** Owner only

**Query Parameters:**
- `start_date`: Start date
- `end_date`: End date

**Response:**
```json
{
  "period": {
    "start": "2026-01-01",
    "end": "2026-01-31"
  },
  "totals": {
    "total_revenue": 350000.00,
    "total_sales": 1250,
    "total_branches": 3
  },
  "by_branch": [
    {
      "branch_id": 1,
      "name": "Main Branch",
      "revenue": 150000.00,
      "sales": 550
    }
  ]
}
```

## Data Scoping Rules

### Branch-Scoped Entities

The following entities are scoped to branches:
- **Sales**: Each sale belongs to one branch
- **Maintenance Contracts**: Each contract belongs to one branch
- **Maintenance Visits**: Each visit belongs to one branch
- **Stock Movements**: Each movement belongs to one branch
- **Products**: Products can be assigned to multiple branches with different stock levels

### Tenant-Scoped Entities

The following entities remain tenant-wide:
- **Customers**: Shared across all branches
- **Categories**: Shared across all branches
- **Users**: Can be assigned to multiple branches

### Access Control

**Owners:**
- Can access all branches in their tenant
- Can view consolidated analytics
- Can create, update, and deactivate branches
- Can assign staff to branches

**Managers:**
- Can access assigned branches
- Can view branch-specific analytics
- Can manage operations within assigned branches

**Staff:**
- Can access assigned branches
- Can only view data from their active branch
- Cannot switch to unassigned branches

## Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | User doesn't have permission for this operation |
| `BRANCH_ACCESS_DENIED` | User doesn't have access to the requested branch |
| `VALIDATION_ERROR` | Request validation failed |
| `INSUFFICIENT_STOCK` | Not enough stock for the operation |
| `INACTIVE_BRANCH` | Operation not allowed on inactive branch |
| `CANNOT_DEACTIVATE_DEFAULT` | Cannot deactivate the default branch |
| `TENANT_ISOLATION_VIOLATION` | Attempted cross-tenant operation |

## Caching

The API implements caching for performance:
- User's assigned branches: 1 hour TTL
- Branch list per tenant: 30 minutes TTL
- Dashboard metrics: 5 minutes TTL

Cache is automatically invalidated when:
- Branches are created, updated, or deactivated
- Staff assignments change
- User switches branches

## Rate Limiting

Standard rate limits apply:
- 60 requests per minute for authenticated users
- 10 requests per minute for unauthenticated users
