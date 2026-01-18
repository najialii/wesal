# Implementation Plan

## Phase 1: Core Financial Infrastructure

- [ ] 1. Create Money Value Object and Core Financial Models
  - Create Money value object with Halala precision (integer-based)
  - Implement Money arithmetic operations (add, subtract, multiply)
  - Create Account model with hierarchical structure support
  - Create JournalEntry and JournalEntryLine models
  - Add tenant_id to all financial models for multi-tenancy
  - _Requirements: 1.3, 1.4, 1.5_

- [ ] 2. Create Financial Database Migrations
  - Create accounts table migration with parent_id for hierarchy
  - Create journal_entries table migration with void tracking
  - Create journal_entry_lines table migration with debit/credit constraints
  - Add indexes for performance (tenant_id, account_id, entry_date)
  - _Requirements: 1.1, 1.2, 20.1, 20.2_

- [ ] 3. Implement Chart of Accounts Service
  - Create ChartOfAccountsService interface and implementation
  - Implement account creation with validation
  - Implement account hierarchy retrieval
  - Implement account balance calculation from journal entries
  - Add default chart of accounts seeder for new tenants
  - _Requirements: 1.1, 1.2_

- [ ] 4. Implement Journal Entry Service
  - Create JournalEntryService interface and implementation
  - Implement double-entry validation (debits = credits)
  - Implement journal entry creation with atomic transactions
  - Implement void entry functionality with reversing entries
  - Add entry number generation (sequential per tenant)
  - _Requirements: 1.1, 1.2, 20.4_

- [ ] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 2: Transaction Management

- [ ] 6. Implement Transaction Service
  - Create TransactionService interface and implementation
  - Implement recordIncome method with journal entry creation
  - Implement recordExpense method with journal entry creation
  - Implement recordTransfer method for account transfers
  - Add transaction history retrieval with filtering
  - _Requirements: 1.1, 1.2, 10.1, 10.2_

- [ ] 7. Create Transaction API Endpoints
  - Create TransactionController with owner-only middleware
  - Implement POST /api/business/transactions/income endpoint
  - Implement POST /api/business/transactions/expense endpoint
  - Implement POST /api/business/transactions/transfer endpoint
  - Implement GET /api/business/transactions with filters
  - _Requirements: 1.1, 1.2, 10.1, 19.1, 19.2_

- [ ] 8. Create Transaction Frontend Components
  - Create Money display component (converts halalas to SAR)
  - Create TransactionForm component for income/expense entry
  - Create TransactionHistory page with filtering
  - Add transaction search and export functionality
  - Integrate with backend API endpoints
  - _Requirements: 1.3, 10.1, 10.2, 10.3, 10.5_

- [ ] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 3: Cash Management

- [ ] 10. Create Cash Register Models and Migrations
  - Create CashRegister model with tenant relationship
  - Create CashCount and CashCountDenomination models
  - Create cash_registers table migration
  - Create cash_counts table migration with status tracking
  - Create cash_count_denominations table migration
  - _Requirements: 4.1, 5.1_

- [ ] 11. Implement Cash Register Service
  - Create CashRegisterService interface and implementation
  - Implement register creation and balance calculation
  - Implement addCash and removeCash methods with journal entries
  - Implement transferCash between registers
  - Implement cash count workflow (start, record, finalize)
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4_

- [ ] 12. Create Cash Register API Endpoints
  - Create CashRegisterController with owner-only access
  - Implement CRUD endpoints for cash registers
  - Implement POST /api/business/cash-registers/{id}/add-cash
  - Implement POST /api/business/cash-registers/{id}/remove-cash
  - Implement POST /api/business/cash-registers/{id}/transfer
  - Implement cash count endpoints (start, record, finalize)
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.1, 5.5, 19.1_

- [ ] 13. Create Cash Register Frontend Components
  - Create CashRegisterDashboard page showing all registers
  - Create CashCountModal component with denomination entry
  - Create cash transfer modal component
  - Add variance display and adjustment functionality
  - Integrate with backend API endpoints
  - _Requirements: 4.5, 5.2, 5.3, 5.4_

