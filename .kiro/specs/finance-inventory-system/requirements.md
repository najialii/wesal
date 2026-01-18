# Requirements Document

## Introduction

This document outlines the requirements for a simple, easy-to-use Finance and Inventory Management System designed for small business owners in the WesalTech platform. The system helps business owners:
- Track their money (sales income, expenses, salaries, bills)
- Manage cash and bank accounts
- Pay employees and suppliers
- Track recurring expenses (rent, subscriptions, utilities)
- Manage inventory (stock levels, locations)
- Understand their business through simple reports

No accounting knowledge is required - the system uses familiar business terms like "money in", "money out", "pay salary", "pay bill". Behind the scenes, it uses professional accounting standards to keep everything accurate. All money is stored in Halalas (1 SAR = 100 Halalas) to prevent rounding errors.

## Glossary

- **Money In**: Income received from sales, services, or other sources
- **Money Out**: Expenses paid for salaries, bills, purchases, or other costs
- **Category**: A simple label for organizing money (e.g., "Salaries", "Rent", "Sales", "Utilities")
- **Cash Register**: A physical location where cash is kept (e.g., "Main Counter", "Back Office")
- **Bank Account**: A business bank account tracked in the system
- **Employee**: A staff member who receives salary payments
- **Salary**: Money paid to employees for their work
- **Recurring Expense**: An expense that repeats regularly (e.g., monthly rent, SaaS subscriptions)
- **Customer Credit**: Money that customers owe you (sales not yet paid)
- **Supplier Credit**: Money you owe to suppliers (purchases not yet paid)
- **Inventory**: Products you have in stock
- **Stock Level**: How many units of a product you have
- **Location**: Where inventory is physically stored (e.g., "Warehouse", "Shop Floor")
- **Stock Count**: Physically counting inventory to verify what you actually have
- **Halala**: The smallest Saudi coin (1 SAR = 100 Halalas); used for accurate calculations
- **Business Owner**: The tenant user who has exclusive access to financial and inventory features

## Requirements

### Requirement 1: Simple Money Tracking

**User Story:** As a business owner, I want to easily record money coming in and going out, so that I can track my business finances without accounting knowledge.

#### Acceptance Criteria

1. WHEN recording money in, THE Financial System SHALL require only amount, category, and source (cash/bank)
2. WHEN recording money out, THE Financial System SHALL require only amount, category, and payment method (cash/bank)
3. WHEN displaying money, THE Financial System SHALL show amounts in Riyals (e.g., "1,250.50 SAR")
4. WHEN storing money internally, THE Financial System SHALL store it as Halalas to prevent rounding errors
5. WHEN calculating totals, THE Financial System SHALL use integer arithmetic for accuracy

### Requirement 2: Salary Payments

**User Story:** As a business owner, I want to pay employee salaries easily, so that I can manage payroll without complexity.

#### Acceptance Criteria

1. WHEN paying a salary, THE Financial System SHALL require employee name, amount, and payment method
2. WHEN a salary is paid, THE Financial System SHALL automatically categorize it as "Salaries" expense
3. WHEN viewing salary history, THE Financial System SHALL show all payments by employee
4. WHEN generating reports, THE Financial System SHALL show total salaries paid per month
5. WHEN a salary is paid, THE Financial System SHALL reduce the cash or bank balance accordingly

### Requirement 3: Recurring Expenses (Rent, SaaS, Utilities)

**User Story:** As a business owner, I want to track recurring expenses like rent and subscriptions, so that I don't forget regular payments.

#### Acceptance Criteria

1. WHEN creating a recurring expense, THE Financial System SHALL require name, amount, frequency (monthly/yearly), and category
2. WHEN a recurring expense is due, THE Financial System SHALL show a reminder notification
3. WHEN paying a recurring expense, THE Financial System SHALL record it and schedule the next payment
4. WHEN viewing recurring expenses, THE Financial System SHALL show all active subscriptions and their next due dates
5. WHEN a recurring expense is paid, THE Financial System SHALL reduce the cash or bank balance accordingly

