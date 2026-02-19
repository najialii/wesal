<?php

// Fix branch access issues for maintenance contracts
// Run this on the server: php fix-branch-access.php

require_once '/var/www/wesaltech/backend/wesaltech/vendor/autoload.php';

// Bootstrap Laravel
$app = require_once '/var/www/wesaltech/backend/wesaltech/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use App\Models\Branch;
use App\Models\Tenant;

echo "Fixing branch access issues...\n";

// Get all tenants
$tenants = Tenant::all();

foreach ($tenants as $tenant) {
    echo "Processing tenant: {$tenant->name} (ID: {$tenant->id})\n