- [ ] 14. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 4: Accounts Receivable/Payable

- [ ] 15. Create AR/AP Models and Migrations
  - Create Receivable model with customer relationship
  - Create Payable model with supplier relationship
  - Create Supplier model (if not exists)
  - Create receivables table migration with status tracking
  - Create payables table migration with status tracking
  - _Requirements: 7.1, 8.1_

- [ ] 16. Implement Receivable/Payable Service
  - Create ReceivablePayableService interface and implementation
  - Implement createReceivable with journal entry
  - Implement createPayable with journal entry
  - Implement recordPayment for both receivables and payables
  - Implement aging report generation
  - Implement overdue items retrieval
  - _Requirements: 7.1, 7.2, 7.3, 7.5, 8.1, 8.2, 8.3, 8.5_

- [ ] 17. Create AR/AP API Endpoints
  - Create ReceivableController with owner-only access
  - Create PayableController with owner-only access
  - Implement CRUD endpoints for receivables
  - Implement CRUD endpoints for payables
  - Implement payment recording endpoints
  - Implement aging report endpoints
  - _Requirements: 7.1, 7.2, 7.4, 8.1, 8.2, 8.4, 19.1_

- [ ] 18. Create AR/AP Frontend Components
  - Create AccountsReceivable page with customer balances
  - Create AccountsPayable page with supplier balances
  - Create payment recording modal component
  - Add overdue highlighting and aging display
  - Integrate with backend API endpoints
  - _Requirements: 7.3, 7.4, 8.3, 8.4_

- [ ] 19. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 5: Salary and Recurring Expenses

- [ ] 20. Create Salary and Recurring Expense Models
  - Create RecurringExpense model with frequency tracking
  - Add salary payment tracking to existing models
  - Create recurring_expenses table migration
  - Create salary_payments table migration (or use transactions)
  - _Requirements: 2.1, 3.1_

- [ ] 21. Implement Salary Payment Service
  - Create SalaryService interface and implementation
  - Implement paySalary method with automatic categorization
  - Implement salary history retrieval by employee
  - Implement monthly salary report generation
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 22. Implement Recurring Expense Service
  - Create RecurringExpenseService interface and implementation
  - Implement recurring expense creation with scheduling
  - Implement due date calculation and reminders
  - Implement payment recording with next occurrence scheduling
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 23. Create Salary and Recurring Expense API Endpoints
  - Create SalaryController with owner-only access
  - Create RecurringExpenseController with owner-only access
  - Implement salary payment endpoints
  - Implement recurring expense CRUD endpoints
  - Implement payment recording and reminder endpoints
  - _Requirements: 2.1, 3.1, 19.1_

- [ ] 24. Create Salary and Recurring Expense Frontend Components
  - Create SalaryPayments page with employee selection
  - Create RecurringExpenses page with due date tracking
  - Create salary payment modal component
  - Create recurring expense form component
  - Add reminder notifications for due expenses
  - _Requirements: 2.3, 2.4, 3.3, 3.4_

- [ ] 25. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 6: Bank Account Management

- [ ] 26. Create Bank Account Models and Migrations
  - Create BankAccount model with tenant relationship
  - Create BankReconciliation model for statement matching
  - Create bank_accounts table migration
  - Create bank_reconciliations table migration
  - _Requirements: 6.1_

- [ ] 27. Implement Bank Account Service
  - Create BankAccountService interface and implementation
  - Implement bank account creation and management
  - Implement deposit and withdrawal with journal entries
  - Implement bank reconciliation workflow
  - Implement transaction verification marking
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 28. Create Bank Account API Endpoints
  - Create BankAccountController with owner-only access
  - Implement CRUD endpoints for bank accounts
  - Implement deposit/withdrawal endpoints
  - Implement reconciliation endpoints
  - _Requirements: 6.1, 6.2, 6.3, 19.1_

- [ ] 29. Create Bank Account Frontend Components
  - Create BankAccounts page with account list
  - Create bank transaction entry modal
  - Create bank reconciliation interface
  - Add transaction verification UI
  - _Requirements: 6.4, 6.5_