### Requirement 4: Cash Management

**User Story:** As a business owner, I want to manage cash in different locations, so that I can track money at each register or office.

#### Acceptance Criteria

1. WHEN creating a cash register, THE Financial System SHALL require only a name and location
2. WHEN adding cash to a register, THE Financial System SHALL increase the register balance
3. WHEN removing cash from a register, THE Financial System SHALL decrease the register balance
4. WHEN transferring cash between registers, THE Financial System SHALL update both balances
5. WHEN viewing a register, THE Financial System SHALL show current balance and recent transactions

### Requirement 5: Cash Counting

**User Story:** As a business owner, I want to count physical cash and compare it to the system, so that I can verify my cash is accurate.

#### Acceptance Criteria

1. WHEN starting a cash count, THE Financial System SHALL show the current system balance
2. WHEN counting cash, THE Financial System SHALL allow entering quantities for each bill/coin denomination
3. WHEN the count is complete, THE Financial System SHALL show the difference between counted and system amounts
4. IF there's a difference, THEN THE Financial System SHALL allow adjusting the system balance with a reason
5. WHEN a count is saved, THE Financial System SHALL keep a permanent record

### Requirement 6: Bank Account Tracking

**User Story:** As a business owner, I want to track my bank accounts, so that I know how much money I have in each account.

#### Acceptance Criteria

1. WHEN adding a bank account, THE Financial System SHALL require only bank name and account number
2. WHEN money is deposited, THE Financial System SHALL increase the bank balance
3. WHEN money is withdrawn, THE Financial System SHALL decrease the bank balance
4. WHEN viewing a bank account, THE Financial System SHALL show current balance and recent transactions
5. WHEN reconciling with bank statement, THE Financial System SHALL allow marking transactions as verified

### Requirement 7: Customer Credits (Money Owed to You)

**User Story:** As a business owner, I want to track customers who owe me money, so that I can follow up on unpaid sales.

#### Acceptance Criteria

1. WHEN a sale is made on credit, THE Financial System SHALL record the customer name and amount owed
2. WHEN a customer pays, THE Financial System SHALL reduce their balance and increase cash/bank
3. WHEN viewing customer credits, THE Financial System SHALL show how long each payment is overdue
4. WHEN a customer is selected, THE Financial System SHALL show their payment history
5. WHEN generating reports, THE Financial System SHALL show total money owed by all customers

### Requirement 8: Supplier Credits (Money You Owe)

**User Story:** As a business owner, I want to track money I owe to suppliers, so that I can pay bills on time.

#### Acceptance Criteria

1. WHEN a purchase is made on credit, THE Financial System SHALL record the supplier name and amount owed
2. WHEN paying a supplier, THE Financial System SHALL reduce the amount owed and decrease cash/bank
3. WHEN viewing supplier credits, THE Financial System SHALL show how long each bill is overdue
4. WHEN a supplier is selected, THE Financial System SHALL show payment history
5. WHEN generating reports, THE Financial System SHALL show total money owed to all suppliers

### Requirement 9: Simple Financial Reports

**User Story:** As a business owner, I want simple reports showing my business performance, so that I can understand if I'm making money.

#### Acceptance Criteria

1. WHEN requesting a Profit Report, THE Financial System SHALL show total money in minus total money out for the period
2. WHEN requesting a Cash Report, THE Financial System SHALL show current cash and bank balances
3. WHEN requesting an Expense Report, THE Financial System SHALL show expenses grouped by category
4. WHEN requesting an Income Report, THE Financial System SHALL show income grouped by category
5. WHEN generating any report, THE Financial System SHALL allow exporting to PDF or Excel

### Requirement 10: Transaction History

**User Story:** As a business owner, I want to see all my transactions, so that I can find any payment or receipt quickly.

#### Acceptance Criteria

