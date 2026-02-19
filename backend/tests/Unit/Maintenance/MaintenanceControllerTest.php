<?php

namespace Tests\Unit\Maintenance;

use Tests\TestCase;
use App\Http\Controllers\Business\MaintenanceController;
use App\Services\Maintenance\ContractService;
use App\Services\Maintenance\VisitSchedulingService;
use App\Services\Maintenance\VisitExecutionService;
use App\Services\Maintenance\MaintenanceAnalyticsService;
use App\Models\MaintenanceContract;
use App\Models\MaintenanceVisit;
use App\Models\Tenant;
use App\Models\Branch;
use App\Models\User;
use App\Models\Customer;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Carbon\Carbon;

class MaintenanceControllerTest extends TestCase
{
    use RefreshDatabase;

    private MaintenanceController $controller;
    private Tenant $tenant;
    private Branch $branch;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create test tenant and branch
        $this->tenant = Tenant::factory()->create();
        $this->branch = Branch::factory()->create(['tenant_id' => $this->tenant->id]);
        
        // Create and authenticate user
        $this->user = User::factory()->create(['tenant_id' => $this->tenant->id]);
        $this->actingAs($this->user);

        // Create controller with mocked services
        $contractService = $this->createMock(ContractService::class);
        $visitSchedulingService = $this->createMock(VisitSchedulingService::class);
        $visitExecutionService = $this->createMock(VisitExecutionService::class);
        $analyticsService = $this->createMock(MaintenanceAnalyticsService::class);

