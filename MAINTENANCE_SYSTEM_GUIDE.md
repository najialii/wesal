# Maintenance System Guide

## Overview
The maintenance system manages service contracts and scheduled visits for products sold to customers. It tracks maintenance schedules, assigns technicians, manages parts/products used, and provides calendar views of upcoming visits.

---

## System Architecture

### Database Structure

#### 1. **maintenance_contracts** Table
Stores the main maintenance contract information.

**Key Fields:**
- `product_id` - The product being maintained
- `customer_id` - Customer receiving maintenance
- `assigned_technician_id` - Technician assigned to this contract
- `frequency` - How often maintenance occurs (once, weekly, monthly, quarterly, semi_annual, annual, custom)
- `frequency_value` & `frequency_unit` - For custom frequencies (e.g., every 3 months)
- `start_date` & `end_date` - Contract duration
- `contract_value` - Total contract cost
- `maintenance_products` - JSON array of products/parts used with quantities and costs
- `status` - active, paused, completed, cancelled

**Relationships:**
- Belongs to: Product, Customer, User (technician)
- Has many: MaintenanceVisits

#### 2. **maintenance_visits** Table
Tracks individual maintenance visits scheduled from contracts.

**Key Fields:**
- `maintenance_contract_id` - Parent contract
- `assigned_worker_id` - Worker/technician for this visit
- `scheduled_date` & `scheduled_time` - When visit is planned
- `actual_start_time` & `actual_end_time` - Actual visit times
- `status` - scheduled, in_progress, completed, cancelled, missed
- `priority` - low, medium, high, urgent
- `work_description` - What needs to be done
- `completion_notes` - What was done
- `total_cost` - Cost of this visit
- `customer_rating` - 1-5 star rating

#### 3. **maintenance_products** Table
Inventory of parts/products used for maintenance.

**Key Fields:**
- `name`, `sku` - Product identification
- `cost_price` - Cost per unit
- `stock_quantity` - Available inventory
- `unit` - Measurement unit (pcs, kg, liters, etc.)
- `type` - spare_part, consumable, tool, chemical

---

## Frontend Structure

### Pages

#### 1. **MaintenanceContracts.tsx** (`/business/maintenance`)
**Purpose:** Main list view of all maintenance contracts

**Features:**
- Search contracts by customer, product, or phone
- View contract details (customer, product, frequency, next visit, value, status)
- Quick actions: View, Edit, Delete
- Statistics cards: Total contracts, Active, Completed, Total value
- Navigate to calendar view or create new contract

**API Calls:**
- `GET /business/maintenance/contracts` - Fetch all contracts

#### 2. **MaintenanceContractForm.tsx** (`/business/maintenance/create` or `/edit/:id`)
**Purpose:** Create or edit maintenance contracts

**Form Fields:**
- **Product** - Select which product needs maintenance
- **Customer** - Select customer from customer list
- **Assigned Technician** - Select technician (filtered from staff with technician role)
- **Frequency** - Choose: once, weekly, monthly, quarterly, semi-annual, annual, or custom
- **Custom Frequency** - If custom: specify value (e.g., 3) and unit (days, weeks, months, years)
- **Start Date** - When contract begins
- **End Date** - When contract ends (optional)
- **Maintenance Products** - Add multiple products/parts:
  - Select product from maintenance products inventory
  - Quantity used
  - Unit cost (auto-filled from product cost)
  - Shows total cost calculation
- **Contract Value** - Total contract value (can differ from parts cost)
- **Special Instructions** - Any notes or special requirements
- **Status** - active, paused, completed, cancelled (edit only)

**API Calls:**
- `GET /tenant/products` - Fetch products
- `GET /tenant/customers` - Fetch customers
- `GET /tenant/staff` - Fetch staff (filtered for technicians)
- `GET /business/maintenance/products` - Fetch maintenance products
- `POST /business/maintenance/contracts` - Create contract
- `PUT /business/maintenance/contracts/:id` - Update contract
- `GET /business/maintenance/contracts/:id` - Fetch contract for editing

#### 3. **Maintenance.tsx** (`/business/maintenance/calendar`)
**Purpose:** Calendar view of scheduled maintenance visits

**Features:**
- Calendar view (month, week, day)
- List view toggle
- Color-coded by status (completed=green, in_progress=blue, scheduled=yellow, etc.)
- Click event to view visit details
- Schedule new visits
- Filter by status, worker, priority, date range

**API Calls:**
- `GET /business/maintenance/visits` - Fetch visits
- `GET /business/maintenance/calendar` - Fetch calendar events

---

## Backend Structure

### Controller: `MaintenanceController.php`

#### Contract Management Endpoints

**1. GET `/business/maintenance/contracts`**
- Lists all maintenance contracts
- Supports search by customer name, phone, or product
- Returns contracts with product, customer, and technician relationships

**2. POST `/business/maintenance/contracts`**
- Creates new maintenance contract
- Validates all required fields
- Auto-fills customer details from customer record
- Stores maintenance products as JSON array

**3. GET `/business/maintenance/contracts/:id`**
- Fetches single contract with all relationships
- Includes visits history

**4. PUT `/business/maintenance/contracts/:id`**
- Updates existing contract
- Updates customer details if customer changed
- Validates frequency settings

**5. DELETE `/business/maintenance/contracts/:id`**
- Deletes contract and cascades to visits

#### Visit Management Endpoints

**6. GET `/business/maintenance/visits`**
- Lists maintenance visits
- Filters: status, worker, priority, date range, search
- Returns visits with contract, product, and worker info