1. WHEN viewing transactions, THE Financial System SHALL show them newest first
2. WHEN searching transactions, THE Financial System SHALL allow filtering by date, amount, or category
3. WHEN a transaction is selected, THE Financial System SHALL show all details including who recorded it
4. WHEN viewing transactions, THE Financial System SHALL show running balance
5. WHEN exporting transactions, THE Financial System SHALL include all filtered results

### Requirement 11: POS Integration

**User Story:** As a business owner, I want POS sales automatically recorded in finances, so that all revenue is captured without manual entry.

#### Acceptance Criteria

1. WHEN a sale is completed in POS, THE Financial System SHALL automatically record the income
2. WHEN a sale has multiple payment methods, THE Financial System SHALL record each separately
3. WHEN a sale is refunded, THE Financial System SHALL automatically record the refund
4. WHEN viewing financial data, THE Financial System SHALL link to the original POS transaction
5. WHEN a sale includes products, THE Financial System SHALL update both finances and inventory

### Requirement 12: Inventory Stock Levels

**User Story:** As a business owner, I want to track how much stock I have, so that I know when to reorder products.

#### Acceptance Criteria

1. WHEN viewing inventory, THE Inventory System SHALL show current quantity for each product
2. WHEN stock is received, THE Inventory System SHALL increase the quantity
3. WHEN stock is sold, THE Inventory System SHALL decrease the quantity
4. WHEN stock reaches a low level, THE Inventory System SHALL show a warning
5. WHEN viewing a product, THE Inventory System SHALL show quantity at each location

### Requirement 13: Multiple Stock Locations

**User Story:** As a business owner, I want to track stock at different locations, so that I know where each product is stored.

#### Acceptance Criteria

1. WHEN creating a location, THE Inventory System SHALL require only a name
2. WHEN receiving stock, THE Inventory System SHALL require specifying which location
3. WHEN transferring stock, THE Inventory System SHALL decrease source location and increase destination
4. WHEN viewing inventory, THE Inventory System SHALL show quantities by location
5. WHEN a transfer is complete, THE Inventory System SHALL keep a record of the movement

### Requirement 14: Stock Movement History

**User Story:** As a business owner, I want to see all stock movements, so that I can track what happened to my inventory.

#### Acceptance Criteria

1. WHEN stock quantity changes, THE Inventory System SHALL record the movement with date and reason
2. WHEN viewing movements, THE Inventory System SHALL show type (received, sold, transferred, adjusted)
3. WHEN viewing movements, THE Inventory System SHALL show running quantity balance
4. WHEN searching movements, THE Inventory System SHALL allow filtering by product, location, or date
5. WHEN exporting movements, THE Inventory System SHALL include all details

### Requirement 15: Physical Stock Counting

**User Story:** As a business owner, I want to count physical stock and compare to the system, so that I can verify my inventory is accurate.

#### Acceptance Criteria

1. WHEN starting a stock count, THE Inventory System SHALL show current system quantities
2. WHEN counting stock, THE Inventory System SHALL allow entering actual counted quantities
3. WHEN the count is complete, THE Inventory System SHALL show differences between counted and system
4. IF there are differences, THEN THE Inventory System SHALL allow adjusting quantities with a reason
5. WHEN a count is saved, THE Inventory System SHALL keep a permanent record

### Requirement 16: Inventory Valuation

**User Story:** As a business owner, I want to know the value of my inventory, so that I understand how much money is tied up in stock.

#### Acceptance Criteria

1. WHEN stock is purchased, THE Inventory System SHALL record the cost per unit
2. WHEN stock is sold, THE Inventory System SHALL calculate cost using oldest stock first (FIFO)
3. WHEN viewing inventory value, THE Inventory System SHALL show total value of all stock
4. WHEN viewing a product, THE Inventory System SHALL show average cost per unit
5. WHEN generating reports, THE Inventory System SHALL show inventory value by product or location

### Requirement 17: Inventory Purchase Integration

**User Story:** As a business owner, I want inventory purchases to update both stock and finances, so that everything stays synchronized.

#### Acceptance Criteria

