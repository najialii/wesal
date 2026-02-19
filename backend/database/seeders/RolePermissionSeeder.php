<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Create permissions for tenant operations
        $permissions = [
            // Product management
            'manage_products',
            'view_products',
            'create_products',
            'edit_products',
            'delete_products',
            
            // Customer management
            'manage_customers',
            'view_customers',
            'create_customers',
            'edit_customers',
            'delete_customers',
            
            // Sales management
            'manage_sales',
            'view_sales',
            'create_sales',
            'process_pos',
            
            // Staff management
            'manage_staff',
            'view_staff',
            'create_staff',
            'edit_staff',
            'delete_staff',
            
            // Maintenance management
            'manage_maintenance',
            'view_maintenance',
            'create_maintenance',
            'edit_maintenance',
            'assign_maintenance',
            'view_assigned_maintenance', // For technicians
            
            // Reports and analytics
            'view_reports',
            'view_analytics',
            'export_data',
            
            // Settings
            'manage_settings',
            'manage_categories',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // Create roles for tenant users
        $businessOwner = Role::firstOrCreate(['name' => 'business_owner']);
        $tenantAdmin = Role::firstOrCreate(['name' => 'tenant_admin']);
        $manager = Role::firstOrCreate(['name' => 'manager']);
        $salesman = Role::firstOrCreate(['name' => 'salesman']);
        $technician = Role::firstOrCreate(['name' => 'technician']);

        // Assign permissions to business owner (full access to their tenant)
        $businessOwner->syncPermissions(Permission::all());
        
        // Assign permissions to tenant admin (full access to their tenant)
        $tenantAdmin->syncPermissions(Permission::all());

        // Assign permissions to manager (most access except settings)
        $manager->syncPermissions([
            'view_products', 'create_products', 'edit_products', 'delete_products',
            'manage_customers', 'view_customers', 'create_customers', 'edit_customers', 'delete_customers',
            'manage_sales', 'view_sales', 'create_sales', 'process_pos',
            'view_staff', 'create_staff', 'edit_staff', 'delete_staff',
            'manage_maintenance', 'view_maintenance', 'create_maintenance', 'edit_maintenance', 'assign_maintenance',
            'view_reports', 'view_analytics',
            'manage_categories',
        ]);

        // Assign permissions to salesman (full access like tenant_admin)
        $salesman->syncPermissions(Permission::all());

        // Assign permissions to technician (only assigned maintenance)
        $technician->syncPermissions([
            'view_assigned_maintenance',
            'edit_maintenance',
        ]);
    }
}