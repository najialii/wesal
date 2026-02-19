<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Product;

echo "Testing product image URL accessor:\n\n";

$product = Product::whereNotNull('image')->first();

if (!$product) {
    echo "No products with images found!\n";
    exit(1);
}

echo "Product: {$product->name}\n";
echo "Image field: {$product->image}\n";
echo "Image URL accessor: {$product->image_url}\n\n";

echo "JSON output:\n";
echo json_encode($product->only(['id', 'name', 'image', 'image_url']), JSON_PRETTY_PRINT);
echo "\n";
