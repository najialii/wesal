# Implementation Plan

- [x] 1. Create core branch infrastructure


  - Create Branch model with tenant relationship
  - Create database migrations for branches table
  - Create pivot tables for branch_user and branch_product
  - Implement BelongsToBranch trait with automatic scoping
  - _Requirements: 1.1, 1.2, 2.1, 3.1_

- [ ]* 1.1 Write property test for default branch creation
  - **Property 1: Default branch creation**
  - **Validates: Requirements 1.1**

- [ ]* 1.2 Write property test for branch creation validation
  - **Property 2: Branch creation validation**
  - **Validates: Requirements 1.2**

- [x] 2. Implement branch context management



  - Create BranchContextService for managing active branch
  - Implement branch switching logic
  - Create EnsureBranchAccess middleware
  - Add branch context to authentication tokens/session
  - _Requirements: 3.2, 3.3, 8.1_

- [ ]* 2.1 Write property test for staff data access restriction
  - **Property 9: Staff data access restriction**
  - **Validates: Requirements 3.2**

- [ ]* 2.2 Write property test for branch switching changes scope
  - **Property 11: Branch switching changes scope**
  - **Validates: Requirements 3.3**

- [x] 3. Create data migration for existing tenants


  - Create migration to add branch_id columns to existing tables (sales, maintenance_contracts, maintenance_visits, stock_movements)
  - Create migration to generate default branch for each tenant
  - Migrate existing products to branch_product pivot table
  - Migrate existing users to branch_user pivot table
  - Assign all existing sales/contracts/visits to default branch
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ]* 3.1 Write property test for migration creates default branches
  - **Property 32: Migration creates default branches**
  - **Validates: Requirements 12.1**

- [ ]* 3.2 Write property test for migration preserves data integrity
  - **Property 33: Migration preserves data integrity**
  - **Validates: Requirements 12.5**

- [x] 4. Update Product model for multi-branch support


  - Add branches() relationship to Product model
  - Implement getStockForBranch() method
  - Implement updateStockForBranch() method
  - Update product queries to include branch context
  - Modify product stock display to show per-branch quantities
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ]* 4.1 Write property test for product requires branch assignment
  - **Property 4: Product requires branch assignment**
  - **Validates: Requirements 2.1**

- [ ]* 4.2 Write property test for branch stock isolation
  - **Property 5: Branch stock isolation**
  - **Validates: Requirements 2.2**

- [ ]* 4.3 Write property test for sale deducts correct branch stock
  - **Property 6: Sale deducts correct branch stock**
  - **Validates: Requirements 2.4**

- [ ]* 4.4 Write property test for independent branch pricing
  - **Property 7: Independent branch pricing**
  - **Validates: Requirements 2.5**

- [x] 5. Update User model for branch assignments

  - Add branches() relationship to User model
  - Implement canAccessBranch() method
  - Implement isManagerOf() method
  - Implement getDefaultBranch() method
  - Update user queries to respect branch assignments
  - _Requirements: 3.1, 3.2, 3.4, 3.5_

- [ ]* 5.1 Write property test for staff requires branch assignment
  - **Property 8: Staff requires branch assignment**
  - **Validates: Requirements 3.1**

- [ ]* 5.2 Write property test for owner has all-branch access
  - **Property 10: Owner has all-branch access**
  - **Validates: Requirements 3.5**

- [x] 6. Update Sale model for branch tracking

  - Add BelongsToBranch trait to Sale model
  - Add branch() relationship
  - Update sale creation to capture branch_id automatically
  - Modify sale queries to filter by branch for non-owners
  - Update sale number generation to include branch code
  - _Requirements: 4.1, 4.2, 4.4_

- [ ]* 6.1 Write property test for sales record branch
  - **Property 12: Sales record branch**
  - **Validates: Requirements 4.1**

- [ ]* 6.2 Write property test for sales filtering by branch
  - **Property 13: Sales filtering by branch**
  - **Validates: Requirements 4.2**

- [ ]* 6.3 Write property test for salesperson uses active branch
  - **Property 14: Salesperson uses active branch**
  - **Validates: Requirements 4.4**

