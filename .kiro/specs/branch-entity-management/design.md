# Branch Entity Management Enhancement - Design Document

## Overview

This design document outlines the enhancements to the multi-branch entity management system, focusing on providing business owners with intuitive controls for managing entities across multiple branches. The enhancement builds upon the existing multi-branch infrastructure to add explicit branch selection during entity creation, clear visual distinction between shared and branch-specific data, and improved filtering capabilities.

The design integrates with the existing Laravel backend and React frontend, extending the current branch management functionality without breaking existing workflows.

## Architecture

### Entity Classification

The system classifies entities into two categories:

```
Tenant Level (Shared Across All Branches)
├── Categories
│   └── Available to all branches automatically
├── Customers
│   └── Accessible from any branch, transactions tracked per branch
└── Users
    └── Can be assigned to multiple branches

Branch Level (Branch-Specific)
├── Products (via branch_product pivot)
│   ├── Branch-specific stock quantities
│   └── Optional branch-specific pricing
├── Sales
│   └── Assigned to specific branch
├── Maintenance Contracts
│   └── Assigned to specific branch
├── Maintenance Visits
│   └── Inherit branch from contract
└── Stock Movements
    └── Tracked per branch
```

### Data Flow for Entity Creation

```
User Creates Entity
    ↓
Check Entity Type
    ↓
├─ Shared Entity (Category/Customer)
│   └── Create with tenant_id only
│       └── Available to all branches
│
└─ Branch-Specific Entity (Product/Sale/Contract)
    ├── Display Branch Selection
    │   ├── Business Owner: All branches available
    │   └── Branch Manager: Only assigned branches
    ├── Validate Branch Selection
    │   └── At least one branch required
    └── Create Entity with Branch Assignment
        └── Create pivot records if applicable
```

### Branch Context Management

```
Page Load
    ↓
Check User Role
    ↓
├─ Business Owner
│   ├── Show Branch Selector with "All Branches" option
│   └── Default to "All Branches" or last selected
│
└─ Branch Manager/Staff
    ├── Show Branch Selector (assigned branches only)
    └── Default to primary assigned branch
    ↓
Apply Branch Context to Queries
    ↓
├─ Shared Entities: No branch filter
└─ Branch-Specific Entities: Filter by selected branch(es)
```

## Components and Interfaces

### 1. Enhanced Branch Selector Component

**File**: `frontend/src/components/BranchSelector.tsx`

Enhanced to support:
- "All Branches" option for business owners
- Page-specific behavior (some pages support all-branches view)
- Visual indicator of current selection

```typescript
interface BranchSelectorProps {
  onBranchChange?: (branchId: number | 'all') => void;
  allowAllBranches?: boolean;
  showInSingleBranch?: boolean;
}
```

### 2. Branch Selection Field Component

**File**: `frontend/src/components/ui/BranchSelectField.tsx`

New component for entity creation forms:

```typescript
interface BranchSelectFieldProps {
  value: number[];
  onChange: (branchIds: number[]) => void;
  multiple?: boolean;
  required?: boolean;
  label?: string;
  error?: string;
  disabled?: boolean;
}
```

### 3. Shared Entity Badge Component

**File**: `frontend/src/components/ui/SharedBadge.tsx`

Visual indicator for shared entities:

```typescript
interface SharedBadgeProps {
  type: 'category' | 'customer';
  tooltip?: string;
}
```

### 4. Branch Filter Component

**File**: `frontend/src/components/BranchFilter.tsx`

Reusable filter component for entity lists:

```typescript
interface BranchFilterProps {
  value: number | 'all';
  onChange: (branchId: number | 'all') => void;
  includeAllOption?: boolean;
}
```

### 5. Product Branch Assignment Service

**File**: `backend/wesaltech/app/Services/ProductBranchService.php`

Enhanced service for managing product-branch relationships:

```php
class ProductBranchService
{
    public function assignToBranches(Product $product, array $branchIds, array $options = []): void
    public function removeFromBranch(Product $product, int $branchId): bool
    public function updateBranchStock(Product $product, int $branchId, int $quantity): void
    public function updateBranchPrice(Product $product, int $branchId, ?float $price): void
    public function bulkAssignToBranch(array $productIds, int $branchId): array
    public function getEffectivePrice(Product $product, int $branchId): float
}
```

