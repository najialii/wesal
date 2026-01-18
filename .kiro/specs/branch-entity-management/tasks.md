# Implementation Plan

- [x] 1. Create ProductBranchService for branch assignment logic


  - Create `app/Services/ProductBranchService.php`
  - Implement `assignToBranches()` method for creating branch-product records
  - Implement `removeFromBranch()` method with stock validation
  - Implement `updateBranchStock()` and `updateBranchPrice()` methods
  - Implement `bulkAssignToBranch()` method for bulk operations
  - Implement `getEffectivePrice()` method for price resolution
  - _Requirements: 1.2, 4.2, 4.3, 5.1, 5.2, 8.3_

- [ ]* 1.1 Write property test for branch assignment creates correct records
  - **Property 1: Product branch assignment creates correct records**
  - **Validates: Requirements 1.2, 4.2**

- [ ]* 1.2 Write property test for correct price resolution
  - **Property 8: Correct price resolution**
  - **Validates: Requirements 5.2, 5.4**


- [x] 2. Update ProductController for branch selection during creation

  - Update `store()` method to accept `branch_ids` array
  - Add validation for required branch selection
  - Create branch-product records with initial stock
  - Support optional branch-specific pricing
  - Pre-select user's current branch if available
  - _Requirements: 1.1, 1.2, 1.4, 6.3_

- [ ]* 2.1 Write property test for product requires at least one branch
  - **Property 2: Product requires at least one branch**
  - **Validates: Requirements 1.4**

- [ ]* 2.2 Write property test for active branch pre-selection
  - **Property 10: Active branch pre-selection**
  - **Validates: Requirements 6.3**


- [x] 3. Update ProductController for branch assignment updates

  - Update `update()` method to handle branch assignment changes
  - Implement branch addition with zero initial stock
  - Implement branch removal with stock validation
  - Prevent removal of last branch from product
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ]* 3.1 Write property test for last branch cannot be removed
  - **Property 4: Last branch cannot be removed from product**
  - **Validates: Requirements 4.4**

- [ ]* 3.2 Write property test for stock warning on branch removal
  - **Property 5: Stock warning on branch removal**
  - **Validates: Requirements 4.5**



- [ ] 4. Add bulk branch assignment endpoint
  - Create `POST /api/business/products/bulk-assign-branch` endpoint
  - Accept array of product IDs and target branch ID
  - Skip products already in target branch
  - Return detailed success/skip counts
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ]* 4.1 Write property test for bulk assignment creates records
  - **Property 14: Bulk assignment creates records for all products**
  - **Validates: Requirements 8.3**

- [ ]* 4.2 Write property test for bulk assignment skips existing
  - **Property 15: Bulk assignment skips existing assignments**

  - **Validates: Requirements 8.5**

- [x] 5. Add branch filtering to product queries

  - Update product listing to accept `branch_id` filter parameter
  - Support `branch_id=all` for business owners
  - Limit branch filter options based on user role
  - Include branch information in product response
  - _Requirements: 3.1, 3.2, 3.3, 3.5_

- [ ]* 5.1 Write property test for branch filter returns correct entities
  - **Property 6: Branch filter returns correct entities**
  - **Validates: Requirements 3.2**

- [ ]* 5.2 Write property test for all branches filter
  - **Property 7: All branches filter returns all entities**
  - **Validates: Requirements 3.3**

- [ ]* 5.3 Write property test for branch manager sees only assigned branches
  - **Property 3: Branch manager sees only assigned branches**
  - **Validates: Requirements 1.5, 3.5**


- [ ] 6. Checkpoint - Ensure all backend tests pass
  - Ensure all tests pass, ask the user if questions arise.



- [ ] 7. Create BranchSelectField frontend component
  - Create `frontend/src/components/ui/BranchSelectField.tsx`
  - Support single and multiple branch selection
  - Load branches from API based on user role
  - Show validation errors

  - Pre-select current active branch
  - _Requirements: 1.1, 1.3, 1.5_

- [x] 8. Update AddProduct page with branch selection

  - Add BranchSelectField to product creation form
  - Add per-branch initial stock inputs
  - Add optional per-branch pricing fields
  - Validate at least one branch selected
  - Submit branch assignments with product data
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 9. Update EditProduct page with branch management

  - Display current branch assignments
  - Allow adding/removing branches
  - Show stock per branch
  - Allow editing branch-specific prices
  - Confirm before removing branch with stock
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.3_


- [ ] 10. Add branch filter to Products list page
  - Add BranchFilter component to Products.tsx header
  - Include "All Branches" option for business owners
  - Update product query with branch filter
  - Show branch indicator column in table
  - Persist filter selection in URL/state
  - _Requirements: 3.1, 3.2, 3.3, 3.4_


- [ ] 11. Add bulk actions to Products list
  - Add checkbox selection to product rows
  - Add bulk action menu with "Assign to Branch" option
  - Create bulk assign modal with branch selection
  - Display success/skip results after bulk operation
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_


