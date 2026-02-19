<?php

namespace App\Services;

use App\Models\Plan;
use App\Models\Tenant;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PlanAssignmentService
{
    public function assignPlanToTenant(Tenant $tenant, Plan $plan, array $options = []): Subscription
    {
        return DB::transaction(function () use ($tenant, $plan, $options) {
            // Create new subscription
            $subscription = Subscription::create([
                'tenant_id' => $tenant->id,
                'plan_id' => $plan->id,
                'amount' => $plan->price,
                'billing_cycle' => $plan->billing_cycle,
                'payment_status' => $options['payment_status'] ?? 'pending',
                'starts_at' => $options['starts_at'] ?? now(),
                'ends_at' => $this->calculateEndDate($plan, $options['starts_at'] ?? now()),
            ]);

            // Update tenant's plan
            $tenant->update([
                'plan_id' => $plan->id,
            ]);

            // Update tenant permissions based on new plan
            $this->updateTenantPermissions($tenant, $plan);

            // Log the assignment
            Log::info("Plan {$plan->name} assigned to tenant {$tenant->name}", [
                'tenant_id' => $tenant->id,
                'plan_id' => $plan->id,
                'subscription_id' => $subscription->id,
            ]);

            return $subscription;
        });
    }

    public function updatePlanFeatures(Plan $plan, array $newFeatures): void
    {
        DB::transaction(function () use ($plan, $newFeatures) {
            $oldFeatures = $plan->features;
            
            // Update the plan
            $plan->update(['features' => $newFeatures]);

            // Apply changes to all tenants using this plan
            $tenants = Tenant::where('plan_id', $plan->id)->get();
            
            foreach ($tenants as $tenant) {
                $this->updateTenantPermissions($tenant, $plan);
                
                Log::info("Updated permissions for tenant {$tenant->name} due to plan feature changes", [
                    'tenant_id' => $tenant->id,
                    'plan_id' => $plan->id,
                    'old_features' => $oldFeatures,
                    'new_features' => $newFeatures,
                ]);
            }
        });
    }

    public function changeTenantPlan(Tenant $tenant, Plan $newPlan, array $options = []): Subscription
    {
        return DB::transaction(function () use ($tenant, $newPlan, $options) {
            $oldPlan = $tenant->plan;
            
            // Create subscription history entry
            if ($tenant->subscriptions()->exists()) {
                $currentSubscription = $tenant->subscriptions()->latest()->first();
                $currentSubscription->update([
                    'ends_at' => now(),
                    'status' => 'cancelled',
                ]);
            }

            // Create new subscription
            $newSubscription = $this->assignPlanToTenant($tenant, $newPlan, $options);

            // Maintain subscription history for billing continuity
            $this->maintainSubscriptionHistory($tenant, $oldPlan, $newPlan);

            return $newSubscription;
        });
    }

    private function updateTenantPermissions(Tenant $tenant, Plan $plan): void
    {
        // Update feature access based on plan features
        $features = $plan->features ?? [];
        $limits = $plan->limits ?? [];

        // Update tenant settings with new feature access
        $tenantSettings = $tenant->settings ?? [];
        $tenantSettings['features'] = $features;
        $tenantSettings['limits'] = $limits;
        
        $tenant->update(['settings' => $tenantSettings]);

        // Update user permissions for all tenant users
        $users = User::where('tenant_id', $tenant->id)->get();
        
        foreach ($users as $user) {
            $this->updateUserPermissions($user, $features, $limits);
        }
    }

    private function updateUserPermissions(User $user, array $features, array $limits): void
    {
        // Remove all existing permissions
        $user->permissions()->detach();

        // Assign permissions based on features
        $permissionsToAssign = [];

        if (in_array('pos', $features)) {
            $permissionsToAssign[] = 'use_pos';
        }

        if (in_array('inventory', $features)) {
            $permissionsToAssign[] = 'manage_inventory';
        }

        if (in_array('maintenance', $features)) {
            $permissionsToAssign[] = 'manage_maintenance';
        }

        if (in_array('reports', $features)) {
            $permissionsToAssign[] = 'view_reports';
        }

        // Assign new permissions
        foreach ($permissionsToAssign as $permission) {
            $user->givePermissionTo($permission);
        }
    }

    private function calculateEndDate(Plan $plan, $startDate)
    {
        $start = is_string($startDate) ? \Carbon\Carbon::parse($startDate) : $startDate;

        return match ($plan->billing_cycle) {
            'monthly' => $start->addMonth(),
            'yearly' => $start->addYear(),
            'lifetime' => null,
            default => $start->addMonth(),
        };
    }

    private function maintainSubscriptionHistory(Tenant $tenant, ?Plan $oldPlan, Plan $newPlan): void
    {
        // Create a record of the plan change for billing continuity
        DB::table('subscription_changes')->insert([
            'tenant_id' => $tenant->id,
            'old_plan_id' => $oldPlan?->id,
            'new_plan_id' => $newPlan->id,
            'changed_at' => now(),
            'reason' => 'Plan upgrade/downgrade',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function getSubscriptionHistory(Tenant $tenant): array
    {
        return $tenant->subscriptions()
            ->with(['plan'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->toArray();
    }

    public function calculateProration(Tenant $tenant, Plan $newPlan): array
    {
        $currentSubscription = $tenant->subscriptions()->latest()->first();
        
        if (!$currentSubscription) {
            return [
                'proration_amount' => 0,
                'days_remaining' => 0,
                'new_amount' => $newPlan->price,
            ];
        }

        $daysRemaining = now()->diffInDays($currentSubscription->ends_at, false);
        $daysInCycle = $currentSubscription->starts_at->diffInDays($currentSubscription->ends_at);
        
        $unusedAmount = ($currentSubscription->amount / $daysInCycle) * max(0, $daysRemaining);
        $prorationAmount = $newPlan->price - $unusedAmount;

        return [
            'proration_amount' => round($prorationAmount, 2),
            'days_remaining' => max(0, $daysRemaining),
            'unused_amount' => round($unusedAmount, 2),
            'new_amount' => $newPlan->price,
        ];
    }

    public function suspendTenantAccess(Tenant $tenant): void
    {
        // Disable all features for suspended tenant
        $tenantSettings = $tenant->settings ?? [];
        $tenantSettings['suspended'] = true;
        $tenantSettings['features'] = [];
        
        $tenant->update([
            'settings' => $tenantSettings,
            'status' => 'suspended',
        ]);

        // Revoke permissions from all tenant users
        $users = User::where('tenant_id', $tenant->id)->get();
        
        foreach ($users as $user) {
            $user->permissions()->detach();
        }

        Log::info("Suspended access for tenant {$tenant->name}", [
            'tenant_id' => $tenant->id,
        ]);
    }

    public function restoreTenantAccess(Tenant $tenant): void
    {
        $tenant->update(['status' => 'active']);

        // Restore permissions based on current plan
        if ($tenant->plan) {
            $this->updateTenantPermissions($tenant, $tenant->plan);
        }

        // Remove suspension flag
        $tenantSettings = $tenant->settings ?? [];
        unset($tenantSettings['suspended']);
        $tenant->update(['settings' => $tenantSettings]);

        Log::info("Restored access for tenant {$tenant->name}", [
            'tenant_id' => $tenant->id,
        ]);
    }
}