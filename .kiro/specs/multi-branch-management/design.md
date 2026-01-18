# Multi-Branch Management System - Design Document

## Overview

This design document outlines the architecture for implementing a multi-branch management system within the existing Laravel-based multi-tenant business management platform. The system will enable business owners (tenants) to operate multiple physical store locations (branches) while maintaining centralized oversight and proper data isolation.

The design follows Laravel best practices and integrates seamlessly with the existing tenant-scoped architecture, extending it with an additional branch-scoping layer. Each branch operates as an independent unit with its own inventory, sales, and staff, while customers and categories remain shared at the tenant level.

## Architecture

### High-Level Architecture

The multi-branch system introduces a new hierarchical data model:

```
Super Admin (Platform Level)
└── Tenants (Business Organizations)
    ├── Branches (Physical Locations)
    │   ├── Branch-Scoped Data
    │   │   ├── Products (with branch-specific stock)
    │   │   ├── Sales
    │   │   ├── Maintenance Contracts
    │   │   ├── Maintenance Visits
    │   │   ├── Stock Movements
    │   │   └── Staff Assignments
    │   └── Shared Data (Tenant Level)
    │       ├── Customers
    │       ├── Categories
    │       └── Users (with branch assignments)
```

### Data Scoping Strategy

1. **Tenant-Level Scoping** (Existing): Enforced via `BelongsToTenant` trait
2. **Branch-Level Scoping** (New): Enforced via new `BelongsToBranch` trait
3. **Dual Scoping**: Most operational data will have both `tenant_id` and `branch_id`
4. **Shared Data**: Customers and categories remain tenant-scoped only

### Branch Context Management

The system will maintain branch context through:
- User's assigned branches (stored in pivot table)
- Active branch selection (stored in session/token)
- Automatic branch scoping in queries
- Branch switching capability for multi-branch users

## Components and Interfaces

### 1. Branch Model

**File**: `app/Models/Branch.php`

```php
class Branch extends Model
{
    protected $fillable = [
        'tenant_id',
        'name',
        'code',
        'address',
        'city',
        'phone',
        'email',
        'is_default',
        'is_active',
        'settings'
    ];
    
    // Relationships
    public function tenant(): BelongsTo
    public function users(): BelongsToMany
    public function products(): BelongsToMany
    public function sales(): HasMany
    public function maintenanceContracts(): HasMany
    public function stockMovements(): HasMany
}
```

### 2. BelongsToBranch Trait

**File**: `app/Traits/BelongsToBranch.php`

Provides automatic branch scoping similar to `BelongsToTenant`:

```php
trait BelongsToBranch
{
    protected static function bootBelongsToBranch()
    {
        // Auto-scope queries to current branch
        static::addGlobalScope('branch', function (Builder $builder) {
            if ($branchId = self::getCurrentBranchId()) {
                $builder->where('branch_id', $branchId);
            }
        });
        
        // Auto-set branch_id on creation
        static::creating(function ($model) {
            if (!isset($model->branch_id)) {
                $model->branch_id = self::getCurrentBranchId();
            }
        });
    }
    
    public function branch(): BelongsTo
    public function scopeForBranch(Builder $query, $branchId): Builder
    public function scopeWithoutBranchScope(Builder $query): Builder
    protected static function getCurrentBranchId(): ?int
}
```

### 3. Branch Context Service

**File**: `app/Services/BranchContextService.php`

Manages the current branch context for authenticated users:

```php
class BranchContextService
{
    public function setCurrentBranch(User $user, int $branchId): void
    public function getCurrentBranch(User $user): ?Branch
    public function getUserBranches(User $user): Collection
    public function canAccessBranch(User $user, int $branchId): bool
    public function switchBranch(User $user, int $branchId): bool
}
```

### 4. Branch Middleware

**File**: `app/Http/Middleware/EnsureBranchAccess.php`

Validates branch access and sets branch context:

