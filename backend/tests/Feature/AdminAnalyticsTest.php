<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Tenant;
use App\Models\Plan;
use App\Models\Subscription;
use App\Services\AnalyticsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

class AdminAnalyticsTest extends TestCase
{
    use RefreshDatabase;

    private User $superAdmin;
    private AnalyticsService $analyticsService;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->superAdmin = User::factory()->create([
            'is_super_admin' => true,
        ]);

        $this->analyticsService = app(AnalyticsService::class);
    }

    /**
     * **Feature: super-admin-enhancement, Property 10: Analytics dashboard displays comprehensive metrics**
     * 
     * For any system state with tenant data, the analytics dashboard should display 
     * real-time metrics, tenant statistics, usage patterns, and resource consumption 
     * accurately aggregated while maintaining privacy boundaries
     */
    public function test_analytics_dashboard_displays_comprehensive_metrics(): void
    {
        Sanctum::actingAs($this->superAdmin);

        // Create test data with various scenarios
        $plans = Plan::factory()->count(3)->create();
        
        // Create tenants with different statuses
        $activeTenants = Tenant::factory()->count(5)->create([
            'status' => 'active',
            'plan_id' => $plans->random()->id,
        ]);
        
        $suspendedTenants = Tenant::factory()->count(2)->create([
            'status' => 'suspended',
            'plan_id' => $plans->random()->id,
        ]);
        
        $cancelledTenants = Tenant::factory()->count(1)->create([
            'status' => 'cancelled',
            'plan_id' => $plans->random()->id,
        ]);

        // Create users for tenants
        foreach ($activeTenants as $tenant) {
            User::factory()->count(rand(2, 5))->create([
                'tenant_id' => $tenant->id,
            ]);
        }

        // Create subscriptions with different payment statuses
        foreach ($activeTenants as $tenant) {
            Subscription::factory()->create([
                'tenant_id' => $tenant->id,
                'plan_id' => $tenant->plan_id,
                'payment_status' => 'paid',
                'amount' => rand(100, 1000),
            ]);
        }

        // Create some unpaid subscriptions
        Subscription::factory()->count(2)->create([
            'tenant_id' => $activeTenants->random()->id,
            'plan_id' => $plans->random()->id,
            'payment_status' => 'pending',
            'amount' => rand(100, 500),
        ]);

        // Test analytics dashboard endpoint
        $response = $this->getJson('/api/admin/analytics/dashboard');
        $response->assertStatus(200);

        $data = $response->json();

        // Verify response structure
        $this->assertArrayHasKey('overview', $data);
        $this->assertArrayHasKey('revenue', $data);
        $this->assertArrayHasKey('growth', $data);
        $this->assertArrayHasKey('recent_activity', $data);
        $this->assertArrayHasKey('performance', $data);

        // Verify overview metrics
        $overview = $data['overview'];
        $this->assertArrayHasKey('total_tenants', $overview);
        $this->assertArrayHasKey('active_tenants', $overview);
        $this->assertArrayHasKey('suspended_tenants', $overview);
        $this->assertArrayHasKey('total_users', $overview);
        $this->assertArrayHasKey('total_revenue', $overview);
        $this->assertArrayHasKey('monthly_revenue', $overview);

        // Verify metrics accuracy
        $this->assertEquals(8, $overview['total_tenants']); // 5 + 2 + 1
        $this->assertEquals(5, $overview['active_tenants']);
        $this->assertEquals(2, $overview['suspended_tenants']);
        $this->assertGreaterThan(0, $overview['total_users']);
        $this->assertGreaterThan(0, $overview['total_revenue']);

        // Verify revenue data structure
        $revenue = $data['revenue'];
        $this->assertArrayHasKey('monthly', $revenue);
        $this->assertArrayHasKey('by_plan', $revenue);
        $this->assertIsArray($revenue['monthly']);
        $this->assertIsArray($revenue['by_plan']);

        // Verify growth data
        $growth = $data['growth'];
        $this->assertArrayHasKey('tenants', $growth);
        $this->assertArrayHasKey('users', $growth);
        $this->assertIsArray($growth['tenants']);
        $this->assertIsArray($growth['users']);

        // Verify recent activity
        $recentActivity = $data['recent_activity'];
        $this->assertArrayHasKey('tenants', $recentActivity);
        $this->assertArrayHasKey('subscriptions', $recentActivity);
        $this->assertIsArray($recentActivity['tenants']);
        $this->assertIsArray($recentActivity['subscriptions']);

        // Test tenant metrics endpoint with filters
        $response = $this->getJson('/api/admin/analytics/tenant-metrics?status=active');
        $response->assertStatus(200);
        
        $tenantMetrics = $response->json();
        $this->assertArrayHasKey('status_distribution', $tenantMetrics);
        $this->assertArrayHasKey('plan_distribution', $tenantMetrics);
        $this->assertArrayHasKey('trial_status', $tenantMetrics);

        // Test privacy boundaries - ensure no sensitive tenant data is exposed
        foreach ($data['recent_activity']['tenants'] as $tenantData) {
            $this->assertArrayNotHasKey('settings', $tenantData);
            $this->assertArrayNotHasKey('api_keys', $tenantData);
        }
    }

    /**
     * **Feature: super-admin-enhancement, Property 11: Report generation with proper formatting**
     * 
     * For any report configuration and date range, the system should generate reports 
     * in the specified format with proper date range filtering and locale-appropriate formatting
     */
    public function test_report_generation_with_proper_formatting(): void
    {
        Sanctum::actingAs($this->superAdmin);

        // Create test data for reports
        $plan = Plan::factory()->create();
        $tenants = Tenant::factory()->count(3)->create([
            'plan_id' => $plan->id,
            'status' => 'active',
        ]);

        foreach ($tenants as $tenant) {
            Subscription::factory()->create([
                'tenant_id' => $tenant->id,
                'plan_id' => $plan->id,
                'payment_status' => 'paid',
                'amount' => rand(100, 500),
                'created_at' => now()->subDays(rand(1, 30)),
            ]);
        }

        // Test different report types and formats
        $reportTypes = ['tenants', 'revenue', 'users', 'subscriptions'];
        $formats = ['csv', 'excel', 'pdf'];

        foreach ($reportTypes as $type) {
            foreach ($formats as $format) {
                $response = $this->postJson('/api/admin/analytics/export', [
                    'type' => $type,
                    'format' => $format,
                    'date_from' => now()->subDays(30)->toDateString(),
                    'date_to' => now()->toDateString(),
                ]);

                $response->assertStatus(200);
                
                $reportData = $response->json();
                $this->assertArrayHasKey('download_url', $reportData);
                $this->assertArrayHasKey('filename', $reportData);
                $this->assertArrayHasKey('expires_at', $reportData);

                // Verify filename format
                $this->assertStringContains($type, $reportData['filename']);
                $this->assertStringEndsWith(".{$format}", $reportData['filename']);
            }
        }

        // Test date range filtering
        $response = $this->postJson('/api/admin/analytics/export', [
            'type' => 'revenue',
            'format' => 'csv',
            'date_from' => now()->subDays(7)->toDateString(),
            'date_to' => now()->toDateString(),
        ]);

        $response->assertStatus(200);

        // Test invalid report parameters
        $response = $this->postJson('/api/admin/analytics/export', [
            'type' => 'invalid_type',
            'format' => 'csv',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['type']);

        $response = $this->postJson('/api/admin/analytics/export', [
            'type' => 'tenants',
            'format' => 'invalid_format',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['format']);
    }

    /**
     * **Feature: super-admin-enhancement, Property 12: Metrics display real-time updates and trends**
     * 
     * For any time-series data, the metrics display should update automatically 
     * and show historical trends with accurate calculations
     */
    public function test_metrics_display_real_time_updates_and_trends(): void
    {
        Sanctum::actingAs($this->superAdmin);

        // Test real-time metrics endpoint
        $response = $this->getJson('/api/admin/analytics/real-time');
        $response->assertStatus(200);

        $realTimeData = $response->json();
        $this->assertArrayHasKey('active_sessions', $realTimeData);
        $this->assertArrayHasKey('current_load', $realTimeData);
        $this->assertArrayHasKey('memory_usage', $realTimeData);
        $this->assertArrayHasKey('response_time', $realTimeData);
        $this->assertArrayHasKey('error_rate', $realTimeData);

        // Verify data types
        $this->assertIsInt($realTimeData['active_sessions']);
        $this->assertIsFloat($realTimeData['current_load']);
        $this->assertIsArray($realTimeData['memory_usage']);
        $this->assertIsFloat($realTimeData['response_time']);
        $this->assertIsFloat($realTimeData['error_rate']);

        // Test revenue analytics with different time periods
        $periods = ['7d', '30d', '90d', '1y'];
        $groupings = ['day', 'week', 'month', 'year'];

        foreach ($periods as $period) {
            foreach ($groupings as $groupBy) {
                $response = $this->getJson("/api/admin/analytics/revenue?period={$period}&group_by={$groupBy}");
                $response->assertStatus(200);

                $revenueData = $response->json();
                $this->assertArrayHasKey('data', $revenueData);
                $this->assertArrayHasKey('summary', $revenueData);
                $this->assertIsArray($revenueData['data']);

                // Verify summary contains expected metrics
                $summary = $revenueData['summary'];
                $this->assertArrayHasKey('total_revenue', $summary);
                $this->assertArrayHasKey('total_subscriptions', $summary);
                $this->assertArrayHasKey('avg_revenue_per_subscription', $summary);
            }
        }

        // Test system health monitoring
        $response = $this->getJson('/api/admin/analytics/system-health');
        $response->assertStatus(200);

        $healthData = $response->json();
        $this->assertArrayHasKey('database', $healthData);
        $this->assertArrayHasKey('cache', $healthData);
        $this->assertArrayHasKey('storage', $healthData);
        $this->assertArrayHasKey('queue', $healthData);
        $this->assertArrayHasKey('overall_status', $healthData);

        // Verify each health check has status
        foreach (['database', 'cache', 'storage', 'queue'] as $component) {
            $this->assertArrayHasKey('status', $healthData[$component]);
            $this->assertContains($healthData[$component]['status'], ['healthy', 'unhealthy']);
        }

        // Test user analytics with filters
        $response = $this->getJson('/api/admin/analytics/users');
        $response->assertStatus(200);

        $userAnalytics = $response->json();
        $this->assertArrayHasKey('total_users', $userAnalytics);
        $this->assertArrayHasKey('active_users', $userAnalytics);
        $this->assertArrayHasKey('new_users_today', $userAnalytics);
        $this->assertArrayHasKey('new_users_week', $userAnalytics);
        $this->assertArrayHasKey('new_users_month', $userAnalytics);

        // Test with date filters
        $response = $this->getJson('/api/admin/analytics/users?' . http_build_query([
            'date_from' => now()->subDays(30)->toDateString(),
            'date_to' => now()->toDateString(),
        ]));

        $response->assertStatus(200);
    }
}