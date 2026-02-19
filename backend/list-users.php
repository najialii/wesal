<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;

echo "Recent users:\n\n";

$users = User::orderBy('created_at', 'desc')->take(10)->get();

foreach ($users as $user) {
    echo "ID: {$user->id} | Email: {$user->email} | Name: {$user->name} | Tenant: {$user->tenant_id}\n";
}
