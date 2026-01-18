# Design Document

## Overview

This design covers two separate but integrated systems for business owners in the WesalTech platform:

1. **Financial Management System**: A professional-grade accounting solution implementing double-entry bookkeeping with all monetary values stored as 64-bit integers representing Halalas (1 SAR = 100 Halalas) to eliminate rounding errors. Handles all money-related operations including transactions, cash registers, accounts receivable/payable, bank reconciliation, and financial reporting.

2. **Inventory Management System**: A comprehensive stock tracking solution managing product quantities, locations, movements, FIFO costing, and physical stocktaking. Integrates with the financial system for purchase and sale transactions but operates independently for stock movements and location tracking.

Both systems maintain separate audit trails and are accessible exclusively to business owners. The financial system is the source of truth for all monetary values, while the inventory system is the source of truth for all quantity and location data.

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Presentation Layer                                │
│           (React Components - Business Owner Only Access)               │
│                                                                          │
│  ┌──────────────────────────┐    ┌──────────────────────────┐         │
│  │   Financial Module       │    │   Inventory Module       │         │
│  │  - Dashboard             │    │  - Stock Levels          │         │
│  │  - Transactions          │    │  - Stock Movements       │         │
│  │  - Cash Registers        │    │  - Locations             │         │
│  │  - AR/AP                 │    │  - Stocktaking           │         │
│  │  - Reports               │    │  - FIFO Layers           │         │
│  │  - Bank Reconciliation   │    │  - Inventory Reports     │         │
│  └──────────────────────────┘    └──────────────────────────┘         │
└────────────────┬──────────────────────────────┬──────────────────────────┘
                 │                              │
┌────────────────┴──────────────┐  ┌───────────┴──────────────────────────┐
│   Financial System (Laravel)  │  │   Inventory System (Laravel)         │
│                                │  │                                      │
│  ┌──────────────────────────┐ │  │  ┌────────────────────────────────┐ │
│  │  Accounting Engine       │ │  │  │  Stock Management Engine       │ │
│  │  - Double-Entry Logic    │ │  │  │  - Quantity Tracking           │ │
│  │  - Journal Entries       │ │  │  │  - Location Management         │ │
│  │  - Balance Calculation   │ │  │  │  - Movement Recording          │ │
│  │  - Money Operations      │ │  │  │  - FIFO Costing                │ │
│  └──────────────────────────┘ │  │  └────────────────────────────────┘ │
│                                │  │                                      │
│  Services:                     │  │  Services:                           │
│  - Chart of Accounts           │  │  - Inventory Levels                  │
│  - Transactions                │  │  - Stock Movements                   │
│  - Cash Registers              │  │  - FIFO Layers                       │
│  - AR/AP                       │  │  - Stocktaking                       │
│  - Bank Reconciliation         │  │  - Location Management               │
│  - Reporting                   │  │  - Inventory Reporting               │
│  - Budgets                     │  │                                      │
│  - Audit Trail                 │  │  - Audit Trail                       │
└────────────────┬───────────────┘  └───────────┬──────────────────────────┘
                 │                              │
                 │    Integration Points:       │
                 │    - POS Sales               │
                 │    - Inventory Purchases     │
                 │    - Inventory Adjustments   │
                 │                              │
