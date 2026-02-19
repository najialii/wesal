<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\Branch;

class FixBranchAssignments extends Command
{
    protected $signature = 'branches:fix-assignments';
    protected $description = 'Fix branch assignments for business owners';

    public function handle()
    {
        $this->info('Fixing branch assignments for business owners...');

        // Get all business owners
        $businessOwners = User::whereHas('roles', function($query) {
            $query->whereIn('name', ['business_owner', 'business_admin', 'tenant_admin']);
        })->get();

        foreach ($businessOwners as $user) {
            $this->info("Processing user: {$user->name} (ID: {$user->id})");
            
            // Get all branches for this user's tenant
            $tenantBranches = Branch::where('tenant_id', $user->tenant_id)->get();
            
            $this->info("Found {$tenantBranches->count()} branches for tenant {$user->tenant_id}");
            
            foreach ($tenantBranches as $branch) {
                // Check if user is already assigned to this branch
                if (!$user->branches()->where('branches.id', $branch->id)->exists()) {
                    // Assign user to branch as manager
                    $user->branches()->attach($branch->id, ['is_manager' => true]);
                    $this->info("Assigned user to branch: {$branch->name}");
                } else {
                    $this->info("User already assigned to branch: {$branch->name}");
                }
            }
        }

        // Also handle users without roles but who are tenant owners
        $usersWithoutRoles = User::whereDoesntHave('roles')
            ->whereNotNull('tenant_id')
            ->get();

        foreach ($usersWithoutRoles as $user) {
            // Check if they're the tenant creator
            if ($user->tenant && $user->tenant->created_by === $user->id) {
                $this->info("Found tenant owner without role: {$user->name}");
                
                // Assign business_owner role
                $user->assignRole('business_owner');
                $this->info("Assigned business_owner role to {$user->name}");
                
                // Assign to all tenant branches
                $tenantBranches = Branch::where('tenant_id', $user->tenant_id)->get();
                foreach ($tenantBranches as $branch) {
                    if (!$user->branches()->where('branches.id', $branch->id)->exists()) {
                        $user->branches()->attach($branch->id, ['is_manager' => true]);
                        $this->info("Assigned user to branch: {$branch->name}");
                    }
                }
            }
        }

        $this->info('Branch assignment fix completed!');
    }
}