- [x] 7. Update Customer model to remain tenant-wide


  - Verify Customer model uses BelongsToTenant (not BelongsToBranch)
  - Update customer queries to be tenant-scoped, not branch-scoped
  - Add method to get customer transactions by branch
  - Update customer history to group by branch
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ]* 7.1 Write property test for customers are tenant-wide
  - **Property 15: Customers are tenant-wide**
  - **Validates: Requirements 5.1**

- [ ]* 7.2 Write property test for customer search is tenant-scoped
  - **Property 16: Customer search is tenant-scoped**
  - **Validates: Requirements 5.4**

- [ ]* 7.3 Write property test for customer profile consistency
  - **Property 17: Customer profile consistency**
  - **Validates: Requirements 5.5**

- [x] 8. Update Maintenance models for branch support

  - Add BelongsToBranch trait to MaintenanceContract model
  - Add BelongsToBranch trait to MaintenanceVisit model
  - Update maintenance queries to filter by branch for technicians
  - Modify technician assignment to respect branch access
  - Update spare parts inventory to track per branch
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ]* 8.1 Write property test for maintenance contract requires branch
  - **Property 18: Maintenance contract requires branch**
  - **Validates: Requirements 6.1**

- [ ]* 8.2 Write property test for technician sees only assigned branch visits
  - **Property 19: Technician sees only assigned branch visits**
  - **Validates: Requirements 6.4**

- [ ]* 8.3 Write property test for spare parts tracked per branch
  - **Property 20: Spare parts tracked per branch**
  - **Validates: Requirements 6.5**

- [x] 9. Implement stock transfer system


  - Create StockTransfer model and migration
  - Implement StockTransferService with initiate/complete/cancel methods
  - Add validation for sufficient stock before transfer
  - Implement atomic stock updates (deduct from source, add to destination)
  - Create stock transfer audit logging
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ]* 9.1 Write property test for transfer requires all fields
  - **Property 21: Transfer requires all fields**
  - **Validates: Requirements 7.1**

- [ ]* 9.2 Write property test for transfer is atomic
  - **Property 22: Transfer is atomic**
  - **Validates: Requirements 7.2**

- [ ]* 9.3 Write property test for insufficient stock prevents transfer
  - **Property 23: Insufficient stock prevents transfer**
  - **Validates: Requirements 7.5**

- [x] 10. Update StockMovement model for branch tracking


  - Add BelongsToBranch trait to StockMovement model
  - Update stock movement creation to include branch_id
  - Add stock transfer type to movement types
  - Modify stock movement queries to filter by branch
  - Update product stock updates to be branch-specific
  - _Requirements: 2.4, 7.2, 7.3_

- [x] 11. Implement branch analytics service


  - Create BranchAnalyticsService
  - Implement getBranchMetrics() for single branch analytics
  - Implement compareBranches() for multi-branch comparison
  - Implement getConsolidatedMetrics() for owner dashboard
  - Add caching for analytics queries
  - _Requirements: 4.3, 4.5, 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ]* 11.1 Write property test for manager dashboard is branch-scoped
  - **Property 24: Manager dashboard is branch-scoped**
  - **Validates: Requirements 8.1**

- [ ]* 11.2 Write property test for owner dashboard aggregates all branches
  - **Property 25: Owner dashboard aggregates all branches**
  - **Validates: Requirements 9.1**

- [ ]* 11.3 Write property test for inventory totals match branch sum
  - **Property 26: Inventory totals match branch sum**
  - **Validates: Requirements 9.4**

- [x] 12. Create branch management API endpoints


  - Create BranchController with CRUD operations
  - Implement GET /api/business/branches (list branches)
  - Implement POST /api/business/branches (create branch - owner only)
  - Implement GET /api/business/branches/{id} (get branch details)
  - Implement PUT /api/business/branches/{id} (update branch - owner only)
  - Implement DELETE /api/business/branches/{id} (deactivate branch - owner only)
  - Add authorization checks for owner-only operations
  - _Requirements: 1.2, 1.3, 1.4, 1.5_

- [ ]* 12.1 Write property test for branch deactivation preserves history
  - **Property 3: Branch deactivation preserves history**
  - **Validates: Requirements 1.5**

