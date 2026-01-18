# Requirements Document

## Introduction

This document specifies the requirements for enhancing the multi-branch entity management system to provide business owners with intuitive controls for managing entities (products, categories, sales, maintenance, etc.) across multiple branches. The enhancement focuses on making branch selection explicit during entity creation, clearly distinguishing between shared and branch-specific data, and providing super admins with comprehensive cross-branch management capabilities.

## Glossary

- **Tenant**: A business organization that subscribes to the system
- **Branch**: A physical store location or operational unit within a tenant's business
- **Business Owner**: A user with the owner role who manages the entire tenant organization
- **Branch-Specific Entity**: Data that belongs to a specific branch (products with stock, sales, maintenance contracts)
- **Shared Entity**: Data that is shared across all branches within a tenant (categories, customers)
- **Branch Selector**: UI component that allows users to choose which branch to work with
- **Entity Creation Form**: UI form used to create new records (products, sales, etc.)
- **Active Branch**: The currently selected branch context for the user's session
- **All Branches View**: A view mode that shows aggregated data from all branches (owner only)

## Requirements

### Requirement 1

**User Story:** As a business owner, I want to select which branch a product belongs to when creating it, so that I can manage inventory for specific locations from the start.

#### Acceptance Criteria

1. WHEN a business owner creates a new product THEN the system SHALL display a branch selection field in the product creation form
2. WHEN a product is created with branch selection THEN the system SHALL assign the product to the selected branch with initial stock
3. WHEN a business owner has multiple branches THEN the system SHALL allow selecting multiple branches for a single product
4. WHEN no branch is selected THEN the system SHALL prevent product creation and display a validation error
5. WHERE a user is a branch manager THEN the system SHALL pre-select and limit branch options to their assigned branches

### Requirement 2

**User Story:** As a business owner, I want to clearly see which entities are shared across branches and which are branch-specific, so that I understand how my data is organized.

#### Acceptance Criteria

1. WHEN viewing the sidebar navigation THEN the system SHALL display visual indicators for shared vs branch-specific sections
2. WHEN viewing a shared entity list (categories, customers) THEN the system SHALL display a "Shared across all branches" indicator
3. WHEN viewing a branch-specific entity list (products, sales) THEN the system SHALL display the current branch context
4. WHEN a business owner views entity details THEN the system SHALL show which branches the entity belongs to
5. WHERE documentation or tooltips exist THEN the system SHALL explain the shared vs branch-specific behavior

### Requirement 3

**User Story:** As a business owner, I want to filter and view entities by branch, so that I can focus on specific location data when needed.

#### Acceptance Criteria

1. WHEN viewing products list THEN the system SHALL provide a branch filter dropdown
2. WHEN a branch filter is applied THEN the system SHALL display only entities from the selected branch
3. WHEN "All Branches" filter is selected THEN the system SHALL display entities from all branches with branch indicators
4. WHEN viewing sales history THEN the system SHALL allow filtering by branch
5. WHERE a user is a branch manager THEN the system SHALL limit filter options to their assigned branches

### Requirement 4

**User Story:** As a business owner, I want to assign existing products to additional branches, so that I can expand product availability across locations.

#### Acceptance Criteria

1. WHEN editing a product THEN the system SHALL display current branch assignments
2. WHEN a business owner adds a branch to a product THEN the system SHALL create a new branch-product record with zero initial stock
3. WHEN a business owner removes a branch from a product THEN the system SHALL remove the branch-product record after confirmation
4. WHEN removing the last branch from a product THEN the system SHALL prevent removal and display an error
5. WHERE stock exists in a branch being removed THEN the system SHALL warn about stock loss and require confirmation

### Requirement 5

**User Story:** As a business owner, I want to set branch-specific pricing for products, so that I can adjust prices based on location costs.

#### Acceptance Criteria

1. WHEN editing a product's branch assignment THEN the system SHALL allow setting a branch-specific selling price
2. WHEN no branch-specific price is set THEN the system SHALL use the product's default selling price
3. WHEN viewing product details THEN the system SHALL display prices for each assigned branch
4. WHEN processing a sale THEN the system SHALL use the branch-specific price if available
5. WHERE price differs between branches THEN the system SHALL display a price variance indicator

