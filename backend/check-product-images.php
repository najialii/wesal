<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

echo "Checking product images:\n";
echo str_repeat('=', 80) . "\n\n";

$products = DB::table('products')
    ->whereNotNull('image')
    ->limit(10)
    ->get();

if ($products->isEmpty()) {
    echo "❌ No products with images found in database!\n";
} else {
    echo "✓ Found {$products->count()} product(s) with images:\n\n";
    
    foreach ($products as $product) {
        echo "Product: {$product->name}\n";
        echo "  Image Path: {$product->image}\n";
        
        // Check if file exists
        $imagePath = str_replace('/storage/', '', $product->image);
        $imagePath = str_replace('storage/', '', $imagePath);
        
        if (Storage::disk('public')->exists($imagePath)) {
            echo "  ✓ File exists in storage\n";
            $fullPath = storage_path('app/public/' . $imagePath);
            echo "  Full path: {$fullPath}\n";
            echo "  File size: " . filesize($fullPath) . " bytes\n";
        } else {
            echo "  ❌ File NOT found in storage\n";
            echo "  Looking for: {$imagePath}\n";
        }
        
        echo "\n" . str_repeat('-', 80) . "\n\n";
    }
}

// Check if storage link exists
echo "Checking storage symlink:\n";
$publicStoragePath = public_path('storage');
if (file_exists($publicStoragePath)) {
    echo "✓ Storage symlink exists at: {$publicStoragePath}\n";
    if (is_link($publicStoragePath)) {
        echo "✓ It is a symbolic link\n";
        echo "  Points to: " . readlink($publicStoragePath) . "\n";
    } else {
        echo "⚠ It exists but is NOT a symbolic link\n";
    }
} else {
    echo "❌ Storage symlink does NOT exist!\n";
    echo "Run: php artisan storage:link\n";
}