- [ ] 30. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 7: Enhanced Inventory System

- [ ] 31. Create Enhanced Inventory Models and Migrations
  - Create InventoryLocation model
  - Create InventoryLevel model with location tracking
  - Create FIFOLayer model for costing
  - Create inventory_locations table migration
  - Create inventory_levels table migration with reorder levels
  - Create fifo_layers table migration
  - Update stock_movements table to include location and running balance
  - _Requirements: 12.1, 13.1, 16.1_

- [ ] 32. Implement Inventory Service
  - Create InventoryService interface and implementation
  - Implement receiveInventory with FIFO layer creation
  - Implement sellInventory with FIFO layer consumption
  - Implement transferInventory between locations
  - Implement adjustInventory with reason tracking
  - Implement inventory level and value retrieval
  - _Requirements: 12.1, 12.2, 12.3, 13.2, 13.3, 14.1_

- [ ] 33. Implement FIFO Service
  - Create FIFOService interface and implementation
  - Implement addLayer for inventory receipts
  - Implement consumeLayers for sales (oldest first)
  - Implement inventory value calculation
  - Implement average cost calculation
  - _Requirements: 16.1, 16.2, 16.3, 16.4_

- [ ] 34. Create Inventory API Endpoints
  - Create InventoryController with owner-only access
  - Implement location CRUD endpoints
  - Implement inventory receive/transfer/adjust endpoints
  - Implement inventory level retrieval endpoints
  - Implement stock movement history endpoints
  - _Requirements: 12.1, 12.5, 13.1, 13.4, 14.2, 14.4, 19.1_

- [ ] 35. Create Inventory Frontend Components
  - Create InventoryLocations page for location management
  - Create InventoryLevels page with multi-location view
  - Create inventory receive/transfer/adjust modals
  - Create StockMovements page with filtering
  - Add low stock alerts and warnings
  - _Requirements: 12.4, 13.4, 13.5, 14.3, 14.5_

- [ ] 36. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 8: Stocktaking

- [ ] 37. Create Stocktaking Models and Migrations
  - Create Stocktaking model with status tracking
  - Create StocktakingCount model for variance tracking
  - Create stocktakings table migration
  - Create stocktaking_counts table migration
  - _Requirements: 15.1_

- [ ] 38. Implement Stocktaking Service
  - Create StocktakingService interface and implementation
  - Implement startStocktaking with system quantity capture
  - Implement recordCount for physical counts
  - Implement calculateVariances between system and actual
  - Implement finalizeStocktaking with auto-adjustment option
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 39. Create Stocktaking API Endpoints
  - Create StocktakingController with owner-only access
  - Implement stocktaking workflow endpoints
  - Implement count recording endpoints
  - Implement variance calculation and finalization endpoints
  - _Requirements: 15.1, 15.5, 19.1_

- [ ] 40. Create Stocktaking Frontend Components
  - Create Stocktaking page with count workflow
  - Create count entry interface with system vs actual
  - Create variance review and adjustment interface
  - Add stocktaking history view
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 41. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 9: POS Integration

- [ ] 42. Update POS to Use Financial System
  - Modify Sale model to store amounts in halalas
  - Update POSController to create journal entries on sale
  - Implement automatic income recording for cash sales
  - Implement automatic receivable creation for credit sales
  - Update sale refund to create reversing journal entries
  - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [ ] 43. Integrate POS with Inventory System
  - Update sale processing to consume FIFO layers
  - Record cost of goods sold in journal entries
  - Update inventory levels on sale completion
  - Link financial transactions to inventory movements
  - _Requirements: 11.5, 17.3_

- [ ] 44. Update POS Frontend for Financial Integration
  - Update POS to display amounts from financial system
  - Add financial transaction links to sale details
  - Show cost of goods sold on sale receipts (optional)
  - _Requirements: 11.4_

- [ ] 45. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 10: Inventory Purchase Integration

