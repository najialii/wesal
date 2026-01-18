<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeder.
     */
    public function run(): void
    {
        // Create roles with proper business naming
        $roles = [
            'system_admin',     // System administrator (was super_admin)
            'business_owner',   // Business owner (replaces admin/tenant_admin)
            'business_admin',   // Business admin (replaces tenant_admin)
            'tenant_admin',     // Legacy tenant admin (for backward compatibility)
            'manager',          // Business manager
            'technician',       // Technical staff (was staff)
            'salesperson',      // Sales person (modern term)
            'salesman',         // Sales person (legacy term for backward compatibility)
            'employee'          // General employee (was user)
        ];

        foreach ($roles as $role) {
            Role::firstOrCreate(['name' => $role]);
        }

        // Create comprehensive permissions
        $permissions = [
            // Dashboard & Analytics
            'view_dashboard',
            'view_analytics',
            'view_reports',
            
            // User Management
            'manage_users',
            'manage_roles',
            'view_users',
            'view_staff',
            'create_staff',
            'edit_staff',
            'delete_staff',
            
            // Product Management
            'view_products',
            'create_products',
            'edit_products',
            'delete_products',
            'manage_products',
            
            // Category Management
            'view_categories',
            'create_categories',
            'edit_categories',
            'delete_categories',
            'manage_categories',
            
            // Customer Management
            'view_customers',
            'create_customers',
            'edit_customers',
            'delete_customers',
            'manage_customers',
            
            // Sales Management
            'view_sales',
            'create_sales',
            'edit_sales',
            'delete_sales',
            'manage_sales',
            'process_sales',
            
            // Maintenance & Services
            'manage_maintenance',
            'view_maintenance',
            'schedule_maintenance',
            'perform_maintenance',
            
            // Inventory Management
            'manage_inventory',
            'view_inventory',
            'adjust_stock',
            
            // Financial
            'view_financial_reports',
            'manage_pricing',
            
            // System Settings
            'manage_settings',
            'view_settings',
            'manage_integrations',
            
            // System Administration
            'manage_tenants',
            'manage_system_settings',
            'view_system_logs'
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // Assign permissions to roles
        
        // System Admin - Full system access
        $systemAdminRole = Role::findByName('system_admin');
        $systemAdminRole->givePermissionTo(Permission::all());

        // Business Owner - Full business access
        $businessOwnerRole = Role::findByName('business_owner');
        $businessOwnerRole->givePermissionTo([
            'view_dashboard',
            'view_analytics',
            'view_reports',
            'manage_users',
            'view_users',
            'view_staff',
            'create_staff',
            'edit_staff',
            'delete_staff',
            'view_products',
            'create_products',
            'edit_products',
            'delete_products',
            'manage_products',
            'view_categories',
            'create_categories',
            'edit_categories',
            'delete_categories',
            'manage_categories',
            'view_customers',
            'create_customers',
            'edit_customers',
            'delete_customers',
            'manage_customers',
            'view_sales',
            'create_sales',
            'edit_sales',
            'delete_sales',
            'manage_sales',
            'process_sales',
            'manage_maintenance',
            'view_maintenance',
            'schedule_maintenance',
            'manage_inventory',
            'view_inventory',
            'adjust_stock',
            'view_financial_reports',
            'manage_pricing',
            'manage_settings',
            'view_settings',
            'manage_integrations'
        ]);

        // Manager - Business operations management
        $managerRole = Role::findByName('manager');
        $managerRole->givePermissionTo([
            'view_dashboard',
            'view_analytics',
            'view_reports',
            'view_users',
            'view_staff',
            'create_staff',
            'edit_staff',
            'delete_staff',
            'view_products',
            'create_products',
            'edit_products',
            'delete_products',
            'manage_products',
            'view_categories',
            'create_categories',
            'edit_categories',
            'delete_categories',
            'manage_categories',
            'view_customers',
            'create_customers',
            'edit_customers',
            'delete_customers',
            'manage_customers',
            'view_sales',
            'create_sales',
            'edit_sales',
            'manage_sales',
            'process_sales',
            'manage_maintenance',
            'view_maintenance',
            'schedule_maintenance',
            'manage_inventory',
            'view_inventory',
            'adjust_stock',
            'manage_pricing',
            'view_settings'
        ]);

        // Technician - Technical and maintenance work
        $technicianRole = Role::findByName('technician');
        $technicianRole->givePermissionTo([
            'view_dashboard',
            'view_products',
            'view_customers',
            'view_maintenance',
            'perform_maintenance',
            'schedule_maintenance',
            'view_inventory',
            'adjust_stock'
        ]);

        // Salesperson - Sales focused (modern term)
        $salespersonRole = Role::findByName('salesperson');
        $salespersonRole->givePermissionTo([
            'view_dashboard',
            'view_products',
            'view_customers',
            'create_customers',
            'edit_customers',
            'manage_customers',
            'view_sales',
            'create_sales',
            'manage_sales',
            'process_sales',
            'view_inventory',
            'view_maintenance',
            'schedule_maintenance',
            'manage_maintenance',
            'view_staff'
        ]);

        // Salesman - Sales focused (legacy term, same permissions as salesperson)
        $salesmanRole = Role::findByName('salesman');
        $salesmanRole->givePermissionTo([
            'view_dashboard',
            'view_products',
            'view_customers',
            'create_customers',
            'edit_customers',
            'manage_customers',
            'view_sales',
            'create_sales',
            'manage_sales',
            'process_sales',
            'view_inventory',
            'view_maintenance',
            'schedule_maintenance',
            'manage_maintenance',
            'view_staff'
        ]);

        // Business Admin - Similar to business owner (for backward compatibility)
        $businessAdminRole = Role::findByName('business_admin');
        $businessAdminRole->givePermissionTo([
            'view_dashboard',
            'view_analytics',
            'view_reports',
            'manage_users',
            'view_users',
            'view_products',
            'create_products',
            'edit_products',
            'delete_products',
            'manage_products',
            'view_categories',
            'create_categories',
            'edit_categories',
            'delete_categories',
            'manage_categories',
            'view_customers',
            'create_customers',
            'edit_customers',
            'delete_customers',
            'manage_customers',
            'view_sales',
            'create_sales',
            'edit_sales',
            'delete_sales',
            'manage_sales',
            'process_sales',
            'manage_maintenance',
            'view_maintenance',
            'schedule_maintenance',
            'manage_inventory',
            'view_inventory',
            'adjust_stock',
            'view_financial_reports',
            'manage_pricing',
            'manage_settings',
            'view_settings',
            'manage_integrations'
        ]);

        // Business Admin - Similar to business owner (for backward compatibility)
        $businessAdminRole = Role::findByName('business_admin');
        $businessAdminRole->givePermissionTo([
            'view_dashboard',
            'view_analytics',
            'view_reports',
            'manage_users',
            'view_users',
            'view_staff',
            'create_staff',
            'edit_staff',
            'delete_staff',
            'view_products',
            'create_products',
            'edit_products',
            'delete_products',
            'manage_products',
            'view_categories',
            'create_categories',
            'edit_categories',
            'delete_categories',
            'manage_categories',
            'view_customers',
            'create_customers',
            'edit_customers',
            'delete_customers',
            'manage_customers',
            'view_sales',
            'create_sales',
            'edit_sales',
            'delete_sales',
            'manage_sales',
            'process_sales',
            'manage_maintenance',
            'view_maintenance',
            'schedule_maintenance',
            'manage_inventory',
            'view_inventory',
            'adjust_stock',
            'view_financial_reports',
            'manage_pricing',
            'manage_settings',
            'view_settings',
            'manage_integrations'
        ]);

        // Tenant Admin - Similar to business owner (for backward compatibility)
        $tenantAdminRole = Role::findByName('tenant_admin');
        $tenantAdminRole->givePermissionTo([
            'view_dashboard',
            'view_analytics',
            'view_reports',
            'manage_users',
            'view_users',
            'view_staff',
            'create_staff',
            'edit_staff',
            'delete_staff',
            'view_products',
            'create_products',
            'edit_products',
            'delete_products',
            'manage_products',
            'view_categories',
            'create_categories',
            'edit_categories',
            'delete_categories',
            'manage_categories',
            'view_customers',
            'create_customers',
            'edit_customers',
            'delete_customers',
            'manage_customers',
            'view_sales',
            'create_sales',
            'edit_sales',
            'delete_sales',
            'manage_sales',
            'process_sales',
            'manage_maintenance',
            'view_maintenance',
            'schedule_maintenance',
            'manage_inventory',
            'view_inventory',
            'adjust_stock',
            'view_financial_reports',
            'manage_pricing',
            'manage_settings',
            'view_settings',
            'manage_integrations'
        ]);

        // Employee - Basic access
        $employeeRole = Role::findByName('employee');
        $employeeRole->givePermissionTo([
            'view_dashboard',
            'view_products',
            'view_customers',
            'view_sales',
            'view_inventory'
        ]);
    }
}