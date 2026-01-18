# WesalTech Multi-Tenant Business Management SaaS

A comprehensive multi-tenant SaaS platform that allows any type of business to manage their operations including POS, inventory, staff, maintenance, and more with full Saudi tax compliance.

## 🏗️ Architecture Overview

### Multi-Tenant Strategy
- **Single Database Architecture**: All tenants share one database with row-level isolation
- **Tenant Scoping**: Automatic data filtering ensures tenants only see their own data
- **Scalable Design**: Efficient resource utilization without database-per-tenant complexity

### Technology Stack
- **Backend**: Laravel 12 with PHP 8.2+
- **Frontend**: React 19 with TypeScript and Tailwind CSS
- **Database**: SQLite/MySQL with automatic tenant scoping
- **Authentication**: Laravel Sanctum with role-based permissions
- **Permissions**: Spatie Laravel Permission package

## 🎯 Core Features

### 1. Super Admin Platform Management
- **Tenant Management**: Create, suspend, activate business tenants
- **Plan Management**: Subscription plans with features and limits
- **Analytics Dashboard**: System-wide metrics and revenue tracking
- **User Management**: Oversee all platform users

### 2. Flexible Business Types
Each tenant can be any type of business:
- **Automotive Shops**: Parts, maintenance, repairs
- **Electronics Stores**: Phones, laptops, accessories
- **Grocery Stores**: Fresh produce, dairy, beverages
- **Any Retail Business**: Customizable categories and products

### 3. Role-Based Access Control
- **Super Admin**: Platform-wide management
- **Tenant Admin**: Full business control and settings
- **Manager**: Operations management (products, sales, staff)
- **Salesman**: POS operations and basic inventory access

### 4. Complete Business Management

#### Product & Inventory Management
- Custom categories per business type
- SKU and barcode management
- Real-time stock tracking
- Low stock alerts
- Cost vs selling price management

#### Point of Sale (POS) System
- Barcode scanning support
- Real-time inventory updates
- Saudi VAT (15%) calculations
- Multiple payment methods
- Automatic invoice generation

#### Staff Management
- Role-based user accounts
- Permission management
- Salary and contact information
- Hire date tracking

#### Worker Management (Non-Users)
- Maintenance workers without system access
- Skills tracking (mechanic, electrician, plumber)
- Job assignment capabilities
- Salary and contact management

#### Maintenance Scheduling
- Preventive, corrective, and emergency maintenance
- Worker assignment based on skills
- Priority levels (low, medium, high, critical)
- Time tracking (estimated vs actual)
- Cost tracking and completion notes

#### Saudi Tax Compliance
- 15% VAT calculations
- Tax invoice generation
- Commercial Registration (CR) numbers
- Tax ID management for B2B customers
- Compliant invoice formatting

## 🗄️ Database Structure

### Core Tables
- `tenants` - Business organizations with tax info
- `users` - System users with tenant association
- `plans` - Subscription plans and pricing
- `subscriptions` - Tenant billing and payments

### Business Operations Tables
- `categories` - Custom product categories per tenant
- `products` - Inventory with pricing and stock levels
- `sales` - Transaction records with tax calculations
- `sale_items` - Individual items per sale
- `workers` - Non-user maintenance workers
- `maintenance_schedules` - Maintenance tasks and assignments
- `stock_movements` - Inventory tracking (in/out/adjustments)

### Permission System
- `roles` - User roles (tenant_admin, manager, salesman)
- `permissions` - Granular permissions for features
- `role_has_permissions` - Role-permission mappings

## 🔐 Security & Data Isolation

### Tenant Isolation
```php
// Automatic tenant scoping via BelongsToTenant trait
class Product extends Model
{
    use BelongsToTenant; // Automatically filters by tenant_id
}

// Users only see their tenant's data
$products = Product::all(); // Only current tenant's products
```

### Permission System
```php
// Role-based access control
$user->can('manage_products'); // Check permissions
$user->hasRole('tenant_admin'); // Check roles
```

### API Security
- Laravel Sanctum token authentication
- Middleware for super admin vs tenant access
- Automatic tenant validation on all requests

## 📱 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Current user info

### Super Admin Routes
- `GET /api/admin/dashboard` - Platform analytics
- `GET /api/admin/tenants` - Manage all tenants
- `GET /api/admin/plans` - Subscription plan management