┌────────────────┴──────────────────────────────┴──────────────────────────┐
│                          Data Layer (MySQL)                               │
│                                                                           │
│  Financial Tables:              Inventory Tables:                        │
│  - accounts                     - inventory_locations                    │
│  - journal_entries              - inventory_levels                       │
│  - journal_entry_lines          - stock_movements                        │
│  - cash_registers               - fifo_layers                            │
│  - cash_counts                  - stocktakings                           │
│  - receivables                  - stocktaking_counts                     │
│  - payables                                                              │
│  - budgets                      Shared:                                  │
│  - audit_trail (financial)      - audit_trail (inventory)                │
└───────────────────────────────────────────────────────────────────────────┘
```

### Key Architectural Principles

#### Financial System Principles

1. **Monetary Precision**: All amounts stored as BIGINT (Halalas), never as DECIMAL or FLOAT
2. **Double-Entry Integrity**: Every financial transaction creates balanced journal entries (debits = credits)
3. **Immutability**: Financial records are never deleted, only voided with reversing entries
4. **Atomicity**: All multi-step financial operations use database transactions
5. **Separation of Concerns**: Financial system handles money, not quantities
6. **Audit Trail**: Every financial change is logged with timestamp, user, and before/after values

#### Inventory System Principles

1. **Quantity Precision**: All quantities stored as DECIMAL(15,4) for fractional units
2. **Location Tracking**: Every inventory item has a specific location
3. **Movement History**: All quantity changes are recorded as stock movements
4. **FIFO Costing**: Inventory valuation uses First-In-First-Out method
5. **Separation of Concerns**: Inventory system handles quantities and locations, not money
6. **Audit Trail**: Every inventory change is logged with timestamp, user, and before/after values

#### Integration Principles

1. **Loose Coupling**: Systems communicate through well-defined integration points
2. **Event-Driven**: Inventory events (purchase, sale) trigger financial transactions
3. **Consistency**: Both systems must agree on product references and transaction links
4. **Independence**: Each system can operate independently for its core functions
5. **Role-Based Access**: Only business owners can access both systems

## Components and Interfaces

### Backend Components (Laravel/PHP)

#### 1. Money Value Object

Handles all monetary operations with Halala precision.

```php
class Money
{
    private int $halalas; // Stored as integer
    
    public static function fromRiyals(float $riyals): self
    public static function fromHalalas(int $halalas): self
    public function toHalalas(): int
    public function toRiyals(): float
    public function format(): string // Returns "X.XX SAR"
    public function add(Money $other): Money
    public function subtract(Money $other): Money
    public function multiply(int $factor): Money
    public function isPositive(): bool
    public function isNegative(): bool
    public function equals(Money $other): bool
}
```

#### 2. Chart of Accounts Service

Manages the hierarchical account structure.

```php
interface ChartOfAccountsService
{
    public function getAccount(string $accountCode): Account;
    public function createAccount(string $code, string $name, AccountType $type, ?string $parentCode): Account;
    public function getAccountsByType(AccountType $type): Collection;
    public function getAccountHierarchy(): array;
    public function canDeleteAccount(string $accountCode): bool;
    public function getAccountBalance(string $accountCode, ?Carbon $asOfDate = null): Money;
}
```

#### 3. Journal Entry Service

Creates and validates double-entry journal entries.

```php
interface JournalEntryService
{
    public function createEntry(
        Carbon $date,
        string $description,
        array $lines, // [{account_code, debit?, credit?, memo?}]
        ?string $referenceType = null,
        ?int $referenceId = null
    ): JournalEntry;
    
