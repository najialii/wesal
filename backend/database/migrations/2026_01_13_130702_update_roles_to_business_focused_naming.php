<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Clean up old roles and create new business-focused roles
        
        // First, remove role assignments from users to avoid foreign key issues
        \DB::table('model_has_roles')->truncate();
        \DB::table('role_has_permissions')->truncate();
        
        // Delete old roles
        Role::whereIn('name', ['super_admin', 'admin', 'staff', 'user', 'tenant_admin', 'salesman'])->delete();
        
        // Delete old permissions that are no longer needed
        Permission::whereNotIn('name', [
            'view_dashboard', 'manage_users', 'manage_products', 'manage_categories', 
            'manage_customers', 'manage_sales', 'manage_maintenance', 'view_reports', 'manage_settings'
        ])->delete();
        
        // Run the updated RoleSeeder to create new roles and permissions
        \Artisan::call('db:seed', ['--class' => 'RoleSeeder']);
        
        // Update existing users with appropriate new roles
        $this->updateUserRoles();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert to old role structure if needed
        \DB::table('model_has_roles')->truncate();
        \DB::table('role_has_permissions')->truncate();
        
        // Delete new roles
        Role::whereIn('name', ['system_admin', 'business_owner', 'technician', 'salesperson', 'employee'])->delete();
        
        // Recreate old roles
        $oldRoles = ['super_admin', 'admin', 'manager', 'staff', 'user', 'tenant_admin', 'salesman'];
        foreach ($oldRoles as $role) {
            Role::firstOrCreate(['name' => $role]);
        }
    }
    
    private function updateUserRoles(): void
    {
        // Update super admin users
        User::where('is_super_admin', true)->each(function ($user) {
            $user->assignRole('system_admin');
        });
        
        // Update tenant admin users (business owners)
        User::whereHas('tenant', function ($query) {
            $query->whereColumn('admin_user_id', 'users.id');
        })->each(function ($user) {
            if (!$user->is_super_admin) {
                $user->assignRole('business_owner');
            }
        });
        
        // Update other users with default employee role
        User::whereDoesntHave('roles')
            ->where('is_super_admin', false)
            ->each(function ($user) {
                $user->assignRole('employee');
            });
    }
};