### 6. Enhanced Product Controller

**File**: `backend/wesaltech/app/Http/Controllers/Business/ProductController.php`

Updated to handle branch selection during creation:

```php
// Create product with branch assignments
public function store(Request $request)
{
    $validated = $request->validate([
        'name' => 'required|string|max:255',
        'branch_ids' => 'required|array|min:1',
        'branch_ids.*' => 'exists:branches,id',
        'branch_stock' => 'array',
        'branch_prices' => 'array',
        // ... other fields
    ]);
    
    // Create product and assign to branches
}

// Bulk assign products to branch
public function bulkAssignBranch(Request $request)
{
    $validated = $request->validate([
        'product_ids' => 'required|array|min:1',
        'branch_id' => 'required|exists:branches,id',
    ]);
    
    // Bulk assign logic
}
```

## Data Models

### Enhanced Product Model

```php
// app/Models/Product.php

class Product extends Model
{
    // Existing relationships...
    
    /**
     * Get effective price for a specific branch
     */
    public function getEffectivePriceForBranch(int $branchId): float
    {
        $branchProduct = $this->branches()
            ->where('branch_id', $branchId)
            ->first();
            
        if ($branchProduct && $branchProduct->pivot->selling_price !== null) {
            return $branchProduct->pivot->selling_price;
        }
        
        return $this->selling_price;
    }
    
    /**
     * Check if product has price variance across branches
     */
    public function hasPriceVariance(): bool
    {
        $prices = $this->branches()
            ->whereNotNull('branch_product.selling_price')
            ->pluck('branch_product.selling_price')
            ->unique();
            
        return $prices->count() > 1 || 
               ($prices->count() === 1 && $prices->first() != $this->selling_price);
    }
}
```

### Branch Summary DTO