```php
class EnsureBranchAccess
{
    public function handle(Request $request, Closure $next)
    {
        // Verify user has access to requested branch
        // Set branch context in session/token
        // Allow business owners to access all branches
    }
}
```

### 5. Modified Models

#### Product Model Extensions

```php
// Add branch relationship
public function branches(): BelongsToMany
{
    return $this->belongsToMany(Branch::class, 'branch_product')
                ->withPivot('stock_quantity', 'min_stock_level', 'selling_price')
                ->withTimestamps();
}

// Branch-specific stock methods
public function getStockForBranch(int $branchId): int
public function updateStockForBranch(int $branchId, int $quantity): void
public function transferStock(int $fromBranchId, int $toBranchId, int $quantity): void
```

#### User Model Extensions

```php
// Add branch assignments
public function branches(): BelongsToMany
{
    return $this->belongsToMany(Branch::class, 'branch_user')
                ->withPivot('is_manager')
                ->withTimestamps();
}

// Branch access methods
public function canAccessBranch(int $branchId): bool
public function isManagerOf(int $branchId): bool
public function getDefaultBranch(): ?Branch
```

#### Sale Model Extensions

```php
// Add branch relationship
use BelongsToBranch;

public function branch(): BelongsTo
{
    return $this->belongsTo(Branch::class);
}
```

### 6. Stock Transfer System

**File**: `app/Services/StockTransferService.php`

```php
class StockTransferService
{
    public function initiateTransfer(
        int $productId,
        int $fromBranchId,
        int $toBranchId,
        int $quantity,
        ?string $notes = null
    ): StockTransfer
    
    public function completeTransfer(int $transferId): void
    public function cancelTransfer(int $transferId): void
    public function validateTransfer(int $productId, int $fromBranchId, int $quantity): bool
}
```

### 7. Branch Analytics Service

**File**: `app/Services/BranchAnalyticsService.php`

```php
class BranchAnalyticsService
{
    public function getBranchMetrics(int $branchId, Carbon $startDate, Carbon $endDate): array
    public function compareBranches(array $branchIds, Carbon $startDate, Carbon $endDate): array
    public function getConsolidatedMetrics(int $tenantId, Carbon $startDate, Carbon $endDate): array
}
```

## Data Models

### Database Schema

#### branches Table

```sql
CREATE TABLE branches (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(255),
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    settings JSON,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    UNIQUE KEY unique_tenant_code (tenant_id, code),
    INDEX idx_tenant_active (tenant_id, is_active)
);
```

#### branch_user Table (Pivot)

```sql
CREATE TABLE branch_user (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    branch_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    is_manager BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_branch_user (branch_id, user_id)
);
```

#### branch_product Table (Pivot)

```sql
CREATE TABLE branch_product (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    branch_id BIGINT UNSIGNED NOT NULL,
    product_id BIGINT UNSIGNED NOT NULL,
    stock_quantity INT DEFAULT 0,
    min_stock_level INT DEFAULT 0,
    selling_price DECIMAL(10, 2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_branch_product (branch_id, product_id),
    INDEX idx_low_stock (branch_id, stock_quantity, min_stock_level)
);
```

#### stock_transfers Table

```sql
CREATE TABLE stock_transfers (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT UNSIGNED NOT NULL,
    product_id BIGINT UNSIGNED NOT NULL,
    from_branch_id BIGINT UNSIGNED NOT NULL,
    to_branch_id BIGINT UNSIGNED NOT NULL,
    quantity INT NOT NULL,
    status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
    initiated_by BIGINT UNSIGNED NOT NULL,
    completed_by BIGINT UNSIGNED NULL,
    completed_at TIMESTAMP NULL,
    notes TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (from_branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    FOREIGN KEY (to_branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    FOREIGN KEY (initiated_by) REFERENCES users(id),
    FOREIGN KEY (completed_by) REFERENCES users(id),
    INDEX idx_status (status, created_at)
);
```

#### Modified Existing Tables