### Tenant Business Management
- `GET /api/tenant/categories` - Product categories
- `GET /api/tenant/products` - Inventory management
- `GET /api/tenant/staff` - Staff management
- `GET /api/tenant/stats` - Business analytics

### Point of Sale System
- `GET /api/pos/products` - Product lookup for POS
- `POST /api/pos/sales` - Process sales transactions
- `GET /api/pos/daily-sales` - Daily sales reports

## 🚀 Getting Started

### Prerequisites
- PHP 8.2+
- Composer
- Node.js 18+
- SQLite or MySQL

### Installation

1. **Backend Setup**
   ```bash
   cd backend/wesaltech
   composer install
   cp .env.example .env
   php artisan key:generate
   php artisan migrate --seed
   php artisan serve
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

### Default Credentials

#### Super Admin
- **Email**: admin@wesaltech.com
- **Password**: password

#### Sample Tenant Admins
- **Acme Corp**: admin@acme.com / password
- **TechStart**: admin@techstart.com / password
- **Enterprise**: admin@enterprise-solutions.com / password

## 🏪 Sample Business Data

### Acme Corporation (Automotive Shop)
- **Categories**: Engine Parts, Brake System, Electrical, Filters, Fluids
- **Products**: Engine oil, brake pads, air filters, spark plugs
- **Staff**: 1 Admin, 1 Manager, 2 Salesmen
- **Workers**: 3 maintenance technicians with different skills

### TechStart Inc (Electronics Store)
- **Categories**: Smartphones, Laptops, Accessories, Gaming, Audio
- **Products**: Samsung phones, MacBooks, wireless chargers
- **Staff**: Role-based team structure
- **Sample Sales**: Complete transaction history

### Enterprise Solutions (Grocery Store)
- **Categories**: Fresh Produce, Dairy, Beverages, Snacks, Household
- **Products**: Bananas, milk, orange juice
- **Inventory**: Stock levels and low stock alerts

## 🔄 Business Workflow

### 1. Tenant Onboarding
1. Super admin creates tenant with business details
2. Tenant admin receives login credentials
3. Admin sets up categories and products
4. Staff accounts are created with appropriate roles

### 2. Daily Operations
1. **Salesmen** use POS system for transactions
2. **Managers** monitor inventory and staff
3. **Admins** handle settings and reports
4. **Workers** complete assigned maintenance tasks

### 3. Inventory Management
1. Products automatically update stock on sales
2. Low stock alerts notify managers
3. Stock movements tracked for auditing
4. Pricing and cost management

### 4. Maintenance Operations
1. Schedule preventive maintenance
2. Assign tasks to workers based on skills
3. Track completion and costs
4. Generate maintenance reports

## 📊 Key Benefits

### For SaaS Platform Owner
- **Scalable Architecture**: Single database, efficient resource usage
- **Revenue Tracking**: Subscription management and analytics
- **Easy Management**: Centralized tenant and user administration

### For Business Tenants
- **Complete Solution**: POS, inventory, staff, maintenance in one platform
- **Saudi Compliance**: Built-in tax calculations and invoice generation
- **Role-Based Access**: Proper permissions for different staff levels
- **Real-time Data**: Live inventory and sales tracking

### Technical Advantages
- **Single Database**: Easier backups, maintenance, and scaling
- **Automatic Scoping**: No risk of cross-tenant data leaks
- **Modern Stack**: Laravel + React with TypeScript
- **API-First**: Clean separation between backend and frontend

## 🔧 Customization

### Adding New Business Types
1. Create categories in the admin panel
2. Add products with appropriate pricing
3. Configure maintenance schedules if needed
4. Set up staff roles and permissions

### Extending Features
- Add new product attributes
- Create custom reports
- Integrate payment gateways
- Add mobile app support

## 📈 Scalability

### Database Performance
- Indexed tenant_id columns for fast queries
- Efficient relationship loading
- Optimized for multi-tenant queries

### Application Scaling
- Stateless API design
- Cacheable responses
- Queue support for background jobs
- Horizontal scaling ready

## 🛡️ Security Features

- **Data Isolation**: Automatic tenant scoping prevents data leaks
- **Role-Based Access**: Granular permissions for different user types
- **API Authentication**: Secure token-based authentication
- **Input Validation**: Comprehensive request validation
- **SQL Injection Protection**: Laravel's built-in ORM protection

This platform provides a complete, professional-grade multi-tenant business management solution that can adapt to any type of retail or service business while maintaining security, scalability, and ease of use.