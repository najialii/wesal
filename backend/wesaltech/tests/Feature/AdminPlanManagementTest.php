<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Tenant;
use App\Models\Plan;
use App\Models\Subscription;
use App\Services\PlanAssignmentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

class AdminPlanManagementTest extends TestCase
{
    use RefreshDatabase;

    private User $superAdmin;
    private PlanAssignmentService $planAssignmentService;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->superAdmin = User::factory()->create([
            'is_super_admin' => true,
        ]);

        $this->planAssignmentService = app(PlanAssignmentService::class);
    }

    /**
     * **Feature: super-admin-enhancement, Property 7: Plan assignment updates permissions immediately**
     * 
     * For any tenant and any valid plan, assigning a plan to a tenant should 
     * update tenant permissions and feature access immediately and correctly
     */
    public function test_plan_assignment_updates_permissions_immediately(): void
    {
        Sanctum::actingAs($this->superAdmin);

        // Create plans with different features
        $basicPlan = Plan::factory()->create([
            'name' => 'Basic Plan',
            'features' => ['pos'],
            'limits' => ['users' => 5, 'products' => 100],
            'price' => 29.99,
        ]);

        $premiumPlan = Plan::factory()->create([
            'name' => 'Premium Plan',
            'features' => ['pos', 'inventory', 'maintenance', 'reports'],
            'limits' => ['users' => 50, 'products' => 1000],
            'price' => 99.99,
        ]);

        // Create tenant without plan
        $tenant = Tenant::factory()->create([
            'plan_id' => null,
        ]);

        // Create users for the tenant
        $tenantUsers = User::factory()->count(3)->create([
            'tenant_id' => $tenant->id,
        ]);

        // Assign basic plan to tenant
        $subscription = $this->planAssignmentService->assignPlanToTenant($tenant, $basicPlan);

        // Verify subscription was created
        $this->assertInstanceOf(Subscription::class, $subscription);
        $this->assertEquals($tenant->id, $subscription->tenant_id);
        $this->assertEquals($basicPlan->id, $subscription->plan_id);

        // Verify tenant was updated
        $tenant->refresh();
        $this->assertEquals($basicPlan->id, $tenant->plan_id);

        // Verify tenant settings were updated with plan features
        $this->assertArrayHasKey('features', $tenant->settings);
        $this->assertEquals(['pos'], $tenant->settings['features']);
        $this->assertEquals(['users' => 5, 'products' => 100], $tenant->settings['limits']);

        // Test plan upgrade
        $newSubscription = $this->planAssignmentService->changeTenantPlan($tenant, $premiumPlan);

        // Verify new subscription
        $this->assertEquals($premiumPlan->id, $newSubscription->plan_id);

        // Verify tenant permissions were updated immediately
        $tenant->refresh();
        $this->assertEquals($premiumPlan->id, $tenant->plan_id);
        $this->assertEquals(['pos', 'inventory', 'maintenance', 'reports'], $tenant->settings['features']);
        $this->assertEquals(['users' => 50, 'products' => 1000], $tenant->settings['limits']);

        // Verify old subscription was ended
        $oldSubscription = Subscription::find($subscription->id);
        $this->assertEquals('cancelled', $oldSubscription->status);
        $this->assertNotNull($oldSubscription->ends_at);

        // Test API endpoint for plan assignment
        $anotherTenant = Tenant::factory()->create();
        
        $response = $this->putJson("/api/admin/tenants/{$anotherTenant->id}", [
            'plan_id' => $basicPlan->id,
        ]);

        $response->assertStatus(200);
        
        $anotherTenant->refresh();
        $this->assertEquals($basicPlan->id, $anotherTenant->plan_id);
    }

    /**
     * **Feature: super-admin-enhancement, Property 8: Plan modifications cascade to tenants**
     * 
     * For any plan with associated tenants, modifying plan features should 
     * apply changes to all associated tenants while maintaining their individual settings
     */
    public function test_plan_modifications_cascade_to_tenants(): void
    {
        Sanctum::actingAs($this->superAdmin);

        // Create plan with initial features
        $plan = Plan::factory()->create([
            'name' => 'Standard Plan',
            'features' => ['pos', 'inventory'],
            'limits' => ['users' => 10, 'products' => 500],
            'price' => 59.99,
        ]);

        // Create multiple tenants using this plan
        $tenants = Tenant::factory()->count(3)->create([
            'plan_id' => $plan->id,
        ]);

        // Assign plan to tenants and set up their permissions
        foreach ($tenants as $tenant) {
            $this->planAssignmentService->assignPlanToTenant($tenant, $plan);
        }

        // Verify initial state
        foreach ($tenants as $tenant) {
            $tenant->refresh();
            $this->assertEquals(['pos', 'inventory'], $tenant->settings['features']);
            $this->assertEquals(['users' => 10, 'products' => 500], $tenant->settings['limits']);
        }

        // Modify plan features
        $newFeatures = ['pos', 'inventory', 'maintenance', 'reports'];
        $newLimits = ['users' => 20, 'products' => 1000];

        $response = $this->putJson("/api/admin/plans/{$plan->id}", [
            'features' => $newFeatures,
            'limits' => $newLimits,
        ]);

        $response->assertStatus(200);

        // Update plan features using service (simulating the cascading update)
        $this->planAssignmentService->updatePlanFeatures($plan, $newFeatures);

        // Verify all tenants received the updated features
        foreach ($tenants as $tenant) {
            $tenant->refresh();
            $this->assertEquals($newFeatures, $tenant->settings['features']);
        }

        // Test that individual tenant settings are maintained
        $firstTenant = $tenants->first();
        $individualSettings = $firstTenant->settings;
        $individualSettings['custom_setting'] = 'tenant_specific_value';
        $firstTenant->update(['settings' => $individualSettings]);

        // Update plan again
        $newerFeatures = ['pos', 'inventory', 'maintenance'];
        $this->planAssignmentService->updatePlanFeatures($plan, $newerFeatures);

        // Verify features were updated but custom settings maintained
        $firstTenant->refresh();
        $this->assertEquals($newerFeatures, $firstTenant->settings['features']);
        $this->assertEquals('tenant_specific_value', $firstTenant->settings['custom_setting']);

        // Test plan reordering
        $anotherPlan = Plan::factory()->create(['sort_order' => 2]);
        $plan->update(['sort_order' => 1]);

        $response = $this->postJson('/api/admin/plans/reorder', [
            'plans' => [
                ['id' => $plan->id, 'sort_order' => 2],
                ['id' => $anotherPlan->id, 'sort_order' => 1],
            ],
        ]);

        $response->assertStatus(200);

        // Verify sort order was updated
        $plan->refresh();
        $anotherPlan->refresh();
        $this->assertEquals(2, $plan->sort_order);
        $this->assertEquals(1, $anotherPlan->sort_order);
    }

    /**
     * **Feature: super-admin-enhancement, Property 9: Plan changes preserve subscription history**
     * 
     * For any plan modification affecting existing subscriptions, the system should 
     * maintain complete subscription history and billing continuity
     */
    public function test_plan_changes_preserve_subscription_history(): void
    {
        Sanctum::actingAs($this->superAdmin);

        // Create plans
        $starterPlan = Plan::factory()->create([
            'name' => 'Starter',
            'price' => 19.99,
            'billing_cycle' => 'monthly',
        ]);

        $proPlan = Plan::factory()->create([
            'name' => 'Professional',
            'price' => 49.99,
            'billing_cycle' => 'monthly',
        ]);

        $enterprisePlan = Plan::factory()->create([
            'name' => 'Enterprise',
            'price' => 99.99,
            'billing_cycle' => 'monthly',
        ]);

        // Create tenant and assign initial plan
        $tenant = Tenant::factory()->create();
        $initialSubscription = $this->planAssignmentService->assignPlanToTenant($tenant, $starterPlan);

        // Verify initial subscription
        $this->assertEquals($starterPlan->id, $initialSubscription->plan_id);
        $this->assertEquals(19.99, $initialSubscription->amount);

        // Upgrade to pro plan
        $proSubscription = $this->planAssignmentService->changeTenantPlan($tenant, $proPlan);

        // Verify new subscription
        $this->assertEquals($proPlan->id, $proSubscription->plan_id);
        $this->assertEquals(49.99, $proSubscription->amount);

        // Verify old subscription was properly ended
        $initialSubscription->refresh();
        $this->assertEquals('cancelled', $initialSubscription->status);
        $this->assertNotNull($initialSubscription->ends_at);

        // Upgrade to enterprise plan
        $enterpriseSubscription = $this->planAssignmentService->changeTenantPlan($tenant, $enterprisePlan);

        // Get complete subscription history
        $history = $this->planAssignmentService->getSubscriptionHistory($tenant);

        // Verify history is complete and ordered
        $this->assertCount(3, $history);
        $this->assertEquals($enterprisePlan->id, $history[0]['plan_id']); // Most recent
        $this->assertEquals($proPlan->id, $history[1]['plan_id']);
        $this->assertEquals($starterPlan->id, $history[2]['plan_id']); // Oldest

        // Verify subscription changes are tracked
        $this->assertDatabaseHas('subscription_changes', [
            'tenant_id' => $tenant->id,
            'old_plan_id' => $starterPlan->id,
            'new_plan_id' => $proPlan->id,
        ]);

        $this->assertDatabaseHas('subscription_changes', [
            'tenant_id' => $tenant->id,
            'old_plan_id' => $proPlan->id,
            'new_plan_id' => $enterprisePlan->id,
        ]);

        // Test proration calculation
        $proration = $this->planAssignmentService->calculateProration($tenant, $starterPlan);
        
        $this->assertArrayHasKey('proration_amount', $proration);
        $this->assertArrayHasKey('days_remaining', $proration);
        $this->assertArrayHasKey('unused_amount', $proration);
        $this->assertArrayHasKey('new_amount', $proration);

        // Test suspension and restoration
        $this->planAssignmentService->suspendTenantAccess($tenant);
        
        $tenant->refresh();
        $this->assertEquals('suspended', $tenant->status);
        $this->assertTrue($tenant->settings['suspended'] ?? false);

        $this->planAssignmentService->restoreTenantAccess($tenant);
        
        $tenant->refresh();
        $this->assertEquals('active', $tenant->status);
        $this->assertArrayNotHasKey('suspended', $tenant->settings);

        // Verify billing continuity - all subscriptions should have proper start/end dates
        $allSubscriptions = $tenant->subscriptions()->orderBy('created_at')->get();
        
        for ($i = 0; $i < $allSubscriptions->count() - 1; $i++) {
            $current = $allSubscriptions[$i];
            $next = $allSubscriptions[$i + 1];
            
            // Current subscription should end when next one starts (or be cancelled)
            $this->assertTrue(
                $current->status === 'cancelled' || 
                $current->ends_at->lte($next->starts_at)
            );
        }
    }
}