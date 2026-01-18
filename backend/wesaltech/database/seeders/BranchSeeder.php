<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Tenant;
use App\Models\Branch;
use App\Models\User;
use App\Models\Product;
use App\Models\Sale;
use App\Models\StockTransfer;
use Carbon\Carbon;

class BranchSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all tenants
        $tenants = Tenant::all();

        foreach ($tenants as $tenant) {
            // Skip if tenant already has multiple branches
            if ($tenant->branches()->count() > 1) {
                continue;
            }

            // Get the default branch
            $defaultBranch = $tenant->branches()->where('is_default', true)->first();

            // Create additional branches
            $branches = [
                [
                    'name' => 'Downtown Branch',
                    'code' => 'DT',
                    'address' => '123 Main Street',
                    'city' => 'City Center',
                    'phone' => '+1234567890',
                    'email' => 'downtown@' . strtolower(str_replace(' ', '', $tenant->name)) . '.com',
                ],
                [
                    'name' => 'North Branch',
                    'code' => 'NB',
                    'address' => '456 North Avenue',
                    'city' => 'North District',
                    'phone' => '+1234567891',
                    'email' => 'north@' . strtolower(str_replace(' ', '', $tenant->name)) . '.com',
                ],
                [
                    'name' => 'South Branch',
                    'code' => 'SB',
                    'address' => '789 South Road',
                    'city' => 'South District',
                    'phone' => '+1234567892',
                    'email' => 'south@' . strtolower(str_replace(' ', '', $tenant->name)) . '.com',
                ],
            ];

            $createdBranches = collect([$defaultBranch]);

            foreach ($branches as $branchData) {
                $branch = Branch::create([
                    'tenant_id' => $tenant->id,
                    'name' => $branchData['name'],
                    'code' => $branchData['code'],
                    'address' => $branchData['address'],
                    'city' => $branchData['city'],
                    'phone' => $branchData['phone'],
                    'email' => $branchData['email'],
                    'is_default' => false,
                    'is_active' => true,
                ]);

                $createdBranches->push($branch);
            }

            // Assign users to branches
            $users = User::where('tenant_id', $tenant->id)->get();
            foreach ($users as $user) {
                // Owners get all branches
                if ($user->hasRole('owner')) {
                    foreach ($createdBranches as $branch) {
                        $user->branches()->syncWithoutDetaching([
                            $branch->id => ['is_manager' => true]
                        ]);
                    }
                } else {
                    // Staff get assigned to 1-2 random branches
                    $assignedBranches = $createdBranches->random(rand(1, 2));
                    foreach ($assignedBranches as $branch) {
                        $user->branches()->syncWithoutDetaching([
                            $branch->id => ['is_manager' => rand(0, 1) === 1]
                        ]);
                    }
                }
            }

            // Assign products to branches with different stock levels
            $products = Product::where('tenant_id', $tenant->id)->get();
            foreach ($products as $product) {
                foreach ($createdBranches as $branch) {
                    // Randomly assign products to branches (80% chance)
                    if (rand(1, 100) <= 80) {
                        $product->branches()->syncWithoutDetaching([
                            $branch->id => [
                                'stock_quantity' => rand(10, 100),
                                'min_stock_level' => rand(5, 15),
                                'max_stock_level' => rand(100, 200),
                                'branch_price' => $product->selling_price * (1 + (rand(-10, 10) / 100)), // ±10% price variation
                            ]
                        ]);
                    }
                }
            }

            // Create sample stock transfers
            if ($createdBranches->count() >= 2) {
                $fromBranch = $createdBranches->random();
                $toBranch = $createdBranches->where('id', '!=', $fromBranch->id)->random();
                $product = $products->random();

                // Pending transfer
                StockTransfer::create([
                    'tenant_id' => $tenant->id,
                    'product_id' => $product->id,
                    'from_branch_id' => $fromBranch->id,
                    'to_branch_id' => $toBranch->id,
                    'quantity' => rand(5, 20),
                    'status' => 'pending',
                    'initiated_by' => $users->first()->id,
                    'notes' => 'Sample pending transfer',
                ]);

                // Completed transfer
                StockTransfer::create([
                    'tenant_id' => $tenant->id,
                    'product_id' => $product->id,
                    'from_branch_id' => $fromBranch->id,
                    'to_branch_id' => $toBranch->id,
                    'quantity' => rand(5, 20),
                    'status' => 'completed',
                    'initiated_by' => $users->first()->id,
                    'completed_by' => $users->first()->id,
                    'completed_at' => Carbon::now()->subDays(rand(1, 7)),
                    'notes' => 'Sample completed transfer',
                ]);
            }

            // Update existing sales to assign them to branches
            $sales = Sale::where('tenant_id', $tenant->id)
                        ->whereNull('branch_id')
                        ->get();

            foreach ($sales as $sale) {
                $sale->update([
                    'branch_id' => $createdBranches->random()->id
                ]);
            }

            $this->command->info("Created multi-branch test data for tenant: {$tenant->name}");
        }
    }
}
