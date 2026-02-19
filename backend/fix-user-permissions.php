<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use Spatie\Permission\Models\Role;

echo "=== Fixing User Permissions ===\n\n";

// Get all tenant users (non-super-admin)
$users = User::where('is_super_admin', false)
    ->whereNotNull('tenant_id')
    ->get();

echo "Found " . $users->count() . " tenant users\n\n";

foreach ($users as $user) {
    echo "User: {$user->name} ({$user->email})\n";
    echo "  Tenant ID: {$user->tenant_id}\n";
    
    $currentRoles = $user->roles->pluck('name')->toArray();
    echo "  Current Roles: " . (empty($currentRoles) ? 'NONE' : implode(', ', $currentRoles)) . "\n";
    
    // If user has no role, assign tenant_admin
    if (empty($currentRoles)) {
        echo "  ⚠️  No role assigned! Assigning tenant_admin role...\n";
        $user->assignRole('tenant_admin');
        echo "  ✅ tenant_admin role assigned\n";
    }
    
    // Check permissions
    $permissions = $user->getAllPermissions()->pluck('name')->toArray();
    $hasCreateStaff = in_array('create_staff', $permissions);
    
    echo "  Has 'create_staff' permission: " . ($hasCreateStaff ? '✅ YES' : '❌ NO') . "\n";
    
    if (!$hasCreateStaff) {
        echo "  ⚠️  Missing create_staff permission! This will cause authorization errors.\n";
        echo "  💡 Make sure the role has the permission assigned.\n";
    }
    
    echo "\n";
}

echo "=== Done ===\n";
echo "\nIf you still have issues:\n";
echo "1. Log out and log back in\n";
echo "2. Clear browser cache\n";
echo "3. Check Laravel logs at storage/logs/laravel.log\n";