    public function voidEntry(int $entryId, string $reason): JournalEntry;
    public function getEntriesByAccount(string $accountCode, Carbon $from, Carbon $to): Collection;
    public function validateBalance(array $lines): bool; // debits == credits
}
```

#### 4. Transaction Service

High-level financial transaction operations.

```php
interface TransactionService
{
    public function recordIncome(Money $amount, string $incomeAccount, string $assetAccount, string $description): Transaction;
    public function recordExpense(Money $amount, string $expenseAccount, string $assetAccount, string $description): Transaction;
    public function recordTransfer(Money $amount, string $fromAccount, string $toAccount, string $description): Transaction;
    public function recordSale(Sale $sale): Transaction; // From POS integration
    public function recordPurchase(Purchase $purchase): Transaction;
    public function getTransactionHistory(array $filters): Collection;
}
```

#### 5. Cash Register Service

Manages physical cash locations.

```php
interface CashRegisterService
{
    public function createRegister(string $name, string $location, string $cashAccountCode): CashRegister;
    public function getRegisterBalance(int $registerId): Money;
    public function addCash(int $registerId, Money $amount, string $description): Transaction;
    public function removeCash(int $registerId, Money $amount, string $description): Transaction;
    public function transferCash(int $fromRegisterId, int $toRegisterId, Money $amount): Transaction;
    public function startCashCount(int $registerId): CashCount;
    public function recordDenomination(int $countId, Money $denomination, int $quantity): void;
    public function finalizeCashCount(int $countId, string $varianceReason): CashCount;
}
```

#### 6. Accounts Receivable/Payable Service

Manages customer and supplier balances.

```php
interface ReceivablePayableService
{
    public function createReceivable(int $customerId, Money $amount, Carbon $dueDate, string $invoiceNumber): Receivable;
    public function recordPayment(int $receivableId, Money $amount, string $paymentMethod): Transaction;
    public function getCustomerBalance(int $customerId): Money;
    public function getAgingReport(string $type): array; // 'receivable' or 'payable'
    public function getOverdueItems(string $type): Collection;
}
```

#### 7. Inventory Service

Manages inventory quantities and locations.

```php
interface InventoryService
{
    public function receiveInventory(int $productId, int $locationId, float $quantity, Money $unitCost): StockMovement;
    public function sellInventory(int $productId, int $locationId, float $quantity): array; // Returns FIFO layers consumed
    public function transferInventory(int $productId, int $fromLocationId, int $toLocationId, float $quantity): StockMovement;
    public function adjustInventory(int $productId, int $locationId, float $quantityChange, string $reason): StockMovement;
    public function getInventoryLevel(int $productId, ?int $locationId = null): float;
    public function getInventoryValue(int $productId): Money;
    public function getStockMovements(array $filters): Collection;
}
```

#### 8. FIFO Service

Manages FIFO inventory costing.

```php
interface FIFOService
{
    public function addLayer(int $productId, int $locationId, float $quantity, Money $unitCost): FIFOLayer;
    public function consumeLayers(int $productId, int $locationId, float $quantity): array; // Returns [{layer, quantity_consumed, cost}]
    public function getLayersByProduct(int $productId): Collection;
    public function calculateInventoryValue(int $productId): Money;
    public function calculateAverageCost(int $productId): Money;
}
```

#### 9. Stocktaking Service

Manages physical inventory counts.

```php
interface StocktakingService
{
    public function startStocktaking(string $name, ?int $locationId = null): Stocktaking;
    public function recordCount(int $stocktakingId, int $productId, int $locationId, float $countedQuantity): void;
    public function calculateVariances(int $stocktakingId): array;
    public function finalizeStocktaking(int $stocktakingId, bool $autoAdjust = true): Stocktaking;
    public function getStocktakingHistory(): Collection;
}
```

#### 10. Reporting Service

Generates financial reports.

```php
interface ReportingService
{
    public function generateIncomeStatement(Carbon $from, Carbon $to): array;
    public function generateBalanceSheet(Carbon $asOfDate): array;
    public function generateCashFlowStatement(Carbon $from, Carbon $to): array;
    public function generateTrialBalance(Carbon $asOfDate): array;
    public function generateAccountLedger(string $accountCode, Carbon $from, Carbon $to): array;
    public function exportReport(string $reportType, array $data, string $format): string; // 'pdf' or 'excel'
}
```

#### 11. Audit Trail Service

Maintains immutable audit log.

```php
interface AuditTrailService
{
    public function log(string $entity, int $entityId, string $action, ?array $before, ?array $after): void;
    public function getAuditLog(array $filters): Collection;
    public function getEntityHistory(string $entity, int $entityId): Collection;
}
```

#### 12. Budget Service

Manages budgets and variance tracking.

```php
interface BudgetService
{
    public function createBudget(string $accountCode, int $fiscalYear, int $period, Money $amount): Budget;
    public function getBudgetVariance(string $accountCode, int $fiscalYear, int $period): array; // {budget, actual, variance}
    public function copyBudget(int $fromYear, int $toYear, float $adjustmentFactor = 1.0): void;
    public function getBudgetReport(int $fiscalYear): array;
}
```

### Frontend Components (React/TypeScript)

#### 1. Money Display Component

```typescript
interface MoneyProps {
  halalas: number;
  showCurrency?: boolean;
  className?: string;
}

