<?php

namespace Database\Seeders;

use App\Models\MaintenanceProduct;
use App\Models\Tenant;
use Illuminate\Database\Seeder;

class MaintenanceProductSeeder extends Seeder
{
    public function run(): void
    {
        $tenants = Tenant::all();

        foreach ($tenants as $tenant) {
            // Check if maintenance products already exist for this tenant
            if (MaintenanceProduct::where('tenant_id', $tenant->id)->exists()) {
                $this->command->info("Maintenance products already exist for tenant {$tenant->id}, skipping...");
                continue;
            }

            $products = [
                [
                    'tenant_id' => $tenant->id,
                    'name' => 'Engine Oil 5W-30',
                    'sku' => 'OIL-5W30',
                    'description' => 'Synthetic engine oil for regular maintenance',
                    'cost_price' => 45.00,
                    'stock_quantity' => 50,
                    'unit' => 'liters',
                    'type' => 'consumable',
                    'is_active' => true,
                ],
                [
                    'tenant_id' => $tenant->id,
                    'name' => 'Air Filter',
                    'sku' => 'FILTER-AIR-001',
                    'description' => 'Standard air filter replacement',
                    'cost_price' => 25.00,
                    'stock_quantity' => 30,
                    'unit' => 'pcs',
                    'type' => 'spare_part',
                    'is_active' => true,
                ],
                [
                    'tenant_id' => $tenant->id,
                    'name' => 'Brake Pads Set',
                    'sku' => 'BRAKE-PAD-001',
                    'description' => 'Front brake pads set',
                    'cost_price' => 85.00,
                    'stock_quantity' => 20,
                    'unit' => 'set',
                    'type' => 'spare_part',
                    'is_active' => true,
                ],
                [
                    'tenant_id' => $tenant->id,
                    'name' => 'Coolant Fluid',
                    'sku' => 'COOL-FLUID-001',
                    'description' => 'Engine coolant fluid',
                    'cost_price' => 15.00,
                    'stock_quantity' => 40,
                    'unit' => 'liters',
                    'type' => 'chemical',
                    'is_active' => true,
                ],
                [
                    'tenant_id' => $tenant->id,
                    'name' => 'Spark Plugs',
                    'sku' => 'SPARK-PLUG-001',
                    'description' => 'Standard spark plugs',
                    'cost_price' => 12.00,
                    'stock_quantity' => 60,
                    'unit' => 'pcs',
                    'type' => 'spare_part',
                    'is_active' => true,
                ],
                [
                    'tenant_id' => $tenant->id,
                    'name' => 'Transmission Fluid',
                    'sku' => 'TRANS-FLUID-001',
                    'description' => 'Automatic transmission fluid',
                    'cost_price' => 55.00,
                    'stock_quantity' => 25,
                    'unit' => 'liters',
                    'type' => 'consumable',
                    'is_active' => true,
                ],
                [
                    'tenant_id' => $tenant->id,
                    'name' => 'Battery 12V',
                    'sku' => 'BATT-12V-001',
                    'description' => '12V car battery',
                    'cost_price' => 120.00,
                    'stock_quantity' => 15,
                    'unit' => 'pcs',
                    'type' => 'spare_part',
                    'is_active' => true,
                ],
                [
                    'tenant_id' => $tenant->id,
                    'name' => 'Wiper Blades',
                    'sku' => 'WIPER-001',
                    'description' => 'Front wiper blades pair',
                    'cost_price' => 18.00,
                    'stock_quantity' => 35,
                    'unit' => 'pair',
                    'type' => 'spare_part',
                    'is_active' => true,
                ],
            ];

            foreach ($products as $product) {
                MaintenanceProduct::create($product);
            }
        }

        $this->command->info('Maintenance products seeded successfully!');
    }
}