- [x] 12. Create SharedBadge component

  - Create `frontend/src/components/ui/SharedBadge.tsx`
  - Display "Shared across all branches" indicator
  - Include tooltip explaining shared behavior
  - Support different entity types (category, customer)
  - _Requirements: 2.1, 2.2, 10.2, 11.2_


- [x] 13. Update Categories page with shared indicator

  - Add SharedBadge to Categories.tsx
  - Show total product count across all branches
  - Add tooltip explaining tenant-wide availability
  - _Requirements: 2.2, 10.2, 10.5_

- [ ]* 13.1 Write property test for categories available to all branches
  - **Property 19: Categories available to all branches**
  - **Validates: Requirements 10.1, 10.4**

- [ ]* 13.2 Write property test for category product count aggregates
  - **Property 20: Category product count aggregates all branches**
  - **Validates: Requirements 10.5**

- [x] 14. Update Customers page with shared indicator

  - Add SharedBadge to Customers.tsx
  - Group transaction history by branch in detail view
  - Show multi-branch visit indicator
  - _Requirements: 2.2, 11.2, 11.3, 11.5_

- [ ]* 14.1 Write property test for customers accessible from all branches
  - **Property 21: Customers accessible from all branches**
  - **Validates: Requirements 11.1, 11.4**


- [x] 15. Update sidebar with shared/branch-specific indicators




  - Add visual indicators to sidebar navigation
  - Mark Categories and Customers as "Shared"
  - Mark Products, Sales, Maintenance as "Branch-specific"
  - _Requirements: 2.1_


- [x] 16. Checkpoint - Ensure frontend components work correctly

  - Ensure all tests pass, ask the user if questions arise.




- [x] 17. Add branch summary endpoint



  - Create `GET /api/business/branches/summary` endpoint
  - Return product count, sales count, contract count per branch
  - Include low stock product count per branch
  - Calculate total revenue per branch
  - _Requirements: 7.1, 7.2, 7.4_

- [ ]* 17.1 Write property test for branch summary counts are accurate
  - **Property 12: Branch summary counts are accurate**
  - **Validates: Requirements 7.2**

- [ ]* 17.2 Write property test for low stock warning triggers
  - **Property 13: Low stock warning triggers correctly**
  - **Validates: Requirements 7.4**

- [x] 18. Update Dashboard with branch summaries

  - Add branch summary cards to Dashboard.tsx
  - Display entity counts per branch
  - Show low stock warning indicators
  - Add click navigation to branch detail view
  - Add branch comparison chart for owners
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_


- [ ] 19. Update POS with enhanced branch context
  - Display current branch name prominently in POS header
  - Filter products to current branch only
  - Show empty state when branch has no products
  - Add low stock warnings for current branch
  - Ensure sale is assigned to current branch
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ]* 19.1 Write property test for POS sale assigned to current branch
  - **Property 22: POS sale assigned to current branch**
  - **Validates: Requirements 12.3**

- [ ]* 19.2 Write property test for POS shows only current branch products
  - **Property 23: POS shows only current branch products**
  - **Validates: Requirements 12.5**

- [ ]* 19.3 Write property test for POS low stock warning
  - **Property 24: POS low stock warning**
  - **Validates: Requirements 12.4**


- [ ] 20. Update maintenance contract creation with branch selection
  - Add branch selection to MaintenanceContractForm.tsx
  - Require branch selection for contract creation
  - Filter technician options by branch access
  - Display branch name in contracts list
  - _Requirements: 9.1, 9.2, 9.3_

- [ ]* 20.1 Write property test for maintenance contract requires branch
  - **Property 16: Maintenance contract requires branch**
  - **Validates: Requirements 9.1**

- [ ]* 20.2 Write property test for technician sees only assigned branch contracts
  - **Property 17: Technician sees only assigned branch contracts**
  - **Validates: Requirements 9.4**

- [ ]* 20.3 Write property test for contract visits share same branch
  - **Property 18: Contract visits share same branch**

  - **Validates: Requirements 9.5**

- [ ] 21. Enhance BranchSelector component
  - Add "All Branches" option for business owners
  - Support page-specific behavior via props
  - Improve visual indicator of current selection
  - Handle single-branch users (hide selector)
  - _Requirements: 6.1, 6.2, 6.4, 6.5_

- [ ]* 21.1 Write property test for branch switch updates context
  - **Property 9: Branch switch updates context and data**
  - **Validates: Requirements 6.1, 6.2**

- [ ]* 21.2 Write property test for single branch hides selector
  - **Property 11: Single branch hides selector**
  - **Validates: Requirements 6.4**


- [x] 22. Add branch-related translations

  - Add translations to `frontend/src/locales/en/branches.json`
  - Add translations to `frontend/src/locales/ar/branches.json`
  - Include shared entity labels
  - Include bulk action messages

  - Include validation error messages
  - _Requirements: All_

- [x] 23. Final checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.
