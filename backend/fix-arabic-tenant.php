<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Tenant;
use App\Models\Branch;

$tenant = Tenant::where('slug', 'riyadh-tech')->first();

if (!$tenant) {
    echo "❌ Arabic tenant not found\n";
    exit(1);
}

$branch = Branch::create([
    'tenant_id' => $tenant->id,
    'name' => 'الفرع الرئيسي',
    'code' => 'MAIN',
    'is_default' => true,
    'is_active' => true,
]);

echo "✅ Created branch: {$branch->name}\n";

foreach ($tenant->users as $user) {
    $user->branches()->attach($branch->id, ['is_manager' => true]);
    echo "✅ Assigned {$user->name} to branch\n";
}

echo "\n✅ Arabic tenant fixed!\n";
