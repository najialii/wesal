<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "Checking audit logs in database:\n";
echo str_repeat('=', 80) . "\n\n";

// Check if audit_logs table exists
try {
    $logs = DB::table('audit_logs')
        ->join('users', 'audit_logs.user_id', '=', 'users.id')
        ->select(
            'audit_logs.id',
            'audit_logs.user_id',
            'users.name as user_name',
            'users.email as user_email',
            'users.tenant_id',
            'audit_logs.action',
            'audit_logs.description',
            'audit_logs.created_at'
        )
        ->orderBy('audit_logs.created_at', 'desc')
        ->limit(10)
        ->get();

    if ($logs->isEmpty()) {
        echo "❌ No audit logs found in database!\n\n";
        echo "This is normal if you just set up the system.\n";
        echo "Audit logs will be created when users perform actions like:\n";
        echo "  - Login\n";
        echo "  - Create/Update/Delete products\n";
        echo "  - Create/Update/Delete categories\n";
        echo "  - Create/Update/Delete branches\n";
        echo "  - etc.\n\n";
        
        // Create a test audit log
        echo "Creating a test audit log...\n";
        DB::table('audit_logs')->insert([
            'user_id' => 1, // Assuming admin user ID is 1
            'action' => 'test_action',
            'entity_type' => 'test',
            'entity_id' => null,
            'description' => 'Test audit log entry',
            'ip_address' => '127.0.0.1',
            'user_agent' => 'Test Script',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        echo "✓ Test audit log created!\n";
    } else {
        echo "✓ Found {$logs->count()} audit log(s):\n\n";
        
        foreach ($logs as $log) {
            echo "Log ID: {$log->id}\n";
            echo "  User: {$log->user_name} ({$log->user_email})\n";
            echo "  Tenant ID: {$log->tenant_id}\n";
            echo "  Action: {$log->action}\n";
            echo "  Description: {$log->description}\n";
            echo "  Created: {$log->created_at}\n";
            echo "\n" . str_repeat('-', 80) . "\n\n";
        }
    }
} catch (\Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "\nThe audit_logs table might not exist yet.\n";
}