### Requirement 6

**User Story:** As a business owner, I want to quickly switch between branches when managing entities, so that I can efficiently work across multiple locations.

#### Acceptance Criteria

1. WHEN the branch selector is used THEN the system SHALL update the current branch context immediately
2. WHEN branch context changes THEN the system SHALL refresh the current page data for the new branch
3. WHEN creating a new entity THEN the system SHALL pre-select the current active branch
4. WHEN a user has only one branch THEN the system SHALL hide the branch selector
5. WHERE a page supports "All Branches" view THEN the system SHALL include this option in the branch selector

### Requirement 7

**User Story:** As a business owner, I want to see a summary of entity counts per branch on the dashboard, so that I can quickly assess each location's data.

#### Acceptance Criteria

1. WHEN viewing the dashboard THEN the system SHALL display entity counts grouped by branch
2. WHEN viewing branch summary THEN the system SHALL show product count, sales count, and active maintenance contracts per branch
3. WHEN clicking on a branch summary THEN the system SHALL navigate to that branch's detailed view
4. WHEN a branch has low stock products THEN the system SHALL display a warning indicator
5. WHERE multiple branches exist THEN the system SHALL display a comparison chart of key metrics

### Requirement 8

**User Story:** As a business owner, I want to bulk assign products to branches, so that I can efficiently manage product availability across locations.

#### Acceptance Criteria

1. WHEN viewing the products list THEN the system SHALL provide a bulk action menu
2. WHEN selecting multiple products THEN the system SHALL enable "Assign to Branch" bulk action
3. WHEN bulk assigning to a branch THEN the system SHALL create branch-product records for all selected products
4. WHEN bulk assignment completes THEN the system SHALL display a success message with count of assigned products
5. WHERE some products already exist in the target branch THEN the system SHALL skip those and report the count

### Requirement 9

**User Story:** As a business owner, I want maintenance contracts to show which branch they belong to, so that I can track service operations by location.

#### Acceptance Criteria

1. WHEN creating a maintenance contract THEN the system SHALL require branch selection
2. WHEN viewing maintenance contracts list THEN the system SHALL display the branch name for each contract
3. WHEN filtering maintenance contracts THEN the system SHALL allow filtering by branch
4. WHEN a technician views their contracts THEN the system SHALL show only contracts from their assigned branches
5. WHERE a contract spans multiple visits THEN the system SHALL ensure all visits are associated with the same branch

### Requirement 10

**User Story:** As a business owner, I want categories to remain shared across all branches, so that I maintain consistent product organization.

#### Acceptance Criteria

1. WHEN creating a category THEN the system SHALL make it available to all branches automatically
2. WHEN viewing categories THEN the system SHALL display a "Shared" badge indicating tenant-wide availability
3. WHEN deleting a category THEN the system SHALL affect products in all branches
4. WHEN assigning products to categories THEN the system SHALL use the same category options regardless of branch
5. WHERE a category is used by products in multiple branches THEN the system SHALL show the total product count across all branches

### Requirement 11

**User Story:** As a business owner, I want customers to be accessible from any branch, so that I can serve returning customers at any location.

#### Acceptance Criteria

1. WHEN creating a customer THEN the system SHALL make the customer available to all branches
2. WHEN viewing customers THEN the system SHALL display a "Shared" badge indicating tenant-wide availability
3. WHEN viewing customer details THEN the system SHALL show transaction history grouped by branch
4. WHEN searching for customers THEN the system SHALL return results regardless of which branch created the record
5. WHERE a customer has visited multiple branches THEN the system SHALL display a multi-branch indicator

### Requirement 12

**User Story:** As a business owner, I want the POS system to clearly show which branch I'm selling from, so that I don't accidentally process sales for the wrong location.

#### Acceptance Criteria

1. WHEN opening the POS THEN the system SHALL prominently display the current branch name
2. WHEN the current branch has no products THEN the system SHALL display a message to add products to this branch
3. WHEN processing a sale THEN the system SHALL automatically assign the sale to the current branch
4. WHEN stock is low for a product in the current branch THEN the system SHALL display a warning
5. WHERE a product exists in other branches but not the current one THEN the system SHALL not display it in POS

</content>