1. WHEN purchasing stock with cash, THE System SHALL increase inventory and decrease cash
2. WHEN purchasing stock on credit, THE System SHALL increase inventory and record supplier credit
3. WHEN stock is sold, THE System SHALL record both the sale income and the cost of the stock
4. WHEN stock is adjusted, THE System SHALL record the financial impact
5. WHEN viewing reports, THE System SHALL show both inventory and financial data together

### Requirement 18: Budget Tracking

**User Story:** As a business owner, I want to set spending budgets, so that I can control costs and avoid overspending.

#### Acceptance Criteria

1. WHEN creating a budget, THE Financial System SHALL allow setting monthly limits for each category
2. WHEN expenses are recorded, THE Financial System SHALL show how much budget remains
3. WHEN viewing budgets, THE Financial System SHALL show actual vs budget for each category
4. IF spending exceeds budget, THEN THE Financial System SHALL show a warning
5. WHEN a month ends, THE Financial System SHALL allow copying the budget to next month

### Requirement 19: Owner-Only Access

**User Story:** As a business owner, I want exclusive access to financial and inventory data, so that sensitive information stays private.

#### Acceptance Criteria

1. WHEN a user tries to access finances, THE System SHALL verify they are the business owner
2. WHEN a non-owner tries to access, THE System SHALL deny access with a clear message
3. WHEN the owner accesses features, THE System SHALL grant full access to all functions
4. WHEN access is denied, THE System SHALL log the attempt
5. WHILE the system runs, THE System SHALL enforce owner-only access to all financial and inventory pages

### Requirement 20: Audit Trail

**User Story:** As a business owner, I want a permanent record of all changes, so that I can see who did what and when.

#### Acceptance Criteria

1. WHEN any financial or inventory record is created, THE System SHALL log who did it and when
2. WHEN a record is modified, THE System SHALL keep both old and new versions
3. WHEN viewing history, THE System SHALL show all changes with before and after values
4. WHEN a transaction is cancelled, THE System SHALL keep the original record marked as cancelled
5. WHILE the system runs, THE System SHALL prevent anyone from deleting or changing history records


### Requirement 21

**User Story:** As a business owner, I want to easily pay employee salaries, so that I can manage payroll without accounting knowledge.

#### Acceptance Criteria

1. WHEN recording a salary payment, THE Financial System SHALL allow entering employee name, amount, and payment date
2. WHEN a salary is paid, THE Financial System SHALL automatically categorize it as "Salaries" expense
3. WHEN viewing salary history, THE Financial System SHALL display all payments by employee with dates and amounts
4. WHEN generating salary reports, THE Financial System SHALL show total salaries paid per employee and per month
5. WHEN a salary is recorded, THE Financial System SHALL reduce cash balance automatically

### Requirement 22

**User Story:** As a business owner, I want to track recurring expenses like rent and subscriptions, so that I don't forget regular payments.

#### Acceptance Criteria

1. WHEN setting up a recurring expense, THE Financial System SHALL allow entering name, amount, frequency, and start date
2. WHEN a recurring expense is due, THE Financial System SHALL notify the business owner
3. WHEN recording a recurring payment, THE Financial System SHALL link it to the recurring expense template
4. WHEN viewing recurring expenses, THE Financial System SHALL display next due date and payment history
5. WHEN a recurring expense is paid, THE Financial System SHALL automatically schedule the next occurrence

### Requirement 23

**User Story:** As a business owner, I want simple income and expense tracking, so that I can see if I'm making or losing money.

#### Acceptance Criteria

1. WHEN recording income, THE Financial System SHALL only require amount, source, and date
2. WHEN recording an expense, THE Financial System SHALL only require amount, category, and date
3. WHEN viewing my money summary, THE Financial System SHALL display total income, total expenses, and profit/loss
4. WHEN selecting a time period, THE Financial System SHALL show income vs expenses comparison
5. WHEN viewing categories, THE Financial System SHALL show spending breakdown by category with percentages

### Requirement 24

