# Design Document

## Overview

This design document outlines the technical approach for refining and restructuring the existing Maintenance & Contracts module to follow enterprise best practices. The solution maintains clear separation of concerns between Contracts (agreements), Scheduled Visits (planning layer), and Actual Visits (execution layer) while preserving all existing functionality and data.

The design leverages existing database tables and focuses on service-layer refactoring and UI/UX improvements to create an enterprise-grade maintenance workflow similar to Odoo/Salesforce.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
├─────────────────┬─────────────────┬─────────────────────────┤
│  Business Owner │    Salesman     │      Technician         │
│   Dashboard     │   Contract      │    Field Interface      │
│                 │   Management    │                         │
└─────────────────┴─────────────────┴─────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                            │
├─────────────────┬─────────────────┬─────────────────────────┤
│ ContractService │SchedulingService│ ExecutionService        │
│                 │                 │                         │
│ - Contract CRUD │ - Visit         │ - Visit Execution       │
│ - Health Metrics│   Generation    │ - Parts Management      │
│ - SLA Tracking  │ - Idempotent    │ - Status Updates        │
│                 │   Scheduling    │                         │
└─────────────────┴─────────────────┴─────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                               │
├─────────────────┬─────────────────┬─────────────────────────┤
│ MaintenanceContract │ MaintenanceVisit │ MaintenanceVisitItem │
│ MaintenanceContractItem │ MaintenanceSchedule │ Product      │
└─────────────────┴─────────────────┴─────────────────────────┘
```

### Service Layer Architecture

The refactored architecture introduces dedicated services for clear separation of concerns:

1. **ContractService**: Manages contract lifecycle and business logic
2. **VisitSchedulingService**: Handles visit generation and scheduling logic
3. **VisitExecutionService**: Manages technician workflow and visit completion
4. **MaintenanceAnalyticsService**: Provides metrics and reporting

## Components and Interfaces

### Backend Services

#### ContractService
```php
class ContractService
{
    public function createContract(array $data): MaintenanceContract
    public function updateContract(int $id, array $data): MaintenanceContract
    public function getContractHealth(int $contractId): array
    public function getExpiringContracts(int $days = 30): Collection
    public function calculateRemainingVisits(int $contractId): int
    public function getContractMetrics(int $contractId): array
}
```

#### VisitSchedulingService
```php
class VisitSchedulingService
{
    public function generateScheduledVisits(MaintenanceContract $contract): Collection
    public function rescheduleVisit(int $visitId, Carbon $newDate): MaintenanceVisit
    public function cancelFutureVisits(int $contractId): int
    public function getUpcomingVisits(int $days = 7): Collection
    private function ensureIdempotentGeneration(MaintenanceContract $contract): void
}
```

#### VisitExecutionService
```php
class VisitExecutionService
{
    public function startVisit(int $visitId, int $technicianId): MaintenanceVisit
    public function completeVisit(int $visitId, array $data): MaintenanceVisit
    public function recordPartsUsed(int $visitId, array $parts): void
    public function updateVisitStatus(int $visitId, string $status): MaintenanceVisit
    public function getTechnicianVisits(int $technicianId, ?string $status = null): Collection
}
```

#### MaintenanceAnalyticsService
```php
class MaintenanceAnalyticsService
{
    public function getContractHealthMetrics(): array
    public function getSLAMetrics(): array
    public function getTechnicianPerformance(): array
    public function getVisitCompletionRates(): array
    public function getBranchMetrics(int $branchId): array
}
```

### Frontend Components

#### Responsive UI Components
- **ContractHealthCard**: Displays contract status with visual indicators
- **VisitCalendar**: Enterprise calendar with color-coded status
- **TechnicianDashboard**: Mobile-optimized with large touch targets
- **SalesmanOverview**: Contract management with remaining visits indicator
- **BusinessOwnerMetrics**: SLA and performance dashboard

## Data Models

### Existing Tables (No Changes)

The design leverages existing tables without modifications:

- `maintenance_contracts`: Contract agreements and terms
- `maintenance_visits`: Both scheduled and actual visits
- `maintenance_contract_items`: Products included in contracts
- `maintenance_visit_items`: Parts used during visits
- `maintenance_schedules`: Legacy scheduling data (maintained for compatibility)

### Data Relationships

```
MaintenanceContract (1) ──── (N) MaintenanceVisit
       │                           │
       │                           │
       └── (N) MaintenanceContractItem
                                   │
                                   └── (N) MaintenanceVisitItem
