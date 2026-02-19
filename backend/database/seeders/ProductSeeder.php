<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;
use App\Models\Category;
use App\Models\Tenant;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $tenant = Tenant::first();
        if (!$tenant) {
            return;
        }

        $category = Category::firstOrCreate([
            'tenant_id' => $tenant->id,
            'name' => 'Electronics'
        ], [
            'description' => 'Electronic products',
            'is_active' => true
        ]);

        $products = [
            [
                'name' => 'Samsung Galaxy S24',
                'sku' => 'SGS24-001',
                'barcode' => '1234567890123',
                'description' => 'Latest Samsung smartphone with advanced features',
                'cost_price' => 800.00,
                'selling_price' => 1200.00,
                'stock_quantity' => 25,
                'min_stock_level' => 5,
                'unit' => 'piece',
                'tax_rate' => 15.00,
                'image' => 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&h=500&fit=crop',
            ],
            [
                'name' => 'iPhone 15 Pro',
                'sku' => 'IP15P-001',
                'barcode' => '1234567890124',
                'description' => 'Apple iPhone 15 Pro with titanium design',
                'cost_price' => 900.00,
                'selling_price' => 1400.00,
                'stock_quantity' => 15,
                'min_stock_level' => 3,
                'unit' => 'piece',
                'tax_rate' => 15.00,
                'image' => 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500&h=500&fit=crop',
            ],
            [
                'name' => 'MacBook Air M3',
                'sku' => 'MBA-M3-001',
                'barcode' => '1234567890125',
                'description' => 'Apple MacBook Air with M3 chip',
                'cost_price' => 1000.00,
                'selling_price' => 1500.00,
                'stock_quantity' => 10,
                'min_stock_level' => 2,
                'unit' => 'piece',
                'tax_rate' => 15.00,
                'image' => 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&h=500&fit=crop',
            ],
            [
                'name' => 'Sony WH-1000XM5',
                'sku' => 'SONY-WH5-001',
                'barcode' => '1234567890126',
                'description' => 'Premium noise-canceling headphones',
                'cost_price' => 200.00,
                'selling_price' => 350.00,
                'stock_quantity' => 30,
                'min_stock_level' => 5,
                'unit' => 'piece',
                'tax_rate' => 15.00,
                'image' => 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop',
            ],
            [
                'name' => 'iPad Pro 12.9"',
                'sku' => 'IPP-129-001',
                'barcode' => '1234567890127',
                'description' => 'Apple iPad Pro with M2 chip',
                'cost_price' => 800.00,
                'selling_price' => 1200.00,
                'stock_quantity' => 8,
                'min_stock_level' => 2,
                'unit' => 'piece',
                'tax_rate' => 15.00,
                'image' => 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&h=500&fit=crop',
            ],
            [
                'name' => 'Dell XPS 13',
                'sku' => 'DELL-XPS13-001',
                'barcode' => '1234567890128',
                'description' => 'Dell XPS 13 ultrabook',
                'cost_price' => 700.00,
                'selling_price' => 1100.00,
                'stock_quantity' => 12,
                'min_stock_level' => 3,
                'unit' => 'piece',
                'tax_rate' => 15.00,
                'image' => 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&h=500&fit=crop',
            ],
            [
                'name' => 'Custom Product A',
                'sku' => 'CUSTOM-A-001',
                'barcode' => '1234567890129',
                'description' => 'Custom product without image to test fallback',
                'cost_price' => 50.00,
                'selling_price' => 75.00,
                'stock_quantity' => 20,
                'min_stock_level' => 5,
                'unit' => 'piece',
                'tax_rate' => 15.00,
                'image' => null, // No image to test fallback
            ],
            [
                'name' => 'Test Product B',
                'sku' => 'TEST-B-001',
                'barcode' => '1234567890130',
                'description' => 'Another test product without image',
                'cost_price' => 25.00,
                'selling_price' => 40.00,
                'stock_quantity' => 15,
                'min_stock_level' => 3,
                'unit' => 'piece',
                'tax_rate' => 15.00,
                'image' => null, // No image to test fallback
            ]
        ];

        foreach ($products as $productData) {
            Product::updateOrCreate(
                [
                    'tenant_id' => $tenant->id,
                    'sku' => $productData['sku']
                ],
                array_merge($productData, [
                    'tenant_id' => $tenant->id,
                    'category_id' => $category->id,
                    'is_active' => true
                ])
            );
        }
    }
}