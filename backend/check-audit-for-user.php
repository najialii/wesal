<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\DB;

$email = 'najialii249@gmail.com';

echo "Checking audit logs for: $email\n\n";

$user = User::where('email', $email)->first();

if (!$user) {
    echo "User not found!\n";
    exit(1);
}

echo "User ID: {$user->id}\n";
echo "User Name: {$user->name}\n";
echo "Tenant ID: {$user->tenant_id}\n";
echo "Tenant Name: {$user->tenant->name}\n\n";

// Check audit logs for this tenant
$auditLogs = DB::table('audit_logs')
    ->where('tenant_id', $user->tenant_id)
    ->orderBy('created_at', 'desc')
    ->get();

echo "Total audit logs for tenant: " . $auditLogs->count() . "\n\n";

if ($auditLogs->count() > 0) {
    echo "Recent audit logs:\n";
    foreach ($auditLogs->take(10) as $log) {
        echo "- [{$log->performed_at}] {$log->action} by {$log->user_name} ({$log->user_email})\n";
    }
} else {
    echo "No audit logs found.\n\n";
    echo "Checking if audit middleware is working...\n";
    
    // Check routes with audit middleware
    $routes = app('router')->getRoutes();
    $auditRoutes = [];
    foreach ($routes as $route) {
        if (in_array('audit', $route->middleware())) {
            $auditRoutes[] = $route->uri();
        }
    }
    
    echo "Routes with audit middleware: " . count($auditRoutes) . "\n";
    if (count($auditRoutes) > 0) {
        echo "Sample routes:\n";
        foreach (array_slice($auditRoutes, 0, 5) as $uri) {
            echo "  - $uri\n";
        }
    }
}
