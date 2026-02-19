<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Tenant;
use App\Models\Sale;
use App\Models\Product;
use App\Services\AnalyticsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Carbon\Carbon;

class MetricsRealTimePropertyTest extends TestCase
{
    use RefreshDatabase;

    private User $superAdmin;
    private AnalyticsService $analyticsService;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->superAdmin = User::factory()->create([
            'role' => 'super_admin',
            'email' => 'admin@wesaltech.com'
        ]);
        
        $this->analyticsService = app(AnalyticsService::class);
    }

    /**
     * Property 12: Metrics display real-time updates and trends
     * 
     * @test
     */
    public function test_metrics_display_real_time_updates_and_trends()
    {
        // Property: When new data is added, metrics should reflect changes immediately
        // and show proper trend calculations
        
        $tenant = Tenant::factory()->create();
        $product = Product::factory()->create(['tenant_id' => $tenant->id]);
        
        // Get initial metrics
        $initialMetrics = $this->analyticsService->getDashboardStats();
        $initialRevenue = $initialMetrics['total_revenue'] ?? 0;
        $initialSales = $initialMetrics['total_sales'] ?? 0;
        
        // Add new sale
        $saleAmount = 150.00;
        Sale::factory()->create([
            'tenant_id' => $tenant->id,
            'total_amount' => $saleAmount,
            'created_at' => now()
        ]);
        
        // Get updated metrics
        $updatedMetrics = $this->analyticsService->getDashboardStats();
        
        // Assert metrics updated immediately
        $this->assertEquals(
            $initialRevenue + $saleAmount,
            $updatedMetrics['total_revenue'],
            'Revenue should update immediately after new sale'
        );
        
        $this->assertEquals(
            $initialSales + 1,
            $updatedMetrics['total_sales'],
            'Sales count should update immediately'
        );
        
        // Test trend calculation
        $this->assertArrayHasKey('revenue_trend', $updatedMetrics);
        $this->assertArrayHasKey('sales_trend', $updatedMetrics);
        
        // Add historical data for trend comparison
        Sale::factory()->create([
            'tenant_id' => $tenant->id,
            'total_amount' => 100.00,
            'created_at' => now()->subDays(30)
        ]);
        
        $trendMetrics = $this->analyticsService->getDashboardStats();
        
        // Assert trend calculations are present and valid
        $this->assertIsNumeric($trendMetrics['revenue_trend']);
        $this->assertIsNumeric($trendMetrics['sales_trend']);
        
        // Test API endpoint returns real-time data
        $response = $this->actingAs($this->superAdmin)
            ->getJson('/api/admin/analytics/dashboard');
        
        $response->assertStatus(200)
            ->assertJsonStructure([
                'total_revenue',
                'total_sales',
                'revenue_trend',
                'sales_trend',
                'updated_at'
            ]);
        
        // Verify timestamp indicates recent update
        $responseData = $response->json();
        $updatedAt = Carbon::parse($responseData['updated_at']);
        $this->assertTrue(
            $updatedAt->diffInMinutes(now()) < 1,
            'Metrics should have recent timestamp'
        );
    }

    /**
     * @test
     */
    public function test_tenant_metrics_update_in_real_time()
    {
        $tenant1 = Tenant::factory()->create();
        $tenant2 = Tenant::factory()->create();
        
        // Add sales to different tenants
        Sale::factory()->create([
            'tenant_id' => $tenant1->id,
            'total_amount' => 200.00
        ]);
        
        Sale::factory()->create([
            'tenant_id' => $tenant2->id,
            'total_amount' => 300.00
        ]);
        
        // Get tenant-specific metrics
        $tenant1Metrics = $this->analyticsService->getTenantMetrics($tenant1->id);
        $tenant2Metrics = $this->analyticsService->getTenantMetrics($tenant2->id);
        
        $this->assertEquals(200.00, $tenant1Metrics['revenue']);
        $this->assertEquals(300.00, $tenant2Metrics['revenue']);
        
        // Test API endpoint
        $response = $this->actingAs($this->superAdmin)
            ->getJson("/api/admin/analytics/tenants/{$tenant1->id}");
        
        $response->assertStatus(200)
            ->assertJson(['revenue' => 200.00]);
    }

    /**
     * @test
     */
    public function test_metrics_trends_calculate_correctly()
    {
        $tenant = Tenant::factory()->create();
        
        // Create sales for current and previous periods
        $currentPeriodSales = [
            ['amount' => 100, 'date' => now()],
            ['amount' => 150, 'date' => now()->subDays(1)],
            ['amount' => 200, 'date' => now()->subDays(2)]
        ];
        
        $previousPeriodSales = [
            ['amount' => 80, 'date' => now()->subDays(30)],
            ['amount' => 120, 'date' => now()->subDays(31)],
            ['amount' => 100, 'date' => now()->subDays(32)]
        ];
        
        foreach ($currentPeriodSales as $sale) {
            Sale::factory()->create([
                'tenant_id' => $tenant->id,
                'total_amount' => $sale['amount'],
                'created_at' => $sale['date']
            ]);
        }
        
        foreach ($previousPeriodSales as $sale) {
            Sale::factory()->create([
                'tenant_id' => $tenant->id,
                'total_amount' => $sale['amount'],
                'created_at' => $sale['date']
            ]);
        }
        
        $metrics = $this->analyticsService->getDashboardStats();
        
        // Current period: 450, Previous period: 300
        // Trend should be positive (50% increase)
        $expectedTrend = ((450 - 300) / 300) * 100;
        
        $this->assertEqualsWithDelta(
            $expectedTrend,
            $metrics['revenue_trend'],
            0.1,
            'Revenue trend calculation should be accurate'
        );
    }
}