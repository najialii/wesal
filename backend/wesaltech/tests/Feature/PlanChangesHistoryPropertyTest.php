<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Plan;
use App\Models\Tenant;
use App\Models\Subscription;
use App\Models\SubscriptionChange;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Carbon\Carbon;

class PlanChangesHistoryPropertyTest extends TestCase
{
    use RefreshDatabase;

    private User $superAdmin;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->superAdmin = User::factory()->create([
            'role' => 'super_admin',
            'email' => 'admin@wesaltech.com'
        ]);
    }

    /**
     * Property 9: Plan changes preserve subscription history
     * 
     * @test
     */
    public function test_plan_modifications_preserve_subscription_history()
    {
        // Create initial plan and tenant with subscription
        $originalPlan = Plan::factory()->create([
            'name' => 'Basic Plan',
            'price' => 29.99,
            'features' => ['pos', 'inventory'],
            'max_users' => 5
        ]);

        $tenant = Tenant::factory()->create();
        
        $subscription = Subscription::factory()->create([
            'tenant_id' => $tenant->id,
            'plan_id' => $originalPlan->id,
            'status' => 'active',
            'started_at' => now()->subDays(30),
            'price' => $originalPlan->price
        ]);

        // Property: When plan is modified, existing subscription history should be preserved
        $updatedPlanData = [
            'name' => 'Basic Plan Updated',
            'price' => 39.99,
            'features' => ['pos', 'inventory', 'reports'],
            'max_users' => 10
        ];

        $response = $this->actingAs($this->superAdmin)
            ->putJson("/api/admin/plans/{$originalPlan->id}", $updatedPlanData);

        $response->assertStatus(200);

        // Verify original subscription data is preserved
        $subscription->refresh();
        $this->assertEquals($originalPlan->id, $subscription->plan_id);
        $this->assertEquals(29.99, $subscription->price); // Original price preserved
        $this->assertEquals('active', $subscription->status);
        $this->assertNotNull($subscription->started_at);

        // Verify subscription change is recorded
        $this->assertDatabaseHas('subscription_changes', [
            'subscription_id' => $subscription->id,
            'from_plan_id' => $originalPlan->id,
            'to_plan_id' => $originalPlan->id, // Same plan, just modified
            'change_type' => 'plan_modified',
            'old_price' => 29.99,
            'new_price' => 39.99
        ]);
    }

    /**
     * @test
     */
    public function test_plan_feature_changes_create_history_records()
    {
        $plan = Plan::factory()->create([
            'features' => ['pos', 'inventory'],
            'max_users' => 5,
            'max_storage' => 1024
        ]);

        $tenant = Tenant::factory()->create();
        $subscription = Subscription::factory()->create([
            'tenant_id' => $tenant->id,
            'plan_id' => $plan->id
        ]);

        // Property: Feature changes should be tracked in subscription history
        $updatedFeatures = ['pos', 'inventory', 'advanced_reports', 'api_access'];
        
        $response = $this->actingAs($this->superAdmin)
            ->putJson("/api/admin/plans/{$plan->id}", [
                'name' => $plan->name,
                'price' => $plan->price,
                'features' => $updatedFeatures,
                'max_users' => 25, // Also change user limit
                'max_storage' => 5120
            ]);

        $response->assertStatus(200);

        // Verify subscription change record includes feature changes
        $subscriptionChange = SubscriptionChange::where('subscription_id', $subscription->id)
            ->where('change_type', 'plan_modified')
            ->first();

        $this->assertNotNull($subscriptionChange);
        
        $changeDetails = json_decode($subscriptionChange->change_details, true);
        $this->assertArrayHasKey('features', $changeDetails);
        $this->assertArrayHasKey('max_users', $changeDetails);
        $this->assertArrayHasKey('max_storage', $changeDetails);
        
        $this->assertEquals(['pos', 'inventory'], $changeDetails['features']['old']);
        $this->assertEquals($updatedFeatures, $changeDetails['features']['new']);
        $this->assertEquals(5, $changeDetails['max_users']['old']);
        $this->assertEquals(25, $changeDetails['max_users']['new']);
    }

    /**
     * @test
     */
    public function test_plan_price_changes_maintain_billing_history()
    {
        $plan = Plan::factory()->create(['price' => 49.99]);
        $tenant = Tenant::factory()->create();
        
        // Create subscription with billing history
        $subscription = Subscription::factory()->create([
            'tenant_id' => $tenant->id,
            'plan_id' => $plan->id,
            'price' => $plan->price,
            'started_at' => now()->subMonths(3)
        ]);

        // Property: Price changes should preserve billing history and create new records
        $newPrice = 59.99;
        
        $response = $this->actingAs($this->superAdmin)
            ->putJson("/api/admin/plans/{$plan->id}", [
                'name' => $plan->name,
                'price' => $newPrice,
                'features' => $plan->features,
                'max_users' => $plan->max_users,
                'max_storage' => $plan->max_storage
            ]);

        $response->assertStatus(200);

        // Original subscription should maintain historical price
        $subscription->refresh();
        $this->assertEquals(49.99, $subscription->price);

        // New subscription change should record price change
        $priceChange = SubscriptionChange::where('subscription_id', $subscription->id)
            ->where('change_type', 'plan_modified')
            ->first();

        $this->assertNotNull($priceChange);
        $this->assertEquals(49.99, $priceChange->old_price);
        $this->assertEquals(59.99, $priceChange->new_price);
        $this->assertEquals($this->superAdmin->id, $priceChange->changed_by);
    }

    /**
     * @test
     */
    public function test_plan_deletion_preserves_subscription_history()
    {
        $plan = Plan::factory()->create(['name' => 'Legacy Plan']);
        $tenant = Tenant::factory()->create();
        
        $subscription = Subscription::factory()->create([
            'tenant_id' => $tenant->id,
            'plan_id' => $plan->id,
            'status' => 'active',
            'started_at' => now()->subMonths(6)
        ]);

        // Property: Plan deletion should preserve all subscription history
        $response = $this->actingAs($this->superAdmin)
            ->deleteJson("/api/admin/plans/{$plan->id}");

        $response->assertStatus(200);

        // Plan should be soft deleted
        $plan->refresh();
        $this->assertNotNull($plan->deleted_at);

        // Subscription history should be preserved
        $subscription->refresh();
        $this->assertEquals($plan->id, $subscription->plan_id);
        $this->assertEquals('cancelled', $subscription->status); // Should be cancelled
        $this->assertNotNull($subscription->started_at);
        $this->assertNotNull($subscription->ended_at);

        // Deletion should be recorded in subscription changes
        $this->assertDatabaseHas('subscription_changes', [
            'subscription_id' => $subscription->id,
            'from_plan_id' => $plan->id,
            'to_plan_id' => null,
            'change_type' => 'plan_deleted',
            'changed_by' => $this->superAdmin->id
        ]);
    }

    /**
     * @test
     */
    public function test_bulk_plan_changes_maintain_individual_histories()
    {
        $plans = Plan::factory()->count(3)->create();
        $tenants = Tenant::factory()->count(3)->create();
        
        $subscriptions = [];
        foreach ($plans as $index => $plan) {
            $subscriptions[] = Subscription::factory()->create([
                'tenant_id' => $tenants[$index]->id,
                'plan_id' => $plan->id,
                'price' => $plan->price
            ]);
        }

        // Property: Bulk plan changes should maintain individual subscription histories
        $bulkUpdateData = [
            'plan_ids' => $plans->pluck('id')->toArray(),
            'changes' => [
                'price_increase_percentage' => 20,
                'add_features' => ['new_feature']
            ]
        ];

        $response = $this->actingAs($this->superAdmin)
            ->putJson('/api/admin/plans/bulk-update', $bulkUpdateData);

        $response->assertStatus(200);

        // Each subscription should have its own change record
        foreach ($subscriptions as $subscription) {
            $this->assertDatabaseHas('subscription_changes', [
                'subscription_id' => $subscription->id,
                'change_type' => 'bulk_plan_modified',
                'changed_by' => $this->superAdmin->id
            ]);
        }

        // Original subscription data should be preserved
        foreach ($subscriptions as $subscription) {
            $subscription->refresh();
            $this->assertNotNull($subscription->started_at);
            $this->assertEquals('active', $subscription->status);
        }
    }

    /**
     * @test
     */
    public function test_subscription_history_includes_plan_snapshots()
    {
        $plan = Plan::factory()->create([
            'name' => 'Professional Plan',
            'features' => ['pos', 'inventory', 'reports'],
            'max_users' => 15
        ]);

        $tenant = Tenant::factory()->create();
        $subscription = Subscription::factory()->create([
            'tenant_id' => $tenant->id,
            'plan_id' => $plan->id
        ]);

        // Property: Subscription history should include plan snapshots at time of change
        $response = $this->actingAs($this->superAdmin)
            ->putJson("/api/admin/plans/{$plan->id}", [
                'name' => 'Professional Plan Enhanced',
                'features' => ['pos', 'inventory', 'reports', 'analytics', 'api'],
                'max_users' => 50,
                'price' => $plan->price,
                'max_storage' => $plan->max_storage
            ]);

        $response->assertStatus(200);

        $subscriptionChange = SubscriptionChange::where('subscription_id', $subscription->id)
            ->where('change_type', 'plan_modified')
            ->first();

        $this->assertNotNull($subscriptionChange);
        
        // Should include complete plan snapshot
        $planSnapshot = json_decode($subscriptionChange->plan_snapshot, true);
        $this->assertArrayHasKey('name', $planSnapshot);
        $this->assertArrayHasKey('features', $planSnapshot);
        $this->assertArrayHasKey('max_users', $planSnapshot);
        $this->assertEquals('Professional Plan', $planSnapshot['name']);
        $this->assertEquals(['pos', 'inventory', 'reports'], $planSnapshot['features']);
        $this->assertEquals(15, $planSnapshot['max_users']);
    }

    /**
     * @test
     */
    public function test_subscription_history_tracks_effective_dates()
    {
        $plan = Plan::factory()->create();
        $tenant = Tenant::factory()->create();
        
        $subscription = Subscription::factory()->create([
            'tenant_id' => $tenant->id,
            'plan_id' => $plan->id,
            'started_at' => now()->subDays(30)
        ]);

        // Property: Subscription changes should track effective dates
        $futureEffectiveDate = now()->addDays(7);
        
        $response = $this->actingAs($this->superAdmin)
            ->putJson("/api/admin/plans/{$plan->id}", [
                'name' => $plan->name,
                'price' => $plan->price + 10,
                'features' => $plan->features,
                'max_users' => $plan->max_users,
                'max_storage' => $plan->max_storage,
                'effective_date' => $futureEffectiveDate->toDateString()
            ]);

        $response->assertStatus(200);

        $subscriptionChange = SubscriptionChange::where('subscription_id', $subscription->id)
            ->where('change_type', 'plan_modified')
            ->first();

        $this->assertNotNull($subscriptionChange);
        $this->assertEquals(
            $futureEffectiveDate->toDateString(),
            $subscriptionChange->effective_date->toDateString()
        );
        $this->assertEquals('pending', $subscriptionChange->status);
    }

    /**
     * @test
     */
    public function test_subscription_history_audit_trail()
    {
        $plan = Plan::factory()->create();
        $tenant = Tenant::factory()->create();
        
        $subscription = Subscription::factory()->create([
            'tenant_id' => $tenant->id,
            'plan_id' => $plan->id
        ]);

        // Property: All subscription changes should create comprehensive audit trail
        $response = $this->actingAs($this->superAdmin)
            ->putJson("/api/admin/plans/{$plan->id}", [
                'name' => $plan->name . ' Updated',
                'price' => $plan->price,
                'features' => $plan->features,
                'max_users' => $plan->max_users,
                'max_storage' => $plan->max_storage
            ]);

        $response->assertStatus(200);

        // Should create audit log entry
        $this->assertDatabaseHas('audit_logs', [
            'user_id' => $this->superAdmin->id,
            'action' => 'plan_updated',
            'resource_type' => 'plan',
            'resource_id' => $plan->id
        ]);

        // Should create subscription change record
        $subscriptionChange = SubscriptionChange::where('subscription_id', $subscription->id)->first();
        $this->assertNotNull($subscriptionChange);
        $this->assertEquals($this->superAdmin->id, $subscriptionChange->changed_by);
        $this->assertNotNull($subscriptionChange->changed_at);
        $this->assertNotNull($subscriptionChange->change_details);
    }
}