```

### Status Flow

#### Contract Status Flow
```
draft → active → paused → completed/cancelled
```

#### Visit Status Flow
```
scheduled → in_progress → completed
    │            │
    └── rescheduled
    └── cancelled
    └── missed
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Contract Visit Generation Idempotency
*For any* active maintenance contract, generating scheduled visits multiple times should produce the same set of visits without duplicates for the same scheduled dates.
**Validates: Requirements 2.2**

### Property 2: Visit Status Consistency
*For any* maintenance visit, the status transitions should follow the defined flow (scheduled → in_progress → completed) and invalid transitions should be rejected.
**Validates: Requirements 3.2**

### Property 3: Contract Health Calculation
*For any* maintenance contract, the remaining visits count should equal the total planned visits minus completed visits.
**Validates: Requirements 1.4**

### Property 4: Technician Assignment Validation
*For any* visit assignment, the assigned technician should have access to the branch where the visit is scheduled.
**Validates: Requirements 3.1**

### Property 5: Parts Inventory Consistency
*For any* completed visit with parts used, the inventory should be decremented by the exact quantity used.
**Validates: Requirements 3.4**

### Property 6: Contract Expiration Handling
*For any* expired or cancelled contract, all future scheduled visits should be automatically cancelled.
**Validates: Requirements 2.5**

### Property 7: Visit Scheduling Frequency Compliance
*For any* contract with defined frequency, the generated visits should match the frequency pattern within the contract duration.
**Validates: Requirements 2.1**

### Property 8: UI Responsiveness Consistency
*For any* screen size (mobile, tablet, desktop), all interactive elements should maintain minimum touch target size of 44x44 pixels.
**Validates: Requirements 4.2**

### Property 9: RTL/LTR Layout Stability
*For any* language switch between Arabic (RTL) and English (LTR), the layout should maintain consistent spacing and alignment.
**Validates: Requirements 4.5**

### Property 10: API Backward Compatibility
*For any* existing API endpoint, the response format should remain unchanged after refactoring.
**Validates: Requirements 10.1**

## Error Handling

### Service Layer Error Handling

```php
class MaintenanceException extends Exception
{
    public static function contractNotFound(int $id): self
    public static function visitCannotBeStarted(string $reason): self
    public static function insufficientParts(string $part, int $required, int $available): self
    public static function invalidStatusTransition(string $from, string $to): self
}
```

### Frontend Error Handling

- **Network Errors**: Retry mechanism with exponential backoff
- **Validation Errors**: Inline field validation with clear messaging
- **Permission Errors**: Graceful degradation with appropriate messaging
- **Offline Handling**: Cache critical data for technician workflow

## Testing Strategy

### Unit Testing Approach

Unit tests will focus on:
- Service method behavior with specific inputs
- Edge cases for contract and visit state transitions
- Validation logic for business rules
- Error handling scenarios

### Property-Based Testing Approach

Property-based tests will verify:
- Universal properties across all valid inputs
- Invariants that must hold regardless of data
- State consistency after operations
- UI behavior across different screen sizes and languages

**Testing Framework**: PHPUnit for backend, Jest/React Testing Library for frontend
**Property Testing Library**: Pest Property Testing for PHP, fast-check for TypeScript
**Test Configuration**: Minimum 100 iterations per property test

Each property-based test will be tagged with comments referencing the design document:
```php
/**
 * Feature: maintenance-workflow-refinement, Property 1: Contract Visit Generation Idempotency
 */
public function test_contract_visit_generation_is_idempotent()
```

### Integration Testing

- API endpoint testing with existing contract scenarios
- Database transaction testing for complex operations
- Cross-service communication testing
- Branch context isolation testing

## UI/UX Design Specifications

### Enterprise Design System

#### Color Palette
- **Primary**: #4F46E5 (Indigo) - Actions, links, primary buttons
- **Success**: #10B981 (Emerald) - Completed status, success states
- **Warning**: #F59E0B (Amber) - Pending status, warnings
- **Error**: #EF4444 (Red) - Failed status, errors
- **Neutral**: #6B7280 (Gray) - Text, borders, backgrounds

#### Typography
- **Headings**: Inter font family, semibold weight
- **Body**: Inter font family, regular weight
- **Code**: JetBrains Mono for technical content