**User Story:** As a business owner, I want to track money owed to me and money I owe, so that I can manage my cash flow.

#### Acceptance Criteria

1. WHEN a customer owes me money, THE Financial System SHALL allow recording the amount and due date
2. WHEN I owe a supplier money, THE Financial System SHALL allow recording the amount and due date
3. WHEN viewing money owed to me, THE Financial System SHALL show which customers owe and how much
4. WHEN viewing money I owe, THE Financial System SHALL show which suppliers I owe and when it's due
5. WHEN a payment is received or made, THE Financial System SHALL update the owed amounts automatically

### Requirement 25

**User Story:** As a business owner, I want simple reports that show my business health, so that I can make informed decisions.

#### Acceptance Criteria

1. WHEN requesting a profit report, THE Financial System SHALL show income minus expenses in simple terms
2. WHEN requesting a cash report, THE Financial System SHALL show current cash balance and recent movements
3. WHEN requesting an expense report, THE Financial System SHALL show spending by category with visual charts
4. WHEN requesting a sales report, THE Financial System SHALL show revenue trends over time
5. WHEN generating any report, THE Financial System SHALL use simple business language, not accounting jargon

### Requirement 26

**User Story:** As a business owner, I want to easily manage my inventory without complex systems, so that I always know what stock I have.

#### Acceptance Criteria

1. WHEN adding new stock, THE Financial System SHALL only require product name, quantity, and cost
2. WHEN selling products, THE Financial System SHALL automatically reduce stock levels
3. WHEN viewing inventory, THE Financial System SHALL show current quantity and value for each product
4. WHEN stock runs low, THE Financial System SHALL alert me to reorder
5. WHEN viewing inventory reports, THE Financial System SHALL show which products are selling well and which are not

### Requirement 27

**User Story:** As a business owner, I want to track inventory across multiple locations, so that I know where my stock is.

#### Acceptance Criteria

1. WHEN adding a location, THE Financial System SHALL only require a name and optional address
2. WHEN receiving stock, THE Financial System SHALL allow selecting which location it goes to
3. WHEN transferring stock, THE Financial System SHALL move quantity from one location to another
4. WHEN viewing inventory, THE Financial System SHALL show quantity at each location
5. WHEN a location is selected, THE Financial System SHALL show all products at that location

### Requirement 28

**User Story:** As a business owner, I want to perform physical stock counts, so that I can verify my records match reality.

#### Acceptance Criteria

1. WHEN starting a stock count, THE Financial System SHALL show current system quantities
2. WHEN counting physical stock, THE Financial System SHALL allow entering actual counted quantities
3. WHEN finishing the count, THE Financial System SHALL show differences between system and actual
4. IF there are differences, THEN THE Financial System SHALL allow adjusting the system to match actual count
5. WHEN a stock count is complete, THE Financial System SHALL save a record of the count for future reference

### Requirement 29

**User Story:** As a business owner, I want the system to be in both English and Arabic, so that I can use my preferred language.

#### Acceptance Criteria

1. WHEN using the financial system, THE Financial System SHALL display all labels and buttons in the selected language
2. WHEN switching languages, THE Financial System SHALL maintain all data and just change the interface language
3. WHEN generating reports, THE Financial System SHALL use the selected language for headers and labels
4. WHEN entering data, THE Financial System SHALL accept input in either English or Arabic
5. WHILE using the system, THE Financial System SHALL support RTL (right-to-left) layout for Arabic

### Requirement 30

**User Story:** As a business owner, I want to see my financial dashboard at a glance, so that I quickly understand my business status.

#### Acceptance Criteria

1. WHEN opening the financial dashboard, THE Financial System SHALL display current cash balance prominently
2. WHEN viewing the dashboard, THE Financial System SHALL show today's income and expenses
3. WHEN on the dashboard, THE Financial System SHALL display this month's profit/loss
4. WHEN viewing the dashboard, THE Financial System SHALL show low stock alerts
5. WHEN on the dashboard, THE Financial System SHALL display upcoming bills and receivables due