function Money({ halalas, showCurrency = true, className }: MoneyProps): JSX.Element
```

#### 2. Transaction Entry Form

```typescript
interface TransactionFormProps {
  type: 'income' | 'expense' | 'transfer';
  onSubmit: (transaction: TransactionData) => Promise<void>;
  accounts: Account[];
}

function TransactionForm(props: TransactionFormProps): JSX.Element
```

#### 3. Journal Entry Viewer

```typescript
interface JournalEntryViewerProps {
  entryId: number;
  showRelated?: boolean;
}

function JournalEntryViewer(props: JournalEntryViewerProps): JSX.Element
```

#### 4. Cash Register Dashboard

```typescript
interface CashRegisterDashboardProps {
  registers: CashRegister[];
  onStartCount: (registerId: number) => void;
  onTransfer: (from: number, to: number, amount: number) => void;
}

function CashRegisterDashboard(props: CashRegisterDashboardProps): JSX.Element
```

#### 5. Cash Count Modal

```typescript
interface CashCountModalProps {
  register: CashRegister;
  systemBalance: number; // in halalas
  onComplete: (countData: CashCountData) => Promise<void>;
}

function CashCountModal(props: CashCountModalProps): JSX.Element
```

#### 6. Financial Reports Dashboard

```typescript
interface ReportsDashboardProps {
  onGenerateReport: (type: ReportType, params: ReportParams) => Promise<void>;
}

function ReportsDashboard(props: ReportsDashboardProps): JSX.Element
```

#### 7. Inventory Management Page

```typescript
interface InventoryManagementProps {
  products: Product[];
  locations: Location[];
  onReceive: (data: ReceiveInventoryData) => Promise<void>;
  onTransfer: (data: TransferInventoryData) => Promise<void>;
  onAdjust: (data: AdjustInventoryData) => Promise<void>;
}

function InventoryManagement(props: InventoryManagementProps): JSX.Element
```

#### 8. Stocktaking Page

```typescript
interface StocktakingPageProps {
  onStartStocktaking: (name: string, locationId?: number) => Promise<number>;
  onRecordCount: (stocktakingId: number, counts: CountData[]) => Promise<void>;
  onFinalize: (stocktakingId: number) => Promise<void>;
}

function StocktakingPage(props: StocktakingPageProps): JSX.Element
```

#### 9. Accounts Receivable/Payable Page

```typescript
interface ARAPPageProps {
  type: 'receivable' | 'payable';
  items: ARAPItem[];
  onRecordPayment: (itemId: number, amount: number) => Promise<void>;
}

