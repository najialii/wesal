<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "Checking branches in database:\n";
echo str_repeat('=', 80) . "\n\n";

$branches = DB::table('branches')->get();

if ($branches->isEmpty()) {
    echo "❌ No branches found in database!\n";
} else {
    echo "✓ Found {$branches->count()} branch(es):\n\n";
    
    foreach ($branches as $branch) {
        echo "Branch ID: {$branch->id}\n";
        echo "  Name: {$branch->name}\n";
        echo "  Code: {$branch->code}\n";
        echo "  Address: " . ($branch->address ?: 'NULL') . "\n";
        echo "  City: " . ($branch->city ?: 'NULL') . "\n";
        echo "  Phone: " . ($branch->phone ?: 'NULL') . "\n";
        echo "  Email: " . ($branch->email ?: 'NULL') . "\n";
        echo "  Tenant ID: {$branch->tenant_id}\n";
        echo "  Is Default: " . ($branch->is_default ? 'Yes' : 'No') . "\n";
        echo "  Is Active: " . ($branch->is_active ? 'Yes' : 'No') . "\n";
        echo "  Created: {$branch->created_at}\n";
        echo "\n" . str_repeat('-', 80) . "\n\n";
    }
}