```php
// app/DTOs/BranchSummary.php

class BranchSummary
{
    public int $branchId;
    public string $branchName;
    public int $productCount;
    public int $salesCount;
    public int $activeContractsCount;
    public int $lowStockCount;
    public float $totalRevenue;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Product Branch Assignment Properties

Property 1: Product branch assignment creates correct records
*For any* product creation with branch selection, the system should create branch-product records for each selected branch with the specified initial stock
**Validates: Requirements 1.2, 4.2**

Property 2: Product requires at least one branch
*For any* product creation attempt without branch selection, the system should reject the creation with a validation error
**Validates: Requirements 1.4**

Property 3: Branch manager sees only assigned branches
*For any* branch manager user, the branch selection options should only include their assigned branches
**Validates: Requirements 1.5, 3.5**

Property 4: Last branch cannot be removed from product
*For any* product with only one branch assignment, attempting to remove that branch should fail with an error
**Validates: Requirements 4.4**

Property 5: Stock warning on branch removal
*For any* branch removal where stock quantity is greater than zero, the system should require explicit confirmation
**Validates: Requirements 4.5**

### Branch Filtering Properties

Property 6: Branch filter returns correct entities
*For any* branch filter selection, all returned entities should belong to the selected branch
**Validates: Requirements 3.2**

Property 7: All branches filter returns all entities
*For any* "All Branches" filter selection by a business owner, the returned entities should include items from all branches within the tenant
**Validates: Requirements 3.3**

### Pricing Properties

Property 8: Correct price resolution
*For any* product and branch combination, the system should return the branch-specific price if set, otherwise the default product price
**Validates: Requirements 5.2, 5.4**

### Branch Context Properties

Property 9: Branch switch updates context and data
*For any* branch switch action, the current branch context should update and subsequent data queries should reflect the new branch
**Validates: Requirements 6.1, 6.2**

Property 10: Active branch pre-selection
*For any* entity creation form, the current active branch should be pre-selected in the branch selection field
**Validates: Requirements 6.3**

Property 11: Single branch hides selector
*For any* user with only one assigned branch, the branch selector component should not be displayed
**Validates: Requirements 6.4**

### Dashboard Properties

Property 12: Branch summary counts are accurate
*For any* branch summary display, the product count, sales count, and contract count should match the actual records for that branch
**Validates: Requirements 7.2**

Property 13: Low stock warning triggers correctly
*For any* branch with products below minimum stock level, the dashboard should display a warning indicator
**Validates: Requirements 7.4**

### Bulk Assignment Properties

Property 14: Bulk assignment creates records for all products
*For any* bulk branch assignment, branch-product records should be created for all selected products that don't already exist in the target branch
**Validates: Requirements 8.3**

Property 15: Bulk assignment skips existing assignments
*For any* bulk branch assignment where some products already exist in the target branch, those products should be skipped and the count reported
**Validates: Requirements 8.5**

### Maintenance Properties

Property 16: Maintenance contract requires branch
*For any* maintenance contract creation without branch selection, the system should reject the creation
**Validates: Requirements 9.1**

Property 17: Technician sees only assigned branch contracts
*For any* technician user, the maintenance contracts list should only include contracts from their assigned branches
**Validates: Requirements 9.4**

Property 18: Contract visits share same branch
*For any* maintenance contract with multiple visits, all visits should have the same branch_id as the contract
**Validates: Requirements 9.5**

### Shared Entity Properties

Property 19: Categories available to all branches
*For any* category creation, the category should be accessible when creating products in any branch within the tenant
**Validates: Requirements 10.1, 10.4**

Property 20: Category product count aggregates all branches
*For any* category with products in multiple branches, the displayed product count should be the sum across all branches
**Validates: Requirements 10.5**

Property 21: Customers accessible from all branches
*For any* customer creation, the customer should be searchable and accessible from any branch within the tenant
**Validates: Requirements 11.1, 11.4**

### POS Properties

Property 22: POS sale assigned to current branch
*For any* sale processed through POS, the sale should be automatically assigned to the current active branch
**Validates: Requirements 12.3**

Property 23: POS shows only current branch products
*For any* POS product display, only products assigned to the current branch with stock > 0 should be shown
**Validates: Requirements 12.5**

Property 24: POS low stock warning
*For any* product in POS where current branch stock is at or below minimum level, a warning indicator should be displayed
**Validates: Requirements 12.4**

## Error Handling

### Validation Errors

**Branch Selection Errors**:
- `BRANCH_REQUIRED`: At least one branch must be selected
- `INVALID_BRANCH`: Selected branch does not exist or is inactive
- `BRANCH_ACCESS_DENIED`: User does not have access to selected branch
- `CANNOT_REMOVE_LAST_BRANCH`: Cannot remove the only branch from a product

**Stock Errors**:
- `STOCK_EXISTS_IN_BRANCH`: Branch has existing stock, confirmation required for removal
- `INSUFFICIENT_STOCK`: Not enough stock in branch for operation

**Bulk Operation Errors**:
- `PARTIAL_SUCCESS`: Some items were processed, others failed
- `NO_PRODUCTS_SELECTED`: No products selected for bulk operation

### Error Response Format

```json
{
    "success": false,
    "error": {
        "code": "BRANCH_REQUIRED",
        "message": "At least one branch must be selected for this product",
        "field": "branch_ids"
    }
}
```

### Partial Success Response (Bulk Operations)

```json
{
    "success": true,
    "data": {
        "assigned": 8,
        "skipped": 2,
        "failed": 0,
        "skipped_products": [
            {"id": 5, "name": "Product A", "reason": "Already assigned to branch"}
        ]
    }
}
```

## Testing Strategy

### Unit Testing

**Service Tests**:
- ProductBranchService assignment methods
- Price resolution logic
- Bulk assignment logic
- Branch access validation

**Model Tests**:
- Product effective price calculation
- Price variance detection
- Branch relationship methods

**Controller Tests**:
- Product creation with branch selection
- Bulk assignment endpoint
- Branch filter application

### Property-Based Testing

The system will use **Pest PHP** with **pest-plugin-faker** for property-based testing. Each property-based test will run a minimum of 100 iterations.

**Key Property Tests**:

1. **Branch Assignment Creates Records** (Property 1)
   - Generate random products with random branch selections
   - Verify branch-product records created correctly
   - Verify initial stock values

2. **Branch Filter Correctness** (Property 6)
   - Generate random products across multiple branches
   - Apply branch filter
   - Verify all returned products belong to filtered branch

3. **Price Resolution** (Property 8)
   - Generate products with various branch-specific prices
   - Query effective price for different branches
   - Verify correct price returned

4. **Bulk Assignment** (Properties 14, 15)
   - Generate random products, some already in target branch
   - Execute bulk assignment
   - Verify new records created, existing skipped

5. **Shared Entity Access** (Properties 19, 21)
   - Create categories/customers
   - Query from different branch contexts
   - Verify accessibility from all branches

### Integration Testing

**API Endpoint Tests**:
- Product creation with branch selection
- Product branch assignment update
- Bulk branch assignment
- Branch-filtered product listing
- Dashboard branch summaries

**Frontend Component Tests**:
- BranchSelectField renders correctly
- Branch filter updates data
- Shared badge displays correctly
- POS branch context

## API Endpoints

### Product Branch Management

```
POST   /api/business/products                    - Create product with branch assignments
PUT    /api/business/products/{id}               - Update product including branch assignments
POST   /api/business/products/bulk-assign-branch - Bulk assign products to branch
GET    /api/business/products?branch_id={id}     - List products filtered by branch
GET    /api/business/products?branch_id=all      - List products from all branches (owner only)
```

### Branch Summary

```
GET    /api/business/branches/summary            - Get summary counts for all branches
GET    /api/business/branches/{id}/summary       - Get detailed summary for specific branch
```

### Request/Response Examples

**Create Product with Branches**:
```json
POST /api/business/products
{
    "name": "Product Name",
    "sku": "PRD-001",
    "category_id": 1,
    "selling_price": 100.00,
    "cost_price": 80.00,
    "branch_ids": [1, 2],
    "branch_stock": {
        "1": 50,
        "2": 30
    },
    "branch_prices": {
        "2": 110.00
    }
}
```

**Bulk Assign Response**:
```json
{
    "success": true,
    "message": "Products assigned to branch successfully",
    "data": {
        "assigned": 8,
        "skipped": 2,
        "details": {
            "assigned_products": [1, 2, 3, 4, 5, 6, 7, 8],
            "skipped_products": [
                {"id": 9, "reason": "Already in branch"},
                {"id": 10, "reason": "Already in branch"}
            ]
        }
    }
}
```

## Frontend Components

### Updated AddProduct Page

**Location**: `frontend/src/pages/business/AddProduct.tsx`

Add branch selection section:
- Multi-select branch field (required)
- Per-branch initial stock inputs
- Optional per-branch pricing
- Pre-select current active branch

### Updated Products List Page

**Location**: `frontend/src/pages/business/Products.tsx`

Add branch filtering:
- Branch filter dropdown in header
- "All Branches" option for owners
- Branch indicator column in table
- Bulk action menu with "Assign to Branch"

### Updated Categories Page

**Location**: `frontend/src/pages/business/Categories.tsx`

Add shared indicator:
- "Shared across all branches" badge
- Product count shows total across all branches
- Tooltip explaining shared behavior

### Updated Customers Page

**Location**: `frontend/src/pages/business/Customers.tsx`

Add shared indicator:
- "Shared across all branches" badge
- Transaction history grouped by branch
- Multi-branch visit indicator

### Updated POS Page

**Location**: `frontend/src/pages/business/POS.tsx`

Enhance branch context:
- Prominent branch name display
- Empty state for no products in branch
- Low stock warnings per branch
- Filter products to current branch only

### Updated Dashboard

**Location**: `frontend/src/pages/business/Dashboard.tsx`

Add branch summaries:
- Per-branch entity counts card
- Low stock warning indicators
- Branch comparison chart (owners)
- Click to navigate to branch view

## Implementation Phases

### Phase 1: Backend Enhancements
- Update ProductController for branch selection
- Create ProductBranchService
- Add bulk assignment endpoint
- Update validation rules

### Phase 2: Frontend Branch Selection
- Create BranchSelectField component
- Update AddProduct page
- Update EditProduct page
- Add branch filter to Products list

### Phase 3: Visual Indicators
- Create SharedBadge component
- Update Categories page
- Update Customers page
- Add branch indicators to entity lists

### Phase 4: Dashboard & POS
- Add branch summaries to dashboard
- Update POS branch context
- Add low stock warnings
- Add branch comparison charts

### Phase 5: Bulk Operations
- Add bulk selection to Products list
- Implement bulk assign UI
- Add success/skip reporting

### Phase 6: Testing
- Write property-based tests
- Write integration tests
- Manual testing across roles
