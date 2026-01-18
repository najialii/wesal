# Requirements Document

## Introduction

This specification defines the refinement and restructuring of the existing Maintenance & Contracts module to follow enterprise best practices (similar to Odoo/Salesforce). The goal is to improve clarity and separation of concerns between Contracts (agreements), Scheduled Visits (planning layer), and Actual Visits (execution layer) while preserving all existing functionality, data, and backward compatibility.

**Critical Constraints:**
- NO new database tables
- NO renaming of existing tables or columns
- NO deletion of existing logic
- NO breaking changes to existing APIs
- Existing migrations MAY be edited if needed
- ONLY service-layer refactoring and UI/UX improvements using existing tables

## Glossary

- **Contract**: A maintenance agreement with a customer defining duration, visit frequency, and total allowed visits
- **Scheduled Visit**: A planned maintenance visit derived from a contract's frequency settings
- **Actual Visit**: The execution record of work performed by a technician
- **Tenant**: A business owner organization using the system
- **Branch**: A physical location within a tenant's organization
- **Technician**: A field worker who performs maintenance visits
- **Salesman**: A staff member who manages contracts and customer relationships
- **SLA**: Service Level Agreement defining performance expectations

## Requirements

### Requirement 1: Contract Management (Agreement Layer)

**User Story:** As a business owner, I want to manage maintenance contracts as pure agreements, so that I can track customer commitments separately from execution details.

#### Acceptance Criteria

1. WHEN a user views a contract THEN the System SHALL display contract metadata (duration, frequency, total visits, value) without mixing execution data
2. WHEN a contract is created THEN the System SHALL calculate and display the total number of visits based on frequency and duration
3. WHEN a contract status changes THEN the System SHALL preserve the status history and update related scheduled visits accordingly
4. WHILE a contract is active THEN the System SHALL display remaining visits count and contract health indicators
5. WHEN a contract approaches expiration (within 30 days) THEN the System SHALL flag the contract as "expiring soon" in the UI

### Requirement 2: Scheduled Visit Generation (Planning Layer)

**User Story:** As a business owner, I want scheduled visits to be auto-generated from contracts, so that I can plan maintenance work without manual scheduling.

#### Acceptance Criteria

1. WHEN a contract is activated THEN the System SHALL generate scheduled visits based on the contract's frequency settings
2. WHEN generating scheduled visits THEN the System SHALL ensure idempotent generation (no duplicate visits for the same scheduled date)
3. WHEN a scheduled visit is rescheduled THEN the System SHALL update only the visit date without affecting the contract or other visits
4. WHILE a scheduled visit is pending THEN the System SHALL allow status changes to: pending, rescheduled, cancelled
5. WHEN a contract is paused or cancelled THEN the System SHALL mark all future scheduled visits as cancelled

### Requirement 3: Actual Visit Execution (Execution Layer)

**User Story:** As a technician, I want to record actual visit details separately from scheduled visits, so that I can document work performed accurately.

#### Acceptance Criteria

1. WHEN a technician starts a visit THEN the System SHALL record the actual start time and change status to "in_progress"
2. WHEN a technician completes a visit THEN the System SHALL record completion details (notes, parts used, timestamps, result)
3. WHEN recording visit results THEN the System SHALL support outcomes: completed, failed, no_access
4. WHEN parts are used during a visit THEN the System SHALL deduct from inventory and record costs
5. WHEN a visit is completed THEN the System SHALL automatically schedule the next visit based on contract frequency

### Requirement 4: Responsive Enterprise UI for All Roles

**User Story:** As any user (business owner, salesman, or technician), I want a responsive enterprise-grade interface that works seamlessly on tablets and mobile devices, so that I can work efficiently from any device.

#### Acceptance Criteria

1. WHEN displaying on any device THEN the System SHALL provide responsive layouts optimized for tablet-first with mobile support
2. WHEN displaying interactive elements THEN the System SHALL use large touch targets (minimum 44x44 pixels) across all roles
3. WHEN switching between devices THEN the System SHALL maintain consistent functionality and data visibility
4. WHEN displaying the UI THEN the System SHALL use enterprise SaaS styling (clean alignment, minimal rounded corners, Odoo/Salesforce style)
5. WHEN switching languages THEN the System SHALL maintain stable layout for both RTL (Arabic) and LTR (English)