- [ ] 46. Create Purchase Models and Migrations
  - Create Purchase model with supplier relationship
  - Create PurchaseItem model for line items
  - Create purchases table migration
  - Create purchase_items table migration
  - _Requirements: 17.1, 17.2_

- [ ] 47. Implement Purchase Service
  - Create PurchaseService interface and implementation
  - Implement createPurchase with inventory and financial updates
  - Implement cash purchase (decrease cash, increase inventory)
  - Implement credit purchase (create payable, increase inventory)
  - Create FIFO layers on inventory receipt
  - _Requirements: 17.1, 17.2, 17.3_

- [ ] 48. Create Purchase API Endpoints
  - Create PurchaseController with owner-only access
  - Implement purchase creation endpoints
  - Implement purchase history endpoints
  - _Requirements: 17.1, 17.2, 19.1_

- [ ] 49. Create Purchase Frontend Components
  - Create Purchases page with purchase history
  - Create purchase entry form with supplier selection
  - Add inventory and financial impact display
  - _Requirements: 17.1, 17.2, 17.5_

- [ ] 50. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 11: Financial Reporting

- [ ] 51. Implement Reporting Service
  - Create ReportingService interface and implementation
  - Implement generateIncomeStatement (profit/loss)
  - Implement generateBalanceSheet (assets, liabilities, equity)
  - Implement generateCashFlowStatement
  - Implement generateTrialBalance
  - Implement generateAccountLedger
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 52. Implement Report Export Functionality
  - Add PDF export using Laravel PDF library
  - Add Excel export using Laravel Excel library
  - Implement report formatting for both formats
  - _Requirements: 9.5_

- [ ] 53. Create Reporting API Endpoints
  - Create ReportController with owner-only access
  - Implement income statement endpoint
  - Implement balance sheet endpoint
  - Implement cash flow statement endpoint
  - Implement trial balance endpoint
  - Implement account ledger endpoint
  - Implement export endpoints (PDF/Excel)
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 19.1_

- [ ] 54. Create Financial Reports Frontend
  - Create Reports page with report type selection
  - Create IncomeStatement component with period selection
  - Create BalanceSheet component with date selection
  - Create CashFlowStatement component
  - Add export buttons for PDF and Excel
  - Add visual charts for key metrics
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 55. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 12: Inventory Reporting

- [ ] 56. Implement Inventory Reporting Service
  - Create InventoryReportingService interface and implementation
  - Implement inventory valuation report
  - Implement stock movement report
  - Implement low stock report
  - Implement inventory by location report
  - _Requirements: 16.3, 16.5_

- [ ] 57. Create Inventory Reporting API Endpoints
  - Create InventoryReportController with owner-only access
  - Implement inventory valuation endpoint
  - Implement stock movement report endpoint
  - Implement low stock alert endpoint
  - _Requirements: 16.3, 16.5, 19.1_

- [ ] 58. Create Inventory Reports Frontend
  - Create InventoryReports page
  - Create inventory valuation display
  - Create stock movement report with filtering
  - Add low stock alerts dashboard widget
  - _Requirements: 16.3, 16.4, 16.5_

- [ ] 59. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 13: Budget Management

- [ ] 60. Create Budget Models and Migrations
  - Create Budget model with account and period tracking
  - Create budgets table migration
  - _Requirements: 18.1_

- [ ] 61. Implement Budget Service
  - Create BudgetService interface and implementation
  - Implement budget creation and management
  - Implement budget vs actual variance calculation
  - Implement budget copy functionality
  - Implement budget warning system
  - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5_

- [ ] 62. Create Budget API Endpoints
  - Create BudgetController with owner-only access
  - Implement budget CRUD endpoints
  - Implement variance report endpoint
  - Implement budget copy endpoint
  - _Requirements: 18.1, 18.3, 18.5, 19.1_

- [ ] 63. Create Budget Frontend Components
  - Create Budgets page with category budgets
  - Create budget entry form
  - Create budget vs actual comparison view
  - Add overspending warnings
  - _Requirements: 18.1, 18.2, 18.3, 18.4_

- [ ] 64. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 14: Audit Trail

