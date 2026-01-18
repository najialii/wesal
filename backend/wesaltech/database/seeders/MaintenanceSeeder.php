<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Tenant;
use App\Models\MaintenanceProduct;
use App\Models\MaintenanceContract;
use App\Models\MaintenanceVisit;
use App\Models\Sale;
use App\Models\Product;
use App\Models\Worker;

class MaintenanceSeeder extends Seeder
{
    public function run(): void
    {
        $tenants = Tenant::all();

        foreach ($tenants as $tenant) {
            // Check if maintenance products already exist for this tenant
            if (MaintenanceProduct::where('tenant_id', $tenant->id)->exists()) {
                continue; // Skip if already seeded
            }

            // Create maintenance products
            $maintenanceProducts = [
                [
                    'name' => 'Engine Oil Filter',
                    'sku' => 'MNT-OF-' . $tenant->id . '-001',
                    'description' => 'High-quality oil filter for regular maintenance',
                    'cost_price' => 25.00,
                    'stock_quantity' => 100,
                    'unit' => 'pcs',
                    'type' => 'spare_part',
                ],
                [
                    'name' => 'Air Filter',
                    'sku' => 'MNT-AF-' . $tenant->id . '-001',
                    'description' => 'Air filter for equipment maintenance',
                    'cost_price' => 15.00,
                    'stock_quantity' => 80,
                    'unit' => 'pcs',
                    'type' => 'spare_part',
                ],
                [
                    'name' => 'Hydraulic Fluid',
                    'sku' => 'MNT-HF-' . $tenant->id . '-001',
                    'description' => 'Premium hydraulic fluid for heavy equipment',
                    'cost_price' => 45.00,
                    'stock_quantity' => 50,
                    'unit' => 'liters',
                    'type' => 'consumable',
                ],
                [
                    'name' => 'Brake Pads Set',
                    'sku' => 'MNT-BP-' . $tenant->id . '-001',
                    'description' => 'Complete brake pads set for maintenance',
                    'cost_price' => 85.00,
                    'stock_quantity' => 30,
                    'unit' => 'set',
                    'type' => 'spare_part',
                ],
                [
                    'name' => 'Cleaning Solvent',
                    'sku' => 'MNT-CS-' . $tenant->id . '-001',
                    'description' => 'Industrial cleaning solvent',
                    'cost_price' => 20.00,
                    'stock_quantity' => 60,
                    'unit' => 'liters',
                    'type' => 'chemical',
                ],
                [
                    'name' => 'Grease Gun',
                    'sku' => 'MNT-GG-' . $tenant->id . '-001',
                    'description' => 'Professional grease gun for maintenance',
                    'cost_price' => 35.00,
                    'stock_quantity' => 15,
                    'unit' => 'pcs',
                    'type' => 'tool',
                ],
            ];

            foreach ($maintenanceProducts as $productData) {
                MaintenanceProduct::create([
                    'tenant_id' => $tenant->id,
                    ...$productData,
                ]);
            }

            // Create sample maintenance contracts if there are sales and products
            $sales = Sale::where('tenant_id', $tenant->id)->limit(3)->get();
            $products = Product::where('tenant_id', $tenant->id)->limit(5)->get();
            $workers = Worker::where('tenant_id', $tenant->id)->where('is_active', true)->get();

            if ($sales->isNotEmpty() && $products->isNotEmpty()) {
                foreach ($sales as $sale) {
                    $product = $products->random();
                    
                    // Check if contract already exists for this sale
                    if (MaintenanceContract::where('sale_id', $sale->id)->exists()) {
                        continue;
                    }
                    
                    // Create maintenance contract
                    $contract = MaintenanceContract::create([
                        'tenant_id' => $tenant->id,
                        'sale_id' => $sale->id,
                        'product_id' => $product->id,
                        'customer_name' => $sale->customer_name,
                        'customer_phone' => $sale->customer_phone,
                        'frequency' => collect(['monthly', 'quarterly', 'semi_annual'])->random(),
                        'start_date' => now()->addDays(rand(1, 30)),
                        'end_date' => now()->addYear(),
                        'contract_value' => rand(500, 2000),
                        'status' => 'active',
                    ]);

                    // Create some maintenance visits
                    $visitStatuses = ['scheduled', 'in_progress', 'completed'];
                    $priorities = ['low', 'medium', 'high'];
                    
                    for ($i = 0; $i < rand(2, 5); $i++) {
                        $scheduledDate = now()->addDays($i * 30 + rand(-5, 5));
                        $status = $visitStatuses[array_rand($visitStatuses)];
                        
                        $visit = MaintenanceVisit::create([
                            'tenant_id' => $tenant->id,
                            'maintenance_contract_id' => $contract->id,
                            'assigned_worker_id' => $workers->isNotEmpty() ? $workers->random()->id : null,
                            'scheduled_date' => $scheduledDate,
                            'status' => $status,
                            'priority' => $priorities[array_rand($priorities)],
                            'work_description' => 'Regular maintenance check and service',
                        ]);

                        // If visit is completed, add some completion data
                        if ($status === 'completed') {
                            $visit->update([
                                'actual_start_time' => $scheduledDate->copy()->addHours(rand(8, 16)),
                                'actual_end_time' => $scheduledDate->copy()->addHours(rand(8, 16))->addHours(rand(1, 4)),
                                'completion_notes' => 'Maintenance completed successfully. All systems checked and serviced.',
                                'customer_rating' => rand(4, 5),
                                'total_cost' => rand(100, 500),
                            ]);
                        } elseif ($status === 'in_progress') {
                            $visit->update([
                                'actual_start_time' => now()->subHours(rand(1, 3)),
                            ]);
                        }
                    }
                }
            }
        }
    }
}