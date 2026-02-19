<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Testing Google Auth Backend...\n\n";

// Test database connection
try {
    DB::connection()->getPdo();
    echo "✓ Database connected\n";
} catch (Exception $e) {
    echo "✗ Database connection failed: " . $e->getMessage() . "\n";
    exit(1);
}

// Test if roles exist
$roles = DB::table('roles')->pluck('name')->toArray();
echo "✓ Roles found: " . implode(', ', $roles) . "\n";

// Simulate Google auth data
$googleData = [
    'google_id' => '104938467566064483134',
    'email' => 'najialii249@gmail.com',
    'name' => 'Naji Ali',
    'avatar' => 'https://lh3.googleusercontent.com/a/ACg8ocKlerDWYarnwS7BTX7R0a9FGbmkFk6N3Rbaa0w0Il7LKGd8ZdQU=s96-c',
];

echo "\nTesting with data:\n";
print_r($googleData);

// Check if user exists
$existingUser = DB::table('users')->where('email', $googleData['email'])->first();
if ($existingUser) {
    echo "\n✓ User already exists with ID: " . $existingUser->id . "\n";
} else {
    echo "\n✓ User does not exist, would create new user\n";
}

echo "\nBackend test completed successfully!\n";