function ARAPPage(props: ARAPPageProps): JSX.Element
```

## Data Models

### Database Schema

#### accounts

```sql
CREATE TABLE accounts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT UNSIGNED NOT NULL,
    code VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type ENUM('asset', 'liability', 'equity', 'revenue', 'expense') NOT NULL,
    parent_id BIGINT UNSIGNED NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_tenant_code (tenant_id, code),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES accounts(id) ON DELETE RESTRICT,
    INDEX idx_tenant_type (tenant_id, type)
);
```

#### journal_entries

```sql
CREATE TABLE journal_entries (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT UNSIGNED NOT NULL,
    entry_number VARCHAR(50) NOT NULL,
    entry_date DATE NOT NULL,
    description TEXT NOT NULL,
    reference_type VARCHAR(50) NULL, -- 'sale', 'purchase', 'adjustment', etc.
    reference_id BIGINT UNSIGNED NULL,
    is_voided BOOLEAN DEFAULT FALSE,
    voided_by_entry_id BIGINT UNSIGNED NULL,
    void_reason TEXT NULL,
    created_by BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_tenant_entry_number (tenant_id, entry_number),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (voided_by_entry_id) REFERENCES journal_entries(id),
    INDEX idx_tenant_date (tenant_id, entry_date),
    INDEX idx_reference (reference_type, reference_id)
);
```

#### journal_entry_lines

```sql
CREATE TABLE journal_entry_lines (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    journal_entry_id BIGINT UNSIGNED NOT NULL,
    account_id BIGINT UNSIGNED NOT NULL,
    debit_halalas BIGINT DEFAULT 0, -- Stored as integer halalas
    credit_halalas BIGINT DEFAULT 0, -- Stored as integer halalas
    memo TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT,
    INDEX idx_account (account_id),
    INDEX idx_entry (journal_entry_id),
    CONSTRAINT chk_debit_or_credit CHECK (
        (debit_halalas > 0 AND credit_halalas = 0) OR 
        (credit_halalas > 0 AND debit_halalas = 0)
    )
);
```

#### cash_registers

```sql
CREATE TABLE cash_registers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    cash_account_id BIGINT UNSIGNED NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (cash_account_id) REFERENCES accounts(id) ON DELETE RESTRICT,
    INDEX idx_tenant (tenant_id)
);
```

#### cash_counts

```sql
CREATE TABLE cash_counts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    cash_register_id BIGINT UNSIGNED NOT NULL,
    system_balance_halalas BIGINT NOT NULL,
    counted_balance_halalas BIGINT NULL,
    variance_halalas BIGINT NULL,
    status ENUM('in_progress', 'completed') DEFAULT 'in_progress',
    variance_reason TEXT NULL,
    adjustment_entry_id BIGINT UNSIGNED NULL,
    counted_by BIGINT UNSIGNED NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (cash_register_id) REFERENCES cash_registers(id) ON DELETE CASCADE,
    FOREIGN KEY (counted_by) REFERENCES users(id),
    FOREIGN KEY (adjustment_entry_id) REFERENCES journal_entries(id),
    INDEX idx_register (cash_register_id)
);
```

#### cash_count_denominations

```sql
CREATE TABLE cash_count_denominations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    cash_count_id BIGINT UNSIGNED NOT NULL,
    denomination_halalas BIGINT NOT NULL, -- 1, 5, 10, 25, 50, 100, 500, 1000, 5000, etc.
    quantity INT NOT NULL,
    total_halalas BIGINT NOT NULL,
    FOREIGN KEY (cash_count_id) REFERENCES cash_counts(id) ON DELETE CASCADE,
    INDEX idx_count (cash_count_id)
);
```

#### receivables

```sql
CREATE TABLE receivables (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT UNSIGNED NOT NULL,
    customer_id BIGINT UNSIGNED NOT NULL,
    invoice_number VARCHAR(50) NOT NULL,
    amount_halalas BIGINT NOT NULL,
    paid_halalas BIGINT DEFAULT 0,
    balance_halalas BIGINT NOT NULL,
    due_date DATE NOT NULL,
    status ENUM('open', 'partial', 'paid', 'overdue') DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
    INDEX idx_tenant_status (tenant_id, status),
    INDEX idx_customer (customer_id),
    INDEX idx_due_date (due_date)
);
```

#### payables

```sql
CREATE TABLE payables (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT UNSIGNED NOT NULL,
    supplier_id BIGINT UNSIGNED NOT NULL,
    bill_number VARCHAR(50) NOT NULL,
    amount_halalas BIGINT NOT NULL,
    paid_halalas BIGINT DEFAULT 0,
    balance_halalas BIGINT NOT NULL,
    due_date DATE NOT NULL,
    status ENUM('open', 'partial', 'paid', 'overdue') DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE RESTRICT,
    INDEX idx_tenant_status (tenant_id, status),
    INDEX idx_supplier (supplier_id),
    INDEX idx_due_date (due_date)
);
```

#### inventory_locations

```sql
CREATE TABLE inventory_locations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    INDEX idx_tenant (tenant_id)
);
```

#### inventory_levels

```sql
CREATE TABLE inventory_levels (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT UNSIGNED NOT NULL,
    product_id BIGINT UNSIGNED NOT NULL,
    location_id BIGINT UNSIGNED NOT NULL,
    quantity DECIMAL(15, 4) NOT NULL DEFAULT 0,
    reorder_level DECIMAL(15, 4) NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES inventory_locations(id) ON DELETE CASCADE,
    UNIQUE KEY unique_product_location (product_id, location_id),
    INDEX idx_tenant (tenant_id),
    INDEX idx_reorder (tenant_id, quantity, reorder_level)
);
```

#### stock_movements

```sql
CREATE TABLE stock_movements (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT UNSIGNED NOT NULL,
    product_id BIGINT UNSIGNED NOT NULL,
    location_id BIGINT UNSIGNED NOT NULL,
    movement_type ENUM('receive', 'sale', 'transfer_in', 'transfer_out', 'adjustment') NOT NULL,
    quantity DECIMAL(15, 4) NOT NULL, -- Positive for increases, negative for decreases
    running_balance DECIMAL(15, 4) NOT NULL,
    reference_type VARCHAR(50) NULL,
    reference_id BIGINT UNSIGNED NULL,
    reason TEXT NULL,
    created_by BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES inventory_locations(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_tenant_product (tenant_id, product_id),
    INDEX idx_location (location_id),
    INDEX idx_created_at (created_at)
);
```

#### fifo_layers

```sql
CREATE TABLE fifo_layers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT UNSIGNED NOT NULL,
    product_id BIGINT UNSIGNED NOT NULL,
    location_id BIGINT UNSIGNED NOT NULL,
    quantity_remaining DECIMAL(15, 4) NOT NULL,
    unit_cost_halalas BIGINT NOT NULL,
    received_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES inventory_locations(id) ON DELETE CASCADE,
    INDEX idx_product_location (product_id, location_id, received_at),
    INDEX idx_tenant (tenant_id)
);
```

#### stocktakings

```sql
CREATE TABLE stocktakings (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(255) NOT NULL,
    location_id BIGINT UNSIGNED NULL, -- NULL means all locations
    status ENUM('in_progress', 'completed') DEFAULT 'in_progress',
    started_by BIGINT UNSIGNED NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES inventory_locations(id) ON DELETE CASCADE,
    FOREIGN KEY (started_by) REFERENCES users(id),
    INDEX idx_tenant (tenant_id)
);
```

#### stocktaking_counts

```sql
CREATE TABLE stocktaking_counts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    stocktaking_id BIGINT UNSIGNED NOT NULL,
    product_id BIGINT UNSIGNED NOT NULL,
    location_id BIGINT UNSIGNED NOT NULL,
    system_quantity DECIMAL(15, 4) NOT NULL,
    counted_quantity DECIMAL(15, 4) NOT NULL,
    variance_quantity DECIMAL(15, 4) NOT NULL,
    adjustment_movement_id BIGINT UNSIGNED NULL,
    FOREIGN KEY (stocktaking_id) REFERENCES stocktakings(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES inventory_locations(id) ON DELETE CASCADE,
    FOREIGN KEY (adjustment_movement_id) REFERENCES stock_movements(id),
    UNIQUE KEY unique_stocktaking_product_location (stocktaking_id, product_id, location_id)
);
```

#### budgets

```sql
CREATE TABLE budgets (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT UNSIGNED NOT NULL,
    account_id BIGINT UNSIGNED NOT NULL,
    fiscal_year INT NOT NULL,
    period INT NOT NULL, -- 1-12 for months
    budget_amount_halalas BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    UNIQUE KEY unique_account_period (account_id, fiscal_year, period),
    INDEX idx_tenant_year (tenant_id, fiscal_year)
);
```

#### audit_trail

```sql
CREATE TABLE audit_trail (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT UNSIGNED NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id BIGINT UNSIGNED NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'voided', etc.
    before_data JSON NULL,
    after_data JSON NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    ip_address VARCHAR(45) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_tenant_created (tenant_id, created_at),
    INDEX idx_user (user_id)
);
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