- [ ] 65. Implement Audit Trail Service
  - Create AuditTrailService interface and implementation
  - Implement automatic logging for all financial changes
  - Implement automatic logging for all inventory changes
  - Implement audit log retrieval with filtering
  - Implement entity history retrieval
  - _Requirements: 20.1, 20.2, 20.3, 20.5_

- [ ] 66. Add Audit Logging to All Services
  - Add audit logging to TransactionService
  - Add audit logging to CashRegisterService
  - Add audit logging to ReceivablePayableService
  - Add audit logging to InventoryService
  - Add audit logging to all other financial services
  - _Requirements: 20.1, 20.2_

- [ ] 67. Create Audit Trail API Endpoints
  - Create AuditTrailController with owner-only access
  - Implement audit log retrieval endpoint
  - Implement entity history endpoint
  - _Requirements: 20.3, 19.1_

- [ ] 68. Create Audit Trail Frontend Components
  - Create AuditLog page with filtering
  - Create entity history modal
  - Add before/after value comparison display
  - _Requirements: 20.3_

- [ ] 69. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 15: Financial Dashboard

- [ ] 70. Implement Dashboard Service
  - Create DashboardService for aggregated metrics
  - Implement current cash balance calculation
  - Implement today's income/expense calculation
  - Implement month's profit/loss calculation
  - Implement low stock alerts retrieval
  - Implement upcoming bills and receivables retrieval
  - _Requirements: 30.1, 30.2, 30.3, 30.4, 30.5_

- [ ] 71. Create Dashboard API Endpoint
  - Create DashboardController with owner-only access
  - Implement GET /api/business/finance/dashboard endpoint
  - Return all dashboard metrics in single response
  - _Requirements: 30.1, 30.2, 30.3, 30.4, 30.5, 19.1_

- [ ] 72. Create Financial Dashboard Frontend
  - Create FinanceDashboard page
  - Create cash balance KPI card
  - Create today's income/expense cards
  - Create month's profit/loss card
  - Create low stock alerts widget
  - Create upcoming bills/receivables widget
  - _Requirements: 30.1, 30.2, 30.3, 30.4, 30.5_

- [ ] 73. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 16: Access Control and Security

- [ ] 74. Implement Owner-Only Middleware
  - Create OwnerOnlyMiddleware for financial routes
  - Verify user is business owner (not staff/technician)
  - Add clear access denied messages
  - Log unauthorized access attempts
  - _Requirements: 19.1, 19.2, 19.4_

- [ ] 75. Apply Middleware to All Financial Routes
  - Apply OwnerOnlyMiddleware to all financial API routes
  - Apply OwnerOnlyMiddleware to all inventory API routes
  - Ensure all sensitive endpoints are protected
  - _Requirements: 19.1, 19.5_

- [ ] 76. Add Frontend Access Control
  - Hide financial menu items from non-owners
  - Add route guards for financial pages
  - Show access denied message if non-owner tries to access
  - _Requirements: 19.2, 19.3_

- [ ] 77. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 17: Internationalization

- [ ] 78. Add Financial Translation Keys
  - Add English translations for all financial terms
  - Add Arabic translations for all financial terms
  - Add translations for reports and statements
  - Add translations for error messages
  - _Requirements: 29.1, 29.3_

- [ ] 79. Update Frontend for RTL Support
  - Ensure all financial components support RTL layout
  - Test Arabic display for all financial pages
  - Ensure number formatting works in both languages
  - _Requirements: 29.2, 29.4, 29.5_

- [ ] 80. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 18: Testing and Documentation

- [ ] 81. Create Integration Tests
  - Test complete sale flow (POS → Finance → Inventory)
  - Test complete purchase flow (Purchase → Finance → Inventory)
  - Test cash register workflow
  - Test receivable/payable workflows
  - Test stocktaking workflow
  - _Requirements: All_

- [ ] 82. Create User Documentation
  - Create user guide for financial features
  - Create user guide for inventory features
  - Create troubleshooting guide
  - Create video tutorials (optional)
  - _Requirements: All_

- [ ] 83. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