#### Spacing System
- **Base unit**: 4px
- **Component padding**: 16px (4 units)
- **Section margins**: 24px (6 units)
- **Page margins**: 32px (8 units)

### Role-Specific UI Patterns

#### Business Owner Dashboard
- **Layout**: Grid-based with KPI cards
- **Navigation**: Sidebar with collapsible sections
- **Charts**: Clean line charts and bar graphs
- **Tables**: Sortable with pagination
- **Filters**: Dropdown and date range selectors

#### Salesman Interface
- **Layout**: List-based with quick actions
- **Cards**: Contract cards with progress indicators
- **Search**: Prominent search bar with filters
- **Actions**: Inline action buttons
- **Modals**: Form modals for quick edits

#### Technician Interface
- **Layout**: Card-based for mobile optimization
- **Touch Targets**: Minimum 44x44px buttons
- **Navigation**: Bottom tab navigation
- **Actions**: Large, icon-based action buttons
- **Forms**: Simplified with minimal required fields

### Responsive Breakpoints

```css
/* Mobile First Approach */
.container {
  /* Mobile: 320px - 767px */
  padding: 16px;
}

@media (min-width: 768px) {
  /* Tablet: 768px - 1023px */
  .container {
    padding: 24px;
    max-width: 1024px;
  }
}

@media (min-width: 1024px) {
  /* Desktop: 1024px+ */
  .container {
    padding: 32px;
    max-width: 1200px;
  }
}
```

### RTL/LTR Support

```css
/* Directional Properties */
.card {
  margin-inline-start: 16px;
  padding-inline: 20px;
  border-inline-start: 2px solid var(--primary);
}

/* Icon Rotation for RTL */
.icon-chevron {
  transform: rotate(0deg);
}

[dir="rtl"] .icon-chevron {
  transform: rotate(180deg);
}
```

## Performance Considerations

### Backend Optimizations

- **Database Indexing**: Ensure proper indexes on frequently queried fields
- **Query Optimization**: Use eager loading for related models
- **Caching**: Implement Redis caching for frequently accessed data
- **Pagination**: Implement cursor-based pagination for large datasets

### Frontend Optimizations

- **Code Splitting**: Lazy load route components
- **Image Optimization**: Use WebP format with fallbacks
- **Bundle Size**: Tree shaking and dynamic imports
- **Caching**: Service worker for offline functionality

## Security Considerations

### Data Access Control

- **Tenant Isolation**: Ensure all queries are scoped to user's tenant
- **Branch Access**: Validate user has access to requested branch
- **Role-Based Permissions**: Enforce role-based access controls
- **API Rate Limiting**: Implement rate limiting for API endpoints

### Input Validation

- **Server-Side Validation**: Validate all inputs on the server
- **SQL Injection Prevention**: Use parameterized queries
- **XSS Prevention**: Sanitize all user inputs
- **CSRF Protection**: Implement CSRF tokens for forms

## Migration Strategy

### Phase 1: Service Layer Refactoring
1. Create new service classes
2. Migrate business logic from controllers to services
3. Add comprehensive tests for services
4. Update controllers to use services

### Phase 2: UI Component Updates
1. Create new responsive components
2. Implement enterprise design system
3. Add RTL/LTR support
4. Update existing pages to use new components

### Phase 3: Performance Optimization
1. Add database indexes
2. Implement caching layer
3. Optimize frontend bundle
4. Add monitoring and logging

### Phase 4: Testing and Validation
1. Run comprehensive test suite
2. Perform user acceptance testing
3. Load testing for performance validation
4. Security audit and penetration testing

## Deployment Considerations

### Environment Configuration

- **Development**: Full debugging enabled, test data
- **Staging**: Production-like environment for testing
- **Production**: Optimized configuration, monitoring enabled

### Monitoring and Logging

- **Application Logs**: Structured logging with correlation IDs
- **Performance Metrics**: Response times, error rates
- **Business Metrics**: Contract health, visit completion rates
- **Alerts**: Automated alerts for critical issues

### Rollback Strategy

- **Database**: No schema changes, safe rollback
- **Code**: Feature flags for gradual rollout
- **Assets**: Versioned asset deployment
- **Configuration**: Environment-specific configurations

This design maintains backward compatibility while providing a solid foundation for enterprise-grade maintenance workflow management.