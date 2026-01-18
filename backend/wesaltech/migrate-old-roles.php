<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use Spatie\Permission\Models\Role;

echo "=== Migrating Old Roles to New Roles ===\n\n";

// Role mapping
$roleMapping = [
    'employee' => 'salesman',
    'business_owner' => 'tenant_admin',
    'admin' => 'tenant_admin',
    'manager' => 'manager',
];

// Get all tenant users
$users = User::where('is_super_admin', false)
    ->whereNotNull('tenant_id')
    ->with('roles')
    ->get();

echo "Found " . $users->count() . " tenant users to migrate\n\n";

$migrated = 0;
$skipped = 0;

foreach ($users as $user) {
    $currentRoles = $user->roles->pluck('name')->toArray();
    
    if (empty($currentRoles)) {
        echo "⚠️  {$user->name} ({$user->email}) - No role, assigning tenant_admin\n";
        $user->syncRoles(['tenant_admin']);
        $migrated++;
        continue;
    }
    
    $oldRole = $currentRoles[0];
    
    // Check if role needs migration
    if (in_array($oldRole, ['tenant_admin', 'manager', 'salesman'])) {
        echo "✅ {$user->name} - Already has correct role: {$oldRole}\n";
        $skipped++;
        continue;
    }
    
    // Map old role to new role
    $newRole = $roleMapping[$oldRole] ?? 'salesman';
    
    echo "🔄 {$user->name} ({$user->email})\n";
    echo "   Old role: {$oldRole} → New role: {$newRole}\n";
    
    $user->syncRoles([$newRole]);
    $migrated++;
}

echo "\n=== Migration Complete ===\n";
echo "✅ Migrated: {$migrated} users\n";
echo "⏭️  Skipped: {$skipped} users (already correct)\n";
echo "\n🎉 All users now have the correct roles with proper permissions!\n";
echo "\nNext steps:\n";
echo "1. Log out and log back in\n";
echo "2. Try adding a staff member again\n";
