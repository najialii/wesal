<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;

$email = 'najitest@test22.com';

echo "Checking user: {$email}\n";
echo str_repeat('=', 50) . "\n\n";

$user = User::where('email', $email)->first();

if (!$user) {
    echo "❌ User not found!\n";
    exit(1);
}

echo "✓ User found!\n\n";
echo "User Details:\n";
echo "  ID: {$user->id}\n";
echo "  Name: {$user->name}\n";
echo "  Email: {$user->email}\n";
echo "  Role: {$user->role}\n";
echo "  Onboarding Completed: " . ($user->onboarding_completed ? '✓ YES' : '❌ NO') . "\n";
echo "  Tenant ID: " . ($user->tenant_id ?? 'None') . "\n";
echo "  Created: {$user->created_at}\n";
echo "  Updated: {$user->updated_at}\n\n";

// Check if business owner
$isBusinessOwner = $user->role === 'business_owner';
echo "Is Business Owner: " . ($isBusinessOwner ? '✓ YES' : '❌ NO') . "\n";

// Check onboarding status
$hasCompletedOnboarding = $user->onboarding_completed == 1;
echo "Has Completed Onboarding: " . ($hasCompletedOnboarding ? '✓ YES' : '❌ NO') . "\n\n";

// If business owner, check for associated business
if ($isBusinessOwner && $user->tenant_id) {
    echo "Tenant/Business Information:\n";
    $tenant = \App\Models\Tenant::find($user->tenant_id);
    if ($tenant) {
        echo "  Business Name: {$tenant->name}\n";
        echo "  Domain: {$tenant->domain}\n";
        echo "  Created: {$tenant->created_at}\n";
    }
}

echo "\n" . str_repeat('=', 50) . "\n";
echo "Summary:\n";
if ($isBusinessOwner && $hasCompletedOnboarding) {
    echo "✓ User is a Business Owner and has completed onboarding\n";
} elseif ($isBusinessOwner && !$hasCompletedOnboarding) {
    echo "⚠ User is a Business Owner but has NOT completed onboarding\n";
} elseif (!$isBusinessOwner && $hasCompletedOnboarding) {
    echo "⚠ User has completed onboarding but is NOT a Business Owner (Role: {$user->role})\n";
} else {
    echo "❌ User is NOT a Business Owner and has NOT completed onboarding\n";
}
