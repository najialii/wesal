<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Branch;
use App\Models\MaintenanceContract;
use App\Models\MaintenanceVisit;
use App\Services\Maintenance\ContractService;
use App\Services\Maintenance\VisitSchedulingService;
use App\Services\Maintenance\VisitExecutionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Carbon\Carbon;

class MaintenanceWorkflowIntegrationTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    private User $businessOwner;
    private User $technician;
    private Customer $customer;
    private Product $product;
    private Branch $branch;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setupTestData();
    }

    /**
     * Test complete maintenance workflow from contract creation to visit completion
     */
    public function test_complete_maintenance_workflow(): void
    {
        // Step 1: Create a maintenance contract
        $contractData = [
            'customer_id' => $this->customer->id,
            'product_id' => $this->product->id,
            'assigned_technician_id' => $this->technician->id,
            'frequency' => 'monthly',
            'start_date' => now()->toDateString(),
            'end_date' => now()->addYear()->toDateString(),
            'contract_value' => 1200.00,
            'special_instructions' => 'Test contract for integration testing',
        ];

        $this->actingAs($this->businessOwner);
        
        $response = $this->postJson('/api/business/maintenance/contracts', $contractData);
        $response->assertStatus(201);
        
        $contract = MaintenanceContract::latest()->first();
        $this->assertNotNull($contract);
        $this->assertEquals($contractData['customer_id'], $contract->customer_id);
        $this->assertEquals('active', $contract->status);

        // Step 2: Generate visits for the contract
        $visitSchedulingService = app(VisitSchedulingService::class);
        $visits = $visitSchedulingService->generateVisitsForContract($contract->id);
        
        $this->assertNotEmpty($visits);
        $this->assertGreaterThan(0, count($visits));

        // Step 3: Start a visit (technician workflow)
        $this->actingAs($this->technician);
        
        $visit = MaintenanceVisit::where('maintenance_contract_id', $contract->id)
            ->where('status', 'scheduled')
            ->first();
        
        $this->assertNotNull($visit);

        $response = $this->putJson("/api/business/maintenance/visits/{$visit->id}/start");
        $response->assertStatus(200);
        
        $visit->refresh();
        $this->assertEquals('in_progress', $visit->status);
        $this->assertNotNull($visit->actual_start_time);

        // Step 4: Complete the visit
        $completionData = [
            'completion_notes' => 'All systems checked and working properly',
            'total_cost' => 150.00,
            'items_used' => [
                [
                    'maintenance_product_id' => $this->product->id,
                    'quantity_used' => 1,
                    'unit_cost' => 50.00
                ]
            ]
        ];

        $response = $this->postJson("/api/business/maintenance/visits/{$visit->id}/complete", $completionData);
        $response->assertStatus(200);
        
        $visit->refresh();
        $this->assertEquals('completed', $visit->status);
        $this->assertNotNull($visit->actual_end_time);
        $this->assertEquals(150.00, $visit->total_cost);

        // Step 5: Verify contract health metrics
        $this->actingAs($this->businessOwner);
        
        $response = $this->getJson("/api/business/maintenance/contracts/{$contract->id}/health");
        $response->assertStatus(200);
        
        $healthData = $response->json();
        $this->assertArrayHasKey('completion_rate', $healthData);
        $this->assertArrayHasKey('remaining_visits', $healthData);

        // Step 6: Test analytics endpoints
        $response = $this->getJson('/api/business/maintenance/analytics/contract-health');
        $response->assertStatus(200);
        
        $analyticsData = $response->json();
        $this->assertArrayHasKey('total_contracts', $analyticsData);
        $this->assertArrayHasKey('active_contracts', $analyticsData);
    }

    /**
     * Test role-based access control
     */
    public function test_role_based_access_control(): void
    {
        // Create contract as business owner
        $this->actingAs($this->businessOwner);
        
        $contractData = [
            'customer_id' => $this->customer->id,
            'product_id' => $this->product->id,
            'frequency' => 'monthly',
            'start_date' => now()->toDateString(),
            'end_date' => now()->addYear()->toDateString(),
            'contract_value' => 1200.00,
        ];

        $response = $this->postJson('/api/business/maintenance/contracts', $contractData);
        $response->assertStatus(201);
        
        $contract = MaintenanceContract::latest()->first();

        // Test technician cannot create contracts
        $this->actingAs($this->technician);
        
        $response = $this->postJson('/api/business/maintenance/contracts', $contractData);
        $response->assertStatus(403);

        // Test technician can view assigned visits
        $visit = MaintenanceVisit::factory()->create([
            'maintenance_contract_id' => $contract->id,
            'assigned_technician_id' => $this->technician->id,
            'tenant_id' => $this->technician->tenant_id,
            'branch_id' => $this->branch->id,
        ]);

        $response = $this->getJson("/api/business/maintenance/visits/{$visit->id}");
        $response->assertStatus(200);

        // Test technician cannot view other technician's visits
        $otherTechnician = User::factory()->create([
            'tenant_id' => $this->technician->tenant_id,
            'role' => 'technician'
        ]);

        $otherVisit = MaintenanceVisit::factory()->create([
            'maintenance_contract_id' => $contract->id,
            'assigned_technician_id' => $otherTechnician->id,
            'tenant_id' => $this->technician->tenant_id,
            'branch_id' => $this->branch->id,
        ]);

        $response = $this->getJson("/api/business/maintenance/visits/{$otherVisit->id}");
        $response->assertStatus(403);
    }

    /**
     * Test responsive behavior validation
     */
    public function test_responsive_ui_components(): void
    {
        $this->actingAs($this->businessOwner);
        
        // Test maintenance dashboard loads properly
        $response = $this->get('/business/maintenance');
        $response->assertStatus(200);
        $response->assertViewIs('business.maintenance');

        // Test contract list page
        $response = $this->get('/business/maintenance/contracts');
        $response->assertStatus(200);

        // Test calendar view
        $response = $this->getJson('/api/business/maintenance/calendar', [
            'start_date' => now()->startOfMonth()->toDateString(),
            'end_date' => now()->endOfMonth()->toDateString(),
        ]);
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'events' => [
                '*' => ['id', 'title', 'start', 'status']
            ]
        ]);
    }

    /**
     * Test RTL/LTR layout stability
     */
    public function test_rtl_ltr_layout_stability(): void
    {
        $this->actingAs($this->businessOwner);
        
        // Test with Arabic locale (RTL)
        $response = $this->withHeaders(['Accept-Language' => 'ar'])
            ->get('/business/maintenance');
        $response->assertStatus(200);

        // Test with English locale (LTR)
        $response = $this->withHeaders(['Accept-Language' => 'en'])
            ->get('/business/maintenance');
        $response->assertStatus(200);

        // Test API responses are consistent regardless of locale
        $response = $this->withHeaders(['Accept-Language' => 'ar'])
            ->getJson('/api/business/maintenance/contracts');
        $arResponse = $response->json();

        $response = $this->withHeaders(['Accept-Language' => 'en'])
            ->getJson('/api/business/maintenance/contracts');
        $enResponse = $response->json();

        // Data structure should be identical
        $this->assertEquals(array_keys($arResponse), array_keys($enResponse));
    }

    /**
     * Test error handling and recovery
     */
    public function test_error_handling_and_recovery(): void
    {
        $this->actingAs($this->businessOwner);
        
        // Test invalid contract data
        $invalidData = [
            'customer_id' => 99999, // Non-existent customer
            'product_id' => $this->product->id,
            'frequency' => 'invalid_frequency',
            'start_date' => 'invalid_date',
        ];

        $response = $this->postJson('/api/business/maintenance/contracts', $invalidData);
        $response->assertStatus(422);
        $response->assertJsonStructure(['message', 'errors']);

        // Test accessing non-existent contract
        $response = $this->getJson('/api/business/maintenance/contracts/99999');
        $response->assertStatus(404);

        // Test unauthorized access
        $otherTenant = User::factory()->create(['role' => 'business_owner']);
        $this->actingAs($otherTenant);
        
        $contract = MaintenanceContract::factory()->create([
            'tenant_id' => $this->businessOwner->tenant_id,
            'branch_id' => $this->branch->id,
        ]);

        $response = $this->getJson("/api/business/maintenance/contracts/{$contract->id}");
        $response->assertStatus(403);
    }

    /**
     * Test performance under load
     */
    public function test_performance_metrics(): void
    {
        $this->actingAs($this->businessOwner);
        
        // Create multiple contracts and visits
        $contracts = MaintenanceContract::factory()->count(10)->create([
            'tenant_id' => $this->businessOwner->tenant_id,
            'branch_id' => $this->branch->id,
        ]);

        foreach ($contracts as $contract) {
            MaintenanceVisit::factory()->count(5)->create([
                'maintenance_contract_id' => $contract->id,
                'tenant_id' => $this->businessOwner->tenant_id,
                'branch_id' => $this->branch->id,
            ]);
        }

        // Test analytics performance
        $startTime = microtime(true);
        
        $response = $this->getJson('/api/business/maintenance/analytics/contract-health');
        $response->assertStatus(200);
        
        $endTime = microtime(true);
        $executionTime = ($endTime - $startTime) * 1000; // Convert to milliseconds
        
        // Analytics should complete within 2 seconds
        $this->assertLessThan(2000, $executionTime);

        // Test pagination performance
        $response = $this->getJson('/api/business/maintenance/contracts?per_page=50');
        $response->assertStatus(200);
        $response->assertJsonStructure(['data', 'meta']);
    }

    /**
     * Setup test data
     */
    private function setupTestData(): void
    {
        // Create tenant and branch
        $this->branch = Branch::factory()->create();
        
        // Create users
        $this->businessOwner = User::factory()->create([
            'tenant_id' => $this->branch->tenant_id,
            'role' => 'business_owner'
        ]);
        
        $this->technician = User::factory()->create([
            'tenant_id' => $this->branch->tenant_id,
            'role' => 'technician'
        ]);

        // Create customer and product
        $this->customer = Customer::factory()->create([
            'tenant_id' => $this->branch->tenant_id
        ]);
        
        $this->product = Product::factory()->create([
            'tenant_id' => $this->branch->tenant_id,
            'is_active' => true
        ]);
    }
}