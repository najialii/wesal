<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use App\Models\AuditLog;
use Illuminate\Support\Facades\DB;

echo "Backfilling audit logs for existing users...\n\n";

// Get all users except super admin
$users = User::whereNotNull('tenant_id')->get();

echo "Found {$users->count()} users to process\n\n";

$created = 0;

foreach ($users as $user) {
    // Check if account creation log already exists
    $existingLog = AuditLog::where('user_id', $user->id)
        ->where('action', 'LIKE', 'account_created%')
        ->first();
    
    if ($existingLog) {
        echo "✓ User {$user->email} already has account creation log\n";
        continue;
    }
    
    // Determine if it was Google or regular registration
    $action = $user->google_id ? 'account_created_google' : 'account_created';
    $provider = $user->google_id ? 'google' : 'email';
    
    // Create audit log for account creation
    AuditLog::create([
        'user_id' => $user->id,
        'user_name' => $user->name,
        'user_email' => $user->email,
        'tenant_id' => $user->tenant_id,
        'action' => $action,
        'resource_type' => 'user',
        'resource_id' => (string)$user->id,
        'method' => 'POST',
        'url' => '/api/auth/' . ($user->google_id ? 'google' : 'register'),
        'ip_address' => '127.0.0.1',
        'user_agent' => 'System Backfill',
        'request_data' => [
            'email' => $user->email,
            'name' => $user->name,
            'provider' => $provider,
            'backfilled' => true,
        ],
        'response_status' => 201,
        'performed_at' => $user->created_at,
    ]);
    
    $created++;
    echo "✓ Created audit log for {$user->email} (registered: {$user->created_at})\n";
    
    // If user has last_login_at, create a login log too
    if ($user->last_login_at) {
        AuditLog::create([
            'user_id' => $user->id,
            'user_name' => $user->name,
            'user_email' => $user->email,
            'tenant_id' => $user->tenant_id,
            'action' => $user->google_id ? 'login_google' : 'login',
            'resource_type' => 'user',
            'resource_id' => (string)$user->id,
            'method' => 'POST',
            'url' => '/api/auth/login',
            'ip_address' => '127.0.0.1',
            'user_agent' => 'System Backfill',
            'request_data' => [
                'email' => $user->email,
                'backfilled' => true,
            ],
            'response_status' => 200,
            'performed_at' => $user->last_login_at,
        ]);
        
        echo "  ✓ Created login log (last login: {$user->last_login_at})\n";
    }
}

echo "\n✅ Backfill complete! Created audit logs for {$created} users.\n";
