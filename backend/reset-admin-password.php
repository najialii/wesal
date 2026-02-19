<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;

$email = 'admin@wesaltech.com';
$password = '11235813nJ';

$user = User::where('email', $email)->first();

if ($user) {
    $user->password = Hash::make($password);
    $user->save();
    
    echo "✅ Password reset successfully!\n";
    echo "Email: {$email}\n";
    echo "Password: {$password}\n";
    echo "\nTesting password...\n";
    
    if (Hash::check($password, $user->password)) {
        echo "✅ Password verification: SUCCESS\n";
    } else {
        echo "❌ Password verification: FAILED\n";
    }
} else {
    echo "❌ User not found: {$email}\n";
}
