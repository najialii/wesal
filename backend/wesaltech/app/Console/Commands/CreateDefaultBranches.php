<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Tenant;
use App\Models\Branch;
use App\Models\User;

class CreateDefaultBranches extends Command
{
    protected $signature = 'branches:create-default {tenant_id?}';
    protected $description = 'Create default branches for a tenant';

    public function handle()
    {
        $tenantId = $this->argument('tenant_id');
        
        if ($tenantId) {
            $tenant = Tenant::find($tenantId);
            if (!$tenant) {
                $this->error("Tenant with ID {$tenantId} not found.");
                return 1;
            }
            $tenants = collect([$tenant]);
        } else {
            $tenants = Tenant::all();
        }

        foreach ($tenants as $tenant) {
            $this->info("Creating branches for tenant: {$tenant->name} (ID: {$tenant->id})");
            
            // Check if tenant already has branches
            $existingBranches = $tenant->branches()->count();
            if ($existingBranches > 0) {
                $this->info("Tenant already has {$existingBranches} branches. Skipping...");
                continue;
            }

            // Create default branch
            $defaultBranch = Branch::create([
                'tenant_id' => $tenant->id,
                'name' => 'Main Branch',
                'code' => 'MAIN',
                'address' => '123 Main Street',
                'city' => 'Main City',
                'phone' => '+1234567890',
                'email' => 'main@' . strtolower(str_replace(' ', '', $tenant->name)) . '.com',
                'is_default' => true,
                'is_active' => true,
            ]);

            // Create additional branches
            $branches = [
                [
                    'name' => 'Downtown Branch',
                    'code' => 'DT',
                    'address' => '456 Downtown Ave',
                    'city' => 'Downtown',
                    'phone' => '+1234567891',
                    'email' => 'downtown@' . strtolower(str_replace(' ', '', $tenant->name)) . '.com',
                ],
                [
                    'name' => 'North Branch',
                    'code' => 'NB',
                    'address' => '789 North Road',
                    'city' => 'North District',
                    'phone' => '+1234567892',
                    'email' => 'north@' . strtolower(str_replace(' ', '', $tenant->name)) . '.com',
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

            // Assign business owners to all branches
            $businessOwners = User::where('tenant_id', $tenant->id)
                                ->whereHas('roles', function($query) {
                                    $query->where('name', 'business_owner');
                                })
                                ->get();

            foreach ($businessOwners as $owner) {
                foreach ($createdBranches as $branch) {
                    $owner->branches()->syncWithoutDetaching([
                        $branch->id => ['is_manager' => true]
                    ]);
                }
            }

            $this->info("Created {$createdBranches->count()} branches for tenant: {$tenant->name}");
            foreach ($createdBranches as $branch) {
                $this->line("  - {$branch->name} ({$branch->code})");
            }
        }

        $this->info('Branch creation completed!');
        return 0;
    }
}