**7. POST `/business/maintenance/visits`**
- Schedules new maintenance visit
- Links to contract
- Assigns worker/technician
- Sets priority and date

**8. GET `/business/maintenance/visits/:id`**
- Fetches visit details with items used

**9. PUT `/business/maintenance/visits/:id`**
- Updates visit details

**10. POST `/business/maintenance/visits/:id/start`**
- Marks visit as in_progress
- Records actual start time

**11. POST `/business/maintenance/visits/:id/complete`**
- Marks visit as completed
- Records completion notes, photos, rating
- Adds maintenance items used
- Calculates total cost

**12. POST `/business/maintenance/visits/:id/reschedule`**
- Changes visit date/time
- Resets status to scheduled

**13. POST `/business/maintenance/visits/:id/cancel`**
- Cancels visit with reason

#### Support Endpoints

**14. GET `/business/maintenance/products`**
- Lists maintenance products inventory
- Filters active products

**15. GET `/business/maintenance/dashboard`**
- Returns statistics and upcoming/overdue visits

**16. GET `/business/maintenance/calendar`**
- Returns visits formatted for calendar display
- Filters by date range

---

## Models

### MaintenanceContract Model

**Key Methods:**
- `calculateNextVisitDate($fromDate)` - Calculates next visit based on frequency
- `isExpired()` - Checks if contract has ended
- `getUpcomingVisit()` - Gets next scheduled visit
- `getLastCompletedVisit()` - Gets most recent completed visit

**Scopes:**
- `active()` - Only active contracts
- `expiringSoon($days)` - Contracts ending within X days

### MaintenanceVisit Model

**Scopes:**
- `scheduled()` - Status = scheduled
- `inProgress()` - Status = in_progress
- `completed()` - Status = completed
- `overdue()` - Scheduled date passed but not completed
- `upcoming($days)` - Scheduled within next X days
- `today()` - Scheduled for today

**Methods:**
- `markAsCompleted($notes, $photos)` - Complete visit and record details

---

## User Flow

### Creating a Maintenance Contract

1. User navigates to `/business/maintenance`
2. Clicks "Create Contract" button
3. Fills out form:
   - Selects product being maintained
   - Selects customer
   - Assigns technician
   - Sets frequency (e.g., monthly)
   - Sets start date
   - Adds maintenance products/parts that will be used
   - Sets contract value
4. Submits form
5. System creates contract and redirects to list

### Scheduling Visits

**Automatic (Future Enhancement):**
- System can auto-generate visits based on contract frequency
- Next visit date calculated from last visit + frequency

**Manual:**
- From calendar view, click "Schedule Visit"
- Select contract
- Set date, time, priority
- Assign worker
- Add work description

### Completing a Visit

1. Technician starts visit (marks as in_progress)
2. Performs maintenance work
3. Completes visit with:
   - Completion notes
   - Photos (optional)
   - Items/parts used
   - Customer rating
4. System calculates total cost from items used
5. Visit marked as completed

---

## Key Features

### 1. **Flexible Scheduling**
- One-time or recurring maintenance
- Standard frequencies (weekly, monthly, etc.)
- Custom frequencies (every 3 months, every 6 weeks, etc.)

### 2. **Technician Assignment**
- Contracts assigned to specific technicians
- Individual visits can have different workers
- Salesman auto-assigned from original sale (if applicable)

### 3. **Parts Tracking**
- Track products/parts used per contract
- Maintain inventory of maintenance products
- Calculate costs automatically
- Separate contract value from parts cost

### 4. **Customer Management**
- Link to existing customers
- Store customer details with contract
- Track customer ratings and feedback

### 5. **Calendar Integration**
- Visual calendar of all scheduled visits
- Color-coded by status and priority
- Month, week, and day views
- Quick access to visit details

### 6. **Status Tracking**
- Contract status: active, paused, completed, cancelled
- Visit status: scheduled, in_progress, completed, cancelled, missed
- Priority levels: low, medium, high, urgent

---

## API Routes Summary

```
/business/maintenance/
├── contracts
│   ├── GET    /           - List contracts
│   ├── POST   /           - Create contract
│   ├── GET    /:id        - View contract
│   ├── PUT    /:id        - Update contract
│   └── DELETE /:id        - Delete contract
├── visits
│   ├── GET    /           - List visits
│   ├── POST   /           - Schedule visit
│   ├── GET    /:id        - View visit
│   ├── PUT    /:id        - Update visit
│   ├── POST   /:id/start  - Start visit
│   ├── POST   /:id/complete - Complete visit
│   ├── POST   /:id/reschedule - Reschedule visit
│   └── POST   /:id/cancel - Cancel visit
├── products
│   └── GET    /           - List maintenance products
├── dashboard
│   └── GET    /           - Get statistics
└── calendar
    └── GET    /           - Get calendar events
```

---

## Future Enhancements

1. **Auto-scheduling** - Automatically create visits based on contract frequency
2. **Notifications** - Remind technicians of upcoming visits
3. **Mobile app** - For technicians in the field
4. **Inventory management** - Track maintenance product stock levels
5. **Reporting** - Generate maintenance reports and analytics
6. **Customer portal** - Let customers view their maintenance schedule
7. **Recurring billing** - Auto-generate invoices based on contracts

---

## Color Scheme

**Primary Color:** #088BF8 (Blue)
**Secondary Color:** #0bd8fa (Cyan)

Used throughout the maintenance UI for:
- Active menu items (gradient from primary to secondary)
- Buttons and CTAs
- Status indicators
- Calendar events