### Requirement 5: Technician Field Interface

**User Story:** As a technician, I want a field-optimized interface with quick access to today's visits, so that I can efficiently manage my work in the field.

#### Acceptance Criteria

1. WHEN a technician opens the dashboard THEN the System SHALL display today's visits prominently with one-click access
2. WHEN displaying visit cards THEN the System SHALL use icon-based actions with minimal text for quick scanning
3. WHEN a technician views a visit THEN the System SHALL display customer contact info with tap-to-call functionality
4. WHILE offline THEN the System SHALL cache visit data and queue actions for sync when online
5. WHEN completing a visit THEN the System SHALL provide a streamlined form with minimal required fields

### Requirement 6: Salesman Contract Management Interface

**User Story:** As a salesman, I want a quick contract overview with remaining visits indicator, so that I can manage customer relationships effectively.

#### Acceptance Criteria

1. WHEN a salesman views contracts THEN the System SHALL display remaining visits as a visual progress indicator
2. WHEN viewing a contract THEN the System SHALL show a simple schedule preview of upcoming visits
3. WHEN a contract has low remaining visits (less than 20%) THEN the System SHALL highlight the contract for renewal attention
4. WHEN filtering contracts THEN the System SHALL support filters by status, customer, and expiration date
5. WHEN viewing contract details THEN the System SHALL display visit completion rate and customer satisfaction metrics

### Requirement 7: Business Owner Dashboard Interface

**User Story:** As a business owner, I want a comprehensive dashboard with contract health overview, so that I can monitor service quality and performance.

#### Acceptance Criteria

1. WHEN viewing the dashboard THEN the System SHALL display contract health metrics (active, expiring, overdue visits)
2. WHEN viewing the calendar THEN the System SHALL show all scheduled visits across branches with color-coded status
3. WHEN viewing SLA indicators THEN the System SHALL display on-time completion rate and average response time
4. WHEN filtering by branch THEN the System SHALL scope all metrics and visits to the selected branch
5. WHEN viewing performance metrics THEN the System SHALL display technician productivity and customer satisfaction scores

### Requirement 8: Consistent Design System

**User Story:** As a user, I want consistent visual design across all interfaces, so that I can navigate the system intuitively.

#### Acceptance Criteria

1. WHEN displaying status indicators THEN the System SHALL use consistent, meaningful colors across all views
2. WHEN displaying data tables THEN the System SHALL use consistent spacing, typography, and alignment
3. WHEN displaying cards and panels THEN the System SHALL use consistent border radius, shadows, and padding
4. WHEN displaying forms THEN the System SHALL use consistent input styling and validation feedback
5. WHEN displaying navigation THEN the System SHALL use consistent iconography and menu patterns

### Requirement 9: Service Layer Refactoring

**User Story:** As a developer, I want clear separation of concerns in the service layer, so that the codebase is maintainable and extensible.

#### Acceptance Criteria

1. WHEN processing contract operations THEN the System SHALL use a dedicated ContractService for business logic
2. WHEN generating scheduled visits THEN the System SHALL use a dedicated VisitSchedulingService with idempotent generation
3. WHEN processing visit execution THEN the System SHALL use a dedicated VisitExecutionService for technician actions
4. WHEN calculating metrics THEN the System SHALL use a dedicated MaintenanceAnalyticsService for reporting
5. WHEN handling errors THEN the System SHALL provide meaningful error messages without exposing internal details

### Requirement 10: Backward Compatibility

**User Story:** As a system administrator, I want all existing functionality to continue working, so that current users are not disrupted.

#### Acceptance Criteria

1. WHEN existing APIs are called THEN the System SHALL return responses in the same format as before
2. WHEN existing data is accessed THEN the System SHALL preserve all relationships and computed values
3. WHEN existing workflows are executed THEN the System SHALL maintain the same behavior and outcomes
4. WHEN new services are added THEN the System SHALL not modify existing database schema
5. WHEN refactoring controllers THEN the System SHALL preserve all existing route signatures and parameters