- [x] 13. Create branch context API endpoints



  - Implement GET /api/business/branches/current (get active branch)
  - Implement POST /api/business/branches/switch (switch active branch)
  - Implement GET /api/business/branches/my-branches (get user's branches)
  - Add validation for branch switching (user must have access)
  - Update authentication response to include user's branches
  - _Requirements: 3.3, 8.5_

- [x] 14. Create staff branch assignment API endpoints



  - Implement GET /api/business/staff/{id}/branches (get staff branches)
  - Implement POST /api/business/staff/{id}/branches (assign to branches)
  - Implement DELETE /api/business/staff/{id}/branches/{branchId} (remove assignment)
  - Add validation to ensure cross-tenant assignments are prevented
  - _Requirements: 3.1, 3.4_

- [ ]* 14.1 Write property test for tenant isolation enforced
  - **Property 27: Tenant isolation enforced**
  - **Validates: Requirements 10.2**

- [ ]* 14.2 Write property test for branch assignments respect tenant boundaries
  - **Property 28: Branch assignments respect tenant boundaries**
  - **Validates: Requirements 10.3**

- [x] 15. Create product branch management API endpoints


  - Implement GET /api/business/products/{id}/branches (get product branches)
  - Implement POST /api/business/products/{id}/branches (assign to branches)
  - Implement PUT /api/business/products/{id}/branches/{branchId} (update stock/price)
  - Implement DELETE /api/business/products/{id}/branches/{branchId} (remove from branch)
  - Add validation for branch-specific operations
  - _Requirements: 2.1, 2.2, 2.3, 2.5_

- [x] 16. Create stock transfer API endpoints


  - Implement GET /api/business/stock-transfers (list transfers)
  - Implement POST /api/business/stock-transfers (initiate transfer)
  - Implement GET /api/business/stock-transfers/{id} (get transfer details)
  - Implement POST /api/business/stock-transfers/{id}/complete (complete transfer)
  - Implement POST /api/business/stock-transfers/{id}/cancel (cancel transfer)
  - Add authorization checks for transfer operations
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 17. Create branch analytics API endpoints


  - Implement GET /api/business/analytics/branch/{id} (branch metrics)
  - Implement GET /api/business/analytics/compare (compare branches)
  - Implement GET /api/business/analytics/consolidated (consolidated metrics - owner only)
  - Add caching headers for analytics responses
  - _Requirements: 4.3, 4.5, 9.1, 9.2, 9.3_

- [x] 18. Update existing API controllers for branch context



  - Update ProductController to filter by branch for non-owners
  - Update SaleController to set branch_id automatically
  - Update MaintenanceController to filter by branch for technicians
  - Update CustomerController to remain tenant-scoped (not branch-scoped)
  - Update CategoryController to remain tenant-scoped (not branch-scoped)
  - _Requirements: 2.3, 4.1, 6.3, 5.1, 11.1_

- [ ]* 18.1 Write property test for queries include dual scoping
  - **Property 29: Queries include dual scoping**
  - **Validates: Requirements 10.4**

- [ ]* 18.2 Write property test for categories are tenant-wide
  - **Property 30: Categories are tenant-wide**
  - **Validates: Requirements 11.1**

- [ ]* 18.3 Write property test for category deletion affects all branches
  - **Property 31: Category deletion affects all branches**
  - **Validates: Requirements 11.4**

- [x] 19. Create frontend BranchSelector component



  - Create BranchSelector.tsx component
  - Display current active branch
  - Show dropdown for branch switching (if user has multiple)
  - Implement branch switching API call
  - Refresh page data after branch switch
  - Add to main layout for business users
  - _Requirements: 3.3, 8.5_

- [x] 20. Create frontend branch management page


  - Create Branches.tsx page (owner only)
  - Display list of all branches with status
  - Implement create branch form with validation
  - Implement edit branch functionality
  - Implement activate/deactivate branch actions
  - Add branch metrics cards
  - _Requirements: 1.2, 1.3, 1.4, 1.5_

- [x] 21. Update frontend dashboard for branch context



  - Modify Dashboard.tsx to detect user role
  - Show consolidated metrics for owners with branch breakdown
  - Show branch-specific metrics for managers/staff
  - Add branch selector at top for multi-branch users
  - Implement comparative charts for owners
  - Update KPI cards to show branch context
  - _Requirements: 8.1, 8.2, 8.3, 9.1, 9.3_

- [x] 22. Update frontend staff management for branch assignments



  - Modify Staff.tsx and StaffCreateModal.tsx
  - Add branch assignment checkboxes to staff creation form
  - Add branch assignment checkboxes to staff edit form
  - Display assigned branches in staff list table
  - Add filter to view staff by branch
  - Add manager designation toggle per branch
  - _Requirements: 3.1, 3.4_

- [x] 23. Update frontend product management for branches

  - Modify Products.tsx and AddProduct.tsx
  - Add branch assignment section to product creation form
  - Display branch-specific stock levels in product list
  - Add branch-specific pricing fields (optional)
  - Implement stock level editing per branch
  - Add visual indicators for low stock per branch
  - _Requirements: 2.1, 2.2, 2.3, 2.5_

- [x] 24. Create frontend stock transfer interface


  - Create StockTransfers.tsx page
  - Implement initiate transfer form (product, from/to branch, quantity)
  - Display list of pending transfers with actions
  - Display completed transfer history
  - Implement complete transfer action
  - Implement cancel transfer action
  - Add transfer status badges
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 25. Update frontend POS for branch context


  - Modify POS.tsx to use active branch
  - Display current branch in POS header
  - Filter products by active branch stock
  - Automatically set branch_id on sale creation
  - Show branch-specific stock warnings
  - _Requirements: 2.3, 4.1, 4.4_

- [x] 26. Update frontend sales pages for branch filtering


  - Modify Sales.tsx to add branch filter
  - Display branch name in sales list
  - Update SalesDetailModal to show branch information
  - Add branch comparison view for owners
  - Filter sales by active branch for non-owners
  - _Requirements: 4.2, 4.3_

- [x] 27. Update frontend maintenance pages for branch context


  - Modify Maintenance.tsx and MaintenanceContracts.tsx
  - Filter contracts by active branch for technicians
  - Display branch name in contract list
  - Update contract forms to include branch selection
  - Filter technician assignments by branch access
  - Show branch-specific spare parts inventory
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 28. Update frontend customer pages to remain tenant-wide



  - Verify Customers.tsx searches across all branches
  - Display branch information in customer transaction history
  - Group customer transactions by branch in detail view
  - Show which branches customer has visited
  - Maintain unified customer profile across branches
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 29. Add frontend localization for branch features


  - Add branch-related translations to en/common.json
  - Add branch-related translations to ar/common.json
  - Add stock transfer translations to both languages
  - Add branch analytics translations to both languages
  - Update validation messages for branch operations
  - _Requirements: All_

- [x] 30. Implement frontend error handling for branch operations



  - Add error handling for branch access denied
  - Add error handling for insufficient stock transfers
  - Add error handling for inactive branch transactions
  - Display user-friendly error messages
  - Add retry logic for branch switching failures
  - _Requirements: All_

- [x] 31. Add database indexes for performance


  - Add index on branches(tenant_id, is_active)
  - Add index on branch_user(user_id, branch_id)
  - Add index on branch_product(branch_id, product_id)
  - Add index on sales(branch_id, sale_date)
  - Add index on maintenance_contracts(branch_id, status)
  - Add index on stock_transfers(status, created_at)
  - _Requirements: Performance_

- [x] 32. Implement caching for branch data


  - Cache user's assigned branches in session (1 hour TTL)
  - Cache branch list per tenant (30 minutes TTL)
  - Cache dashboard metrics (5 minutes TTL)
  - Implement cache invalidation on branch changes
  - Add Redis caching for analytics queries
  - _Requirements: Performance_

- [x] 33. Add audit logging for branch operations


  - Log branch creation/modification/deactivation
  - Log staff branch assignments/removals
  - Log stock transfers initiated/completed/cancelled
  - Log branch switching by users
  - Log unauthorized branch access attempts
  - _Requirements: Security, Audit_

- [x] 34. Create seeder for multi-branch test data


  - Create BranchSeeder with sample branches
  - Update existing seeders to assign data to branches
  - Create sample stock transfers
  - Create sample multi-branch users
  - Ensure test data covers all branch scenarios
  - _Requirements: Testing_

- [x] 35. Update API documentation


  - Document all new branch endpoints
  - Document branch context in authentication
  - Document branch-scoped query behavior
  - Add examples for branch operations
  - Document error codes for branch operations
  - _Requirements: Documentation_

- [x] 36. Final checkpoint - Ensure all tests pass



  - Ensure all tests pass, ask the user if questions arise.