Add `branch_id` column to:
- `sales` table
- `maintenance_contracts` table
- `maintenance_visits` table
- `stock_movements` table

```sql
ALTER TABLE sales ADD COLUMN branch_id BIGINT UNSIGNED NOT NULL AFTER tenant_id;
ALTER TABLE sales ADD FOREIGN KEY (branch_id) REFERENCES branches(id);
ALTER TABLE sales ADD INDEX idx_branch_date (branch_id, sale_date);

ALTER TABLE maintenance_contracts ADD COLUMN branch_id BIGINT UNSIGNED NOT NULL AFTER tenant_id;
ALTER TABLE maintenance_contracts ADD FOREIGN KEY (branch_id) REFERENCES branches(id);

ALTER TABLE maintenance_visits ADD COLUMN branch_id BIGINT UNSIGNED NOT NULL AFTER tenant_id;
ALTER TABLE maintenance_visits ADD FOREIGN KEY (branch_id) REFERENCES branches(id);

ALTER TABLE stock_movements ADD COLUMN branch_id BIGINT UNSIGNED NOT NULL AFTER tenant_id;
ALTER TABLE stock_movements ADD FOREIGN KEY (branch_id) REFERENCES branches(id);
```

### Data Migration Strategy

The migration from single-branch to multi-branch must be seamless:

1. **Create default branch** for each existing tenant
2. **Assign all users** to the default branch
3. **Create branch_product records** for all existing products with current stock
4. **Update all sales** to reference the default branch
5. **Update all maintenance contracts** to reference the default branch
6. **Update all stock movements** to reference the default branch

### Access Control Rules

The system enforces strict role-based access control for branches:

**Business Owner (Admin Role)**:
- Full access to all branches within their tenant
- Can create, edit, and deactivate branches
- Can view consolidated reports across all branches
- Can assign staff to any branch
- Can transfer inventory between branches

**Branch Manager**:
- Access only to their assigned branch(es)
- Can view and manage operations within assigned branches
- Can switch between branches if assigned to multiple
- Cannot create new branches or access unassigned branches

**Salesperson**:
- Access only to their assigned branch(es)
- Can process sales only for their assigned branches
- Can view products and customers within branch scope
- Cannot access other branches' data

**Technician**:
- Access only to their assigned branch(es)
- Can view and complete maintenance visits for their assigned branches
- Can access spare parts inventory for their assigned branches
- Cannot access other branches' data

### Branch Context Flow