        $this->controller = new MaintenanceController(
            $contractService,
            $visitSchedulingService,
            $visitExecutionService,
            $analyticsService
        );
    }

    /**
     * **Feature: maintenance-workflow-refinement, Property 10: API Backward Compatibility**
     * **Validates: Requirements 10.1**
     */
    public function test_api_backward_compatibility_visit_endpoints()
    {
        // Create test data
        $contract = MaintenanceContract::factory()->create([
            'tenant_id' => $this->tenant->id,
            'branch_id' => $this->branch->id,
        ]);

        $visit = MaintenanceVisit::factory()->create([
            'tenant_id' => $this->tenant->id,
            'branch_id' => $this->branch->id,
            'maintenance_contract_id' => $contract->id,
            'status' => 'scheduled',
        ]);

        // Property: GET /maintenance endpoint should return same structure
        $response = $this->getJson('/api/business/maintenance');
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'visits' => [
                'data' => [
                    '*' => [
                        'id',
                        'maintenance_contract_id',
                        'scheduled_date',
                        'status',
                        'priority',
                        'contract' => [
                            'id',
                            'customer_name',
                            'product' => ['id', 'name']
                        ]
                    ]
                ]
            ],
            'stats'
        ]);

        // Property: GET /maintenance/{id} should return same structure
        $response = $this->getJson("/api/business/maintenance/{$visit->id}");
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'visit' => [
                'id',
                'maintenance_contract_id',
                'scheduled_date',
                'status',
                'priority',
                'contract' => [
                    'id',
                    'customer_name',
                    'product' => ['id', 'name']
                ]
            ]
        ]);

        // Property: POST /maintenance should accept same parameters
        $newVisitData = [
            'maintenance_contract_id' => $contract->id,
            'scheduled_date' => Carbon::tomorrow()->toDateString(),
            'priority' => 'medium',
            'work_description' => 'Test maintenance work',
        ];

        $response = $this->postJson('/api/business/maintenance', $newVisitData);
        $response->assertStatus(201);
        $response->assertJsonStructure([
            'message',
            'visit' => [
                'id',
                'maintenance_contract_id',
                'scheduled_date',
                'status',
                'priority'
            ]
        ]);
    }

    /**
     * **Feature: maintenance-workflow-refinement, Property 10: API Backward Compatibility**
     * **Validates: Requirements 10.1**
     */
    public function test_api_backward_compatibility_contract_endpoints()
    {
        $customer = Customer::factory()->create(['tenant_id' => $this->tenant->id]);
        $product = Product::factory()->create(['tenant_id' => $this->tenant->id]);
        $technician = User::factory()->create(['tenant_id' => $this->tenant->id]);

        // Property: GET /maintenance/contracts should return same structure
        $response = $this->getJson('/api/business/maintenance/contracts');
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                'data' => [], // Paginated data
                'current_page',
                'per_page',
                'total'
            ]
        ]);

        // Property: POST /maintenance/contracts should accept same parameters
        $contractData = [
            'product_id' => $product->id,
            'customer_id' => $customer->id,
            'assigned_technician_id' => $technician->id,
            'frequency' => 'monthly',
            'start_date' => Carbon::now()->toDateString(),
            'end_date' => Carbon::now()->addYear()->toDateString(),
            'contract_value' => 1200.00,
            'special_instructions' => 'Test contract instructions',
            'status' => 'active',
        ];

        $response = $this->postJson('/api/business/maintenance/contracts', $contractData);
        $response->assertStatus(201);
        $response->assertJsonStructure([
            'message',
            'data' => [
                'id',
                'product_id',
                'customer_id',
                'assigned_technician_id',
                'frequency',
                'start_date',
                'end_date',
                'contract_value',
                'status',
                'product' => ['id', 'name'],
                'customer' => ['id', 'name'],
                'assignedTechnician' => ['id', 'name']
            ]
        ]);

        $contractId = $response->json('data.id');

        // Property: GET /maintenance/contracts/{id} should return same structure
        $response = $this->getJson("/api/business/maintenance/contracts/{$contractId}");
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                'id',
                'product_id',
                'customer_id',
                'frequency',
                'start_date',
                'end_date',
                'status',
                'product',
                'customer',
                'assignedTechnician',
                'visits',
                'items'
            ]
        ]);

        // Property: PUT /maintenance/contracts/{id} should accept same parameters
        $updateData = [
            'frequency' => 'quarterly',
            'contract_value' => 1500.00,
            'special_instructions' => 'Updated instructions',
        ];

        $response = $this->putJson("/api/business/maintenance/contracts/{$contractId}", $updateData);
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'message',
            'data' => [
                'id',
                'frequency',
                'contract_value',
                'special_instructions'
            ]
        ]);
    }

    /**
     * **Feature: maintenance-workflow-refinement, Property 10: API Backward Compatibility**
     * **Validates: Requirements 10.1**
     */
    public function test_api_backward_compatibility_visit_actions()
    {
        $contract = MaintenanceContract::factory()->create([
            'tenant_id' => $this->tenant->id,
            'branch_id' => $this->branch->id,
        ]);

        $visit = MaintenanceVisit::factory()->create([
            'tenant_id' => $this->tenant->id,
            'branch_id' => $this->branch->id,
            'maintenance_contract_id' => $contract->id,
            'status' => 'scheduled',
        ]);

        // Property: POST /maintenance/{id}/start should work with same response structure
        $response = $this->postJson("/api/business/maintenance/{$visit->id}/start");
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'message',
            'visit' => [
                'id',
                'status',
                'contract'
            ]
        ]);

        // Property: POST /maintenance/{id}/complete should accept same parameters
        $completionData = [
            'completion_notes' => 'Work completed successfully',
            'customer_feedback' => 'Customer was satisfied',
            'customer_rating' => 5,
            'parts_used' => [
                [
                    'product_id' => Product::factory()->create(['tenant_id' => $this->tenant->id])->id,
                    'quantity' => 2,
                    'unit_price' => 25.00,
                    'notes' => 'Replacement parts'
                ]
            ]
        ];

        // Update visit to in_progress first
        $visit->update(['status' => 'in_progress']);

        $response = $this->postJson("/api/business/maintenance/{$visit->id}/complete", $completionData);
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'message',
            'visit' => [
                'id',
                'status',
                'contract',
                'items'
            ]
        ]);

        // Property: POST /maintenance/{id}/reschedule should accept same parameters
        $newVisit = MaintenanceVisit::factory()->create([
            'tenant_id' => $this->tenant->id,
            'branch_id' => $this->branch->id,
            'maintenance_contract_id' => $contract->id,
            'status' => 'scheduled',
        ]);

        $rescheduleData = [
            'scheduled_date' => Carbon::tomorrow()->toDateString(),
            'reason' => 'Customer requested reschedule'
        ];

        $response = $this->postJson("/api/business/maintenance/{$newVisit->id}/reschedule", $rescheduleData);
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'message',
            'visit' => [
                'id',
                'scheduled_date',
                'status'
            ]
        ]);

        // Property: POST /maintenance/{id}/cancel should accept same parameters
        $anotherVisit = MaintenanceVisit::factory()->create([
            'tenant_id' => $this->tenant->id,
            'branch_id' => $this->branch->id,
            'maintenance_contract_id' => $contract->id,
            'status' => 'scheduled',
        ]);

        $cancelData = [
            'reason' => 'Equipment not available'
        ];

        $response = $this->postJson("/api/business/maintenance/{$anotherVisit->id}/cancel", $cancelData);
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'message',
            'visit' => [
                'id',
                'status'
            ]
        ]);
    }

    /**
     * **Feature: maintenance-workflow-refinement, Property 10: API Backward Compatibility**
     * **Validates: Requirements 10.1**
     */
    public function test_api_backward_compatibility_dashboard_endpoint()
    {
        // Create some test data
        MaintenanceVisit::factory()->count(3)->create([
            'tenant_id' => $this->tenant->id,
            'branch_id' => $this->branch->id,
            'status' => 'scheduled',
            'scheduled_date' => Carbon::tomorrow(),
        ]);

        MaintenanceVisit::factory()->count(2)->create([
            'tenant_id' => $this->tenant->id,
            'branch_id' => $this->branch->id,
            'status' => 'scheduled',
            'scheduled_date' => Carbon::yesterday(),
        ]);

        MaintenanceVisit::factory()->count(1)->create([
            'tenant_id' => $this->tenant->id,
            'branch_id' => $this->branch->id,
            'status' => 'scheduled',
            'scheduled_date' => Carbon::today(),
        ]);

        // Property: GET /maintenance/dashboard should return same structure
        $response = $this->getJson('/api/business/maintenance/dashboard');
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'stats',
            'upcoming_visits' => [
                '*' => [
                    'id',
                    'scheduled_date',
                    'status',
                    'contract'
                ]
            ],
            'overdue_visits' => [
                '*' => [
                    'id',
                    'scheduled_date',
                    'status',
                    'contract'
                ]
            ],
            'today_visits' => [
                '*' => [
                    'id',
                    'scheduled_date',
                    'status',
                    'contract'
                ]
            ]
        ]);
    }

    /**
     * **Feature: maintenance-workflow-refinement, Property 10: API Backward Compatibility**
     * **Validates: Requirements 10.1**
     */
    public function test_api_backward_compatibility_calendar_endpoint()
    {
        // Create visits for calendar testing
        $contract = MaintenanceContract::factory()->create([
            'tenant_id' => $this->tenant->id,
            'branch_id' => $this->branch->id,
        ]);

        MaintenanceVisit::factory()->count(5)->create([
            'tenant_id' => $this->tenant->id,
            'branch_id' => $this->branch->id,
            'maintenance_contract_id' => $contract->id,
            'scheduled_date' => Carbon::now()->addDays(rand(1, 30)),
            'status' => 'scheduled',
        ]);

        // Property: GET /maintenance/calendar should return same structure
        $response = $this->getJson('/api/business/maintenance/calendar', [
            'start' => Carbon::now()->startOfMonth()->toDateString(),
            'end' => Carbon::now()->endOfMonth()->toDateString(),
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'events' => [
                '*' => [
                    'id',
                    'title',
                    'date',
                    'status',
                    'priority',
                    'worker',
                    'customer',
                    'product',
                    'type',
                    'contract_id'
                ]
            ]
        ]);
    }

    /**
     * **Feature: maintenance-workflow-refinement, Property 10: API Backward Compatibility**
     * **Validates: Requirements 10.1**
     */
    public function test_api_backward_compatibility_error_responses()
    {
        // Property: 404 errors should maintain same structure
        $response = $this->getJson('/api/business/maintenance/99999');
        $response->assertStatus(404);
        $response->assertJsonStructure(['error']);

        // Property: Validation errors should maintain same structure
        $response = $this->postJson('/api/business/maintenance', [
            'maintenance_contract_id' => 'invalid',
            'scheduled_date' => 'invalid-date',
        ]);
        $response->assertStatus(422);
        $response->assertJsonStructure(['message', 'errors']);

        // Property: Unauthorized access should maintain same structure
        $otherTenantContract = MaintenanceContract::factory()->create([
            'tenant_id' => Tenant::factory()->create()->id,
        ]);

        $response = $this->getJson("/api/business/maintenance/contracts/{$otherTenantContract->id}");
        $response->assertStatus(403);
        $response->assertJsonStructure(['error']);
    }
}