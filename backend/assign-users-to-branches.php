<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Tenant;

$tenants = Tenant::with('users', 'branches')->get();

foreach ($tenants as $tenant) {
    $branch = $tenant->branches->first();
    
    if (!$branch) {
        echo "⚠️  No branch found for tenant: {$tenant->name}\n";
        continue;
    }
    
    echo "Processing tenant: {$tenant->name}\n";
    
    foreach ($tenant->users as $user) {
        if (!$user->branches()->where('branch_id', $branch->id)->exists()) {
            $user->branches()->attach($branch->id, [
                'is_manager' => $user->isTenantAdmin()
            ]);
            echo "  ✅ Assigned {$user->name} to {$branch->name}\n";
        } else {
            echo "  ℹ️  {$user->name} already assigned to {$branch->name}\n";
        }
    }
}

echo "\n✅ All users assigned to branches!\n";