```
User Login
    ↓
Check User Role
    ↓
├─ Business Owner → Access All Branches → Optional: Select Active Branch
├─ Branch Manager → Load Assigned Branches → Select Active Branch
├─ Salesperson → Load Assigned Branches → Select Active Branch
└─ Technician → Load Assigned Branches → Select Active Branch
    ↓
Set Branch Context in Session/Token
    ↓
All Queries Auto-Scoped to Active Branch (except for owners viewing all)
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Branch Management Properties

Property 1: Default branch creation
*For any* tenant creation, the system should automatically create exactly one default branch
**Validates: Requirements 1.1**

Property 2: Branch creation validation
*For any* branch creation attempt with missing required fields (name, address, contact), the system should reject the creation
**Validates: Requirements 1.2**

Property 3: Branch deactivation preserves history
*For any* branch deactivation, all historical data (sales, contracts, visits) should remain accessible while new transactions are prevented
**Validates: Requirements 1.5**

### Product and Inventory Properties

Property 4: Product requires branch assignment
*For any* product creation attempt without at least one branch assignment, the system should reject the creation
**Validates: Requirements 2.1**

Property 5: Branch stock isolation
*For any* product assigned to multiple branches, stock changes in one branch should not affect stock quantities in other branches
**Validates: Requirements 2.2**

Property 6: Sale deducts correct branch stock
*For any* sale transaction, the system should deduct stock only from the branch where the sale occurred
**Validates: Requirements 2.4**

Property 7: Independent branch pricing
*For any* product in multiple branches, price changes in one branch should not affect prices in other branches
**Validates: Requirements 2.5**

### Staff Access Control Properties

Property 8: Staff requires branch assignment
*For any* staff member creation without at least one branch assignment, the system should reject the creation
**Validates: Requirements 3.1**

Property 9: Staff data access restriction
*For any* staff member (non-owner), all data queries should return only records from their assigned branches
**Validates: Requirements 3.2**

Property 10: Owner has all-branch access
*For any* user with business owner role, the system should grant access to data from all branches within their tenant
**Validates: Requirements 3.5**

Property 11: Branch switching changes scope
*For any* staff member with multiple branch assignments, switching active branch should change the data scope of all subsequent queries
**Validates: Requirements 3.3**

### Sales and Transaction Properties

Property 12: Sales record branch
*For any* sale creation, the system should record a valid branch_id
**Validates: Requirements 4.1**

Property 13: Sales filtering by branch
*For any* sales query with branch filter, the system should return only sales from that specific branch
**Validates: Requirements 4.2**

Property 14: Salesperson uses active branch
*For any* sale created by a salesperson, the system should automatically assign their current active branch
**Validates: Requirements 4.4**

### Customer Management Properties

Property 15: Customers are tenant-wide
*For any* customer creation, the customer should be accessible from all branches within the tenant
**Validates: Requirements 5.1**

Property 16: Customer search is tenant-scoped
*For any* customer search query, the system should return results from all branches within the tenant, not just the active branch
**Validates: Requirements 5.4**

Property 17: Customer profile consistency
*For any* customer with transactions at multiple branches, the customer profile data should remain consistent while transaction history is branch-specific
**Validates: Requirements 5.5**

### Maintenance Properties

Property 18: Maintenance contract requires branch
*For any* maintenance contract creation without a branch assignment, the system should reject the creation
**Validates: Requirements 6.1**

Property 19: Technician sees only assigned branch visits
*For any* technician, the system should display only maintenance visits from their assigned branches
**Validates: Requirements 6.4**

Property 20: Spare parts tracked per branch
*For any* maintenance product (spare part), the system should maintain separate stock quantities for each branch
**Validates: Requirements 6.5**

### Stock Transfer Properties

Property 21: Transfer requires all fields
*For any* stock transfer initiation with missing required fields (source branch, destination branch, product, quantity), the system should reject the transfer
**Validates: Requirements 7.1**

Property 22: Transfer is atomic
*For any* completed stock transfer, the quantity deducted from source branch should equal the quantity added to destination branch
**Validates: Requirements 7.2**

Property 23: Insufficient stock prevents transfer
*For any* stock transfer where quantity exceeds available stock at source branch, the system should reject the transfer
**Validates: Requirements 7.5**

### Dashboard and Reporting Properties

Property 24: Manager dashboard is branch-scoped
*For any* branch manager accessing the dashboard, all displayed metrics should be filtered to their assigned branch only
**Validates: Requirements 8.1**

Property 25: Owner dashboard aggregates all branches
*For any* business owner viewing the dashboard, metrics should be aggregated from all branches within the tenant
**Validates: Requirements 9.1**

Property 26: Inventory totals match branch sum
*For any* owner viewing inventory totals, the total stock should equal the sum of stock across all branches
**Validates: Requirements 9.4**

### Security and Isolation Properties

Property 27: Tenant isolation enforced
*For any* user attempting to access branches from a different tenant, the system should deny access
**Validates: Requirements 10.2**

Property 28: Branch assignments respect tenant boundaries
*For any* branch assignment validation, the system should ensure the user and branch belong to the same tenant
**Validates: Requirements 10.3**

Property 29: Queries include dual scoping
*For any* branch-scoped data query by non-owner users, the system should apply both tenant_id and branch_id filters
**Validates: Requirements 10.4**

### Category Management Properties

Property 30: Categories are tenant-wide
*For any* category creation, the category should be available to all branches within the tenant
**Validates: Requirements 11.1**

Property 31: Category deletion affects all branches
*For any* category deletion, the operation should affect all branches within the tenant
**Validates: Requirements 11.4**

### Migration Properties

Property 32: Migration creates default branches
*For any* existing tenant during migration, the system should create exactly one default branch
**Validates: Requirements 12.1**

Property 33: Migration preserves data integrity
*For any* data migration completion, all foreign key relationships and data constraints should remain valid
**Validates: Requirements 12.5**



## Error Handling

### Validation Errors

**Branch Creation Errors**:
- `BRANCH_NAME_REQUIRED`: Branch name is required
- `BRANCH_CODE_DUPLICATE`: Branch code already exists for this tenant
- `INVALID_TENANT`: Tenant does not exist or is inactive

**Branch Assignment Errors**:
- `USER_NOT_FOUND`: User does not exist
- `BRANCH_NOT_FOUND`: Branch does not exist
- `CROSS_TENANT_ASSIGNMENT`: Cannot assign user to branch from different tenant
- `NO_BRANCH_ACCESS`: User does not have access to the requested branch

**Stock Transfer Errors**:
- `INSUFFICIENT_STOCK`: Not enough stock at source branch
- `SAME_BRANCH_TRANSFER`: Cannot transfer to the same branch
- `INACTIVE_BRANCH`: Cannot transfer to/from inactive branch
- `TRANSFER_NOT_FOUND`: Stock transfer does not exist
- `TRANSFER_ALREADY_COMPLETED`: Transfer has already been completed

**Transaction Errors**:
- `BRANCH_REQUIRED`: Branch must be specified for this operation
- `INACTIVE_BRANCH_TRANSACTION`: Cannot create transactions for inactive branch
- `BRANCH_ACCESS_DENIED`: User does not have access to this branch

### Error Response Format

```json
{
    "success": false,
    "error": {
        "code": "INSUFFICIENT_STOCK",
        "message": "Not enough stock available at the source branch",
        "details": {
            "product_id": 123,
            "branch_id": 5,
            "available": 10,
            "requested": 15
        }
    }
}
```

### Rollback Strategies

**Stock Transfer Rollback**:
- If transfer fails mid-process, restore original stock quantities
- Log failed transfer attempts for audit trail
- Notify initiating user of failure

**Branch Deactivation Rollback**:
- If deactivation fails validation, maintain active status
- Preserve all relationships and assignments
- Log deactivation attempts

## Testing Strategy

### Unit Testing

**Model Tests**:
- Branch model relationships and scopes
- BelongsToBranch trait functionality
- User branch assignment methods
- Product branch stock methods
- Stock transfer validation logic

**Service Tests**:
- BranchContextService branch switching
- StockTransferService transfer operations
- BranchAnalyticsService metric calculations

**Middleware Tests**:
- EnsureBranchAccess authorization logic
- Branch context setting
- Owner bypass logic

### Property-Based Testing

The system will use **Pest PHP** with the **pest-plugin-faker** for property-based testing. Each property-based test will run a minimum of 100 iterations with randomized data.

**Property Test Structure**:
```php
it('validates property X', function () {
    // Generate random test data
    $tenant = Tenant::factory()->create();
    $branches = Branch::factory()->count(rand(2, 5))->create(['tenant_id' => $tenant->id]);
    
    // Test the property
    // Assert the invariant holds
})->repeat(100);
```

**Key Property Tests**:

1. **Branch Stock Isolation** (Property 5)
   - Generate random products assigned to multiple branches
   - Modify stock in one branch
   - Verify other branches' stock unchanged

2. **Staff Access Restriction** (Property 9)
   - Generate random staff with branch assignments
   - Query data as that staff member
   - Verify only assigned branch data returned

3. **Owner All-Branch Access** (Property 10)
   - Generate random owner user
   - Query data from various branches
   - Verify all branches accessible

4. **Transfer Atomicity** (Property 22)
   - Generate random stock transfers
   - Complete transfers
   - Verify source decrease equals destination increase

5. **Tenant Isolation** (Property 27)
   - Generate multiple tenants with branches
   - Attempt cross-tenant branch access
   - Verify access denied

6. **Inventory Aggregation** (Property 26)
   - Generate products across multiple branches
   - Calculate total stock
   - Verify total equals sum of branch stocks

### Integration Testing

**API Endpoint Tests**:
- Branch CRUD operations
- Staff assignment to branches
- Product assignment to branches
- Sales creation with branch context
- Stock transfer workflows
- Dashboard metrics by role

**Authentication Flow Tests**:
- Login with branch selection
- Branch switching during session
- Token refresh with branch context
- Role-based branch access

### Migration Testing

**Data Migration Tests**:
- Verify default branch creation for all tenants
- Verify all products assigned to default branch
- Verify all sales linked to default branch
- Verify all users assigned to default branch
- Verify data integrity after migration

## API Endpoints

### Branch Management

```
GET    /api/business/branches              - List all branches (owner) or assigned branches (staff)
POST   /api/business/branches              - Create new branch (owner only)
GET    /api/business/branches/{id}         - Get branch details
PUT    /api/business/branches/{id}         - Update branch (owner only)
DELETE /api/business/branches/{id}         - Deactivate branch (owner only)
POST   /api/business/branches/{id}/activate - Reactivate branch (owner only)
```

### Branch Context

```
GET    /api/business/branches/current      - Get current active branch
POST   /api/business/branches/switch       - Switch active branch
GET    /api/business/branches/my-branches  - Get user's assigned branches
```

### Staff Branch Assignment

```
GET    /api/business/staff/{id}/branches           - Get staff branch assignments
POST   /api/business/staff/{id}/branches           - Assign staff to branches
DELETE /api/business/staff/{id}/branches/{branchId} - Remove branch assignment
```

### Product Branch Management

```
GET    /api/business/products/{id}/branches        - Get product branch assignments
POST   /api/business/products/{id}/branches        - Assign product to branches
PUT    /api/business/products/{id}/branches/{branchId} - Update branch-specific data (stock, price)
DELETE /api/business/products/{id}/branches/{branchId} - Remove product from branch
```

### Stock Transfers

```
GET    /api/business/stock-transfers               - List stock transfers
POST   /api/business/stock-transfers               - Initiate stock transfer
GET    /api/business/stock-transfers/{id}          - Get transfer details
POST   /api/business/stock-transfers/{id}/complete - Complete transfer
POST   /api/business/stock-transfers/{id}/cancel   - Cancel transfer
```

### Branch Analytics

```
GET    /api/business/analytics/branch/{id}         - Get branch-specific metrics
GET    /api/business/analytics/compare             - Compare multiple branches
GET    /api/business/analytics/consolidated        - Get consolidated metrics (owner only)
```

## Frontend Components

### Branch Selector Component

**Location**: `frontend/src/components/BranchSelector.tsx`

Displays current branch and allows switching for multi-branch users:
- Shows current active branch
- Dropdown to switch branches (if user has multiple)
- Automatically refreshes data after switch
- Hidden for single-branch users

### Branch Management Page

**Location**: `frontend/src/pages/business/Branches.tsx`

Owner-only page for managing branches:
- List all branches with status
- Create new branch form
- Edit branch details
- Activate/deactivate branches
- View branch metrics

### Branch-Scoped Dashboard

**Location**: `frontend/src/pages/business/Dashboard.tsx` (modified)

Dashboard adapts based on user role:
- **Owner**: Shows consolidated metrics with branch breakdown
- **Manager/Staff**: Shows metrics for active branch only
- Branch selector at top for multi-branch users
- Comparative charts for owners

### Staff Assignment Interface

**Location**: `frontend/src/pages/business/Staff.tsx` (modified)

Enhanced staff management:
- Branch assignment checkboxes when creating/editing staff
- Display assigned branches in staff list
- Filter staff by branch
- Manager designation per branch

### Product Branch Management

**Location**: `frontend/src/pages/business/Products.tsx` (modified)

Enhanced product management:
- Branch assignment during product creation
- Branch-specific stock levels display
- Branch-specific pricing (optional)
- Stock transfer initiation from product view

### Stock Transfer Interface

**Location**: `frontend/src/pages/business/StockTransfers.tsx`

New page for managing stock transfers:
- Initiate transfer form (product, from/to branch, quantity)
- List pending/completed transfers
- Complete or cancel pending transfers
- Transfer history with audit trail

## Implementation Phases

### Phase 1: Core Branch Infrastructure
- Create Branch model and migrations
- Implement BelongsToBranch trait
- Create branch_user and branch_product pivot tables
- Implement BranchContextService
- Create branch middleware

### Phase 2: Data Migration
- Create migration for default branches
- Migrate existing products to branch_product
- Add branch_id to sales, contracts, visits
- Migrate existing data to default branches
- Validate data integrity

### Phase 3: Access Control
- Implement role-based branch access
- Update query scopes for branch filtering
- Implement branch switching logic
- Update authentication flow

### Phase 4: Stock Management
- Implement branch-specific stock tracking
- Create stock transfer system
- Update stock movement logic
- Implement inventory aggregation

### Phase 5: Frontend Integration
- Create branch selector component
- Update dashboard for branch context
- Implement branch management pages
- Update product/sales/maintenance pages
- Add stock transfer interface

### Phase 6: Analytics and Reporting
- Implement branch analytics service
- Create comparative reports
- Update dashboard metrics
- Add branch performance indicators

### Phase 7: Testing and Validation
- Write unit tests
- Write property-based tests
- Perform integration testing
- Conduct user acceptance testing
- Performance optimization

## Performance Considerations

### Database Indexing

Critical indexes for performance:
- `branches(tenant_id, is_active)`
- `branch_user(user_id, branch_id)`
- `branch_product(branch_id, product_id)`
- `sales(branch_id, sale_date)`
- `maintenance_contracts(branch_id, status)`
- `stock_transfers(status, created_at)`

### Query Optimization

- Use eager loading for branch relationships
- Cache user branch assignments in session
- Index foreign keys for branch_id columns
- Use database views for complex aggregations
- Implement query result caching for analytics

### Caching Strategy

- Cache user's assigned branches (1 hour TTL)
- Cache branch list per tenant (30 minutes TTL)
- Cache dashboard metrics (5 minutes TTL)
- Invalidate cache on branch assignments changes
- Use Redis for distributed caching

## Security Considerations

### Authorization Checks

Every branch-related operation must verify:
1. User belongs to the same tenant as the branch
2. User has appropriate role permissions
3. User has access to the specific branch (unless owner)
4. Branch is active (for new transactions)

### SQL Injection Prevention

- Use Eloquent ORM for all queries
- Parameterize all user inputs
- Validate branch IDs before queries
- Use prepared statements for raw queries

### Data Leakage Prevention

- Always apply tenant scope first
- Apply branch scope for non-owner users
- Sanitize error messages (no internal IDs)
- Log unauthorized access attempts
- Implement rate limiting on branch switching

## Monitoring and Logging

### Audit Logging

Log the following events:
- Branch creation/modification/deactivation
- Staff branch assignments/removals
- Stock transfers initiated/completed/cancelled
- Branch switching by users
- Unauthorized branch access attempts

### Performance Monitoring

Track metrics for:
- Query performance by branch count
- Branch switching frequency
- Stock transfer completion time
- Dashboard load time by role
- API response times for branch-scoped queries

### Alerts

Set up alerts for:
- Failed stock transfers
- Unauthorized branch access attempts
- Branch deactivation with pending transactions
- Stock levels below minimum across all branches
- Performance degradation with branch queries
