<?php

namespace Tests\Unit\Maintenance;

use Tests\TestCase;
use App\Services\Maintenance\VisitExecutionService;
use App\Services\BranchContextService;
use App\Models\MaintenanceVisit;
use App\Models\MaintenanceContract;
use App\Models\Product;
use App\Models\Tenant;
use App\Models\Branch;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Carbon\Carbon;

class VisitExecutionServiceTest extends TestCase
{
    use RefreshDatabase;

    private VisitExecutionService $visitExecutionService;
    private Tenant $tenant;
    private Branch $branch;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create mock BranchContextService
        $branchContextService = $this->createMock(BranchContextService::class);
        $this->visitExecutionService = new VisitExecutionService($branchContextService);
        
        // Create test tenant and branch
        $this->tenant = Tenant::factory()->create();
        $this->branch = Branch::factory()->create(['tenant_id' => $this->tenant->id]);
        
        // Create and authenticate user
        $this->user = User::factory()->create(['tenant_id' => $this->tenant->id]);
        $this->actingAs($this->user);
    }

    /**
     * **Feature: maintenance-workflow-refinement, Property 2: Visit Status Consistency**
     * **Validates: Requirements 3.2**
     */
    public function test_visit_status_transitions_property()
    {
        // Define valid status transition matrix
        $validTransitions = [
            'scheduled' => ['in_progress', 'rescheduled', 'cancelled', 'missed'],
            'rescheduled' => ['in_progress', 'cancelled', 'missed'],
            'in_progress' => ['completed', 'failed', 'no_access'],
            'completed' => [], // Completed visits cannot be changed
            'failed' => ['rescheduled'],
            'no_access' => ['rescheduled'],
            'cancelled' => [],
            'missed' => ['rescheduled']
        ];

        foreach ($validTransitions as $fromStatus => $toStatuses) {
            foreach ($toStatuses as $toStatus) {
                // Create a visit with the initial status
                $visit = MaintenanceVisit::factory()->create([
                    'tenant_id' => $this->tenant->id,
                    'branch_id' => $this->branch->id,
                    'status' => $fromStatus,
                ]);

                // Property: Valid transitions should succeed
                $updatedVisit = $this->visitExecutionService->updateVisitStatus($visit->id, $toStatus);
                $this->assertEquals(
                    $toStatus,
                    $updatedVisit->status,
                    "Valid transition from {$fromStatus} to {$toStatus} should succeed"
                );

                // Property: Status should be persisted in database
                $visitFromDb = MaintenanceVisit::find($visit->id);
                $this->assertEquals(
                    $toStatus,
                    $visitFromDb->status,
                    "Status transition should be persisted in database"
                );
            }
        }
    }

    /**
     * **Feature: maintenance-workflow-refinement, Property 2: Visit Status Consistency**
     * **Validates: Requirements 3.2**
     */
    public function test_visit_status_transitions_invalid_transitions_property()
    {
        // Define invalid status transitions that should fail
        $invalidTransitions = [
            'completed' => ['scheduled', 'in_progress', 'cancelled', 'missed'],
            'cancelled' => ['scheduled', 'in_progress', 'completed', 'missed'],
            'scheduled' => ['completed'], // Can't go directly to completed without in_progress
            'in_progress' => ['scheduled', 'rescheduled', 'cancelled', 'missed'],
        ];

        foreach ($invalidTransitions as $fromStatus => $toStatuses) {
            foreach ($toStatuses as $toStatus) {
                $visit = MaintenanceVisit::factory()->create([
                    'tenant_id' => $this->tenant->id,
                    'branch_id' => $this->branch->id,
                    'status' => $fromStatus,
                ]);

                // Property: Invalid transitions should throw exception
                $this->expectException(\InvalidArgumentException::class);
                $this->expectExceptionMessage("Invalid status transition from {$fromStatus} to {$toStatus}");
                
                $this->visitExecutionService->updateVisitStatus($visit->id, $toStatus);
                
                // Property: Original status should remain unchanged after failed transition
                $visitFromDb = MaintenanceVisit::find($visit->id);
                $this->assertEquals(
                    $fromStatus,
                    $visitFromDb->status,
                    "Status should remain unchanged after invalid transition attempt"
                );
            }
        }
    }

    /**
     * **Feature: maintenance-workflow-refinement, Property 2: Visit Status Consistency**
     * **Validates: Requirements 3.2**
     */
    public function test_visit_status_transitions_with_timestamps_property()
    {
        $statusTimestampMapping = [
            'in_progress' => 'started_at',
            'completed' => 'completed_at',
            'cancelled' => 'cancelled_at',
            'missed' => 'missed_at',
        ];

        foreach ($statusTimestampMapping as $status => $timestampField) {
            $visit = MaintenanceVisit::factory()->create([
                'tenant_id' => $this->tenant->id,
                'branch_id' => $this->branch->id,
                'status' => 'scheduled',
            ]);

            // Ensure timestamp field is initially null
            $this->assertNull($visit->{$timestampField});

            // Update to the target status
            $updatedVisit = $this->visitExecutionService->updateVisitStatus($visit->id, $status);

            // Property: Appropriate timestamp should be set when status changes
            $this->assertNotNull(
                $updatedVisit->{$timestampField},
                "Timestamp field {$timestampField} should be set when status changes to {$status}"
            );

            // Property: Timestamp should be recent (within last minute)
            $timestamp = Carbon::parse($updatedVisit->{$timestampField});
            $this->assertTrue(
                $timestamp->diffInMinutes(Carbon::now()) < 1,
                "Timestamp should be recent when status changes to {$status}"
            );
        }
    }

    /**
     * **Feature: maintenance-workflow-refinement, Property 2: Visit Status Consistency**
     * **Validates: Requirements 3.2**
     */
    public function test_visit_status_transitions_idempotency_property()
    {
        $visit = MaintenanceVisit::factory()->create([
            'tenant_id' => $this->tenant->id,
            'branch_id' => $this->branch->id,
            'status' => 'scheduled',
        ]);

        // First transition to in_progress
        $firstUpdate = $this->visitExecutionService->updateVisitStatus($visit->id, 'in_progress');
        $firstTimestamp = $firstUpdate->started_at;

        // Wait a moment to ensure different timestamps if they were to change
        sleep(1);

        // Second transition to in_progress (same status)
        $secondUpdate = $this->visitExecutionService->updateVisitStatus($visit->id, 'in_progress');

        // Property: Status should remain the same
        $this->assertEquals('in_progress', $secondUpdate->status);

        // Property: Timestamp should not change on redundant status update
        $this->assertEquals(
            $firstTimestamp,
            $secondUpdate->started_at,
            "Timestamp should not change when setting the same status"
        );
    }

    /**
     * **Feature: maintenance-workflow-refinement, Property 2: Visit Status Consistency**
     * **Validates: Requirements 3.2**
     */
    public function test_visit_status_transitions_complete_workflow_property()
    {
        // Test complete workflow: scheduled -> in_progress -> completed
        $visit = MaintenanceVisit::factory()->create([
            'tenant_id' => $this->tenant->id,
            'branch_id' => $this->branch->id,
            'status' => 'scheduled',
        ]);

        // Property: Should be able to start visit
        $inProgressVisit = $this->visitExecutionService->updateVisitStatus($visit->id, 'in_progress');
        $this->assertEquals('in_progress', $inProgressVisit->status);
        $this->assertNotNull($inProgressVisit->started_at);

        // Property: Should be able to complete visit
        $completedVisit = $this->visitExecutionService->updateVisitStatus($visit->id, 'completed');
        $this->assertEquals('completed', $completedVisit->status);
        $this->assertNotNull($completedVisit->completed_at);
        $this->assertNotNull($completedVisit->started_at); // Should preserve previous timestamp

        // Property: Completed visit should not allow further status changes
        $this->expectException(\InvalidArgumentException::class);
        $this->visitExecutionService->updateVisitStatus($visit->id, 'cancelled');
    }

    /**
     * **Feature: maintenance-workflow-refinement, Property 2: Visit Status Consistency**
     * **Validates: Requirements 3.2**
     */
    public function test_visit_status_transitions_edge_cases_property()
    {
        // Edge Case 1: Failed visit can be rescheduled
        $failedVisit = MaintenanceVisit::factory()->create([
            'tenant_id' => $this->tenant->id,
            'branch_id' => $this->branch->id,
            'status' => 'failed',
        ]);

        $rescheduledVisit = $this->visitExecutionService->updateVisitStatus($failedVisit->id, 'rescheduled');
        $this->assertEquals('rescheduled', $rescheduledVisit->status);

        // Edge Case 2: No access visit can be rescheduled
        $noAccessVisit = MaintenanceVisit::factory()->create([
            'tenant_id' => $this->tenant->id,
            'branch_id' => $this->branch->id,
            'status' => 'no_access',
        ]);

        $rescheduledFromNoAccess = $this->visitExecutionService->updateVisitStatus($noAccessVisit->id, 'rescheduled');
        $this->assertEquals('rescheduled', $rescheduledFromNoAccess->status);

        // Edge Case 3: Missed visit can be rescheduled
        $missedVisit = MaintenanceVisit::factory()->create([
            'tenant_id' => $this->tenant->id,
            'branch_id' => $this->branch->id,
            'status' => 'missed',
        ]);

        $rescheduledFromMissed = $this->visitExecutionService->updateVisitStatus($missedVisit->id, 'rescheduled');
        $this->assertEquals('rescheduled', $rescheduledFromMissed->status);

        // Edge Case 4: Rescheduled visit can go to various states
        $rescheduledStates = ['in_progress', 'cancelled', 'missed'];
        foreach ($rescheduledStates as $targetState) {
            $rescheduledVisit = MaintenanceVisit::factory()->create([
                'tenant_id' => $this->tenant->id,
                'branch_id' => $this->branch->id,
                'status' => 'rescheduled',
            ]);

            $updatedVisit = $this->visitExecutionService->updateVisitStatus($rescheduledVisit->id, $targetState);
            $this->assertEquals($targetState, $updatedVisit->status);
        }
    }

    /**
     * **Feature: maintenance-workflow-refinement, Property 5: Parts Inventory Consistency**
     * **Validates: Requirements 3.4**
     */
    public function test_parts_inventory_consistency_property()
    {
        // Create products with initial stock
        $products = [
            Product::factory()->create(['stock_quantity' => 100, 'price' => 25.00]),
            Product::factory()->create(['stock_quantity' => 50, 'price' => 15.50]),
            Product::factory()->create(['stock_quantity' => 200, 'price' => 5.75]),
        ];

        $visit = MaintenanceVisit::factory()->create([
            'tenant_id' => $this->tenant->id,
            'branch_id' => $this->branch->id,
            'status' => 'in_progress',
        ]);

        // Test different quantities of parts usage
        $partsUsageScenarios = [
            [
                'product_id' => $products[0]->id,
                'quantity' => 10,
                'unit_price' => 25.00,
                'initial_stock' => 100,
                'expected_remaining' => 90,
            ],
            [
                'product_id' => $products[1]->id,
                'quantity' => 25,
                'unit_price' => 15.50,
                'initial_stock' => 50,
                'expected_remaining' => 25,
            ],
            [
                'product_id' => $products[2]->id,
                'quantity' => 75,
                'unit_price' => 5.75,
                'initial_stock' => 200,
                'expected_remaining' => 125,
            ],
        ];

        foreach ($partsUsageScenarios as $index => $scenario) {
            $product = Product::find($scenario['product_id']);
            $initialStock = $product->stock_quantity;

            // Property: Initial stock should match expected
            $this->assertEquals(
                $scenario['initial_stock'],
                $initialStock,
                "Scenario {$index}: Initial stock should match expected"
            );

            // Record parts used
            $this->visitExecutionService->recordPartsUsed($visit->id, [
                [
                    'product_id' => $scenario['product_id'],
                    'quantity' => $scenario['quantity'],
                    'unit_price' => $scenario['unit_price'],
                    'notes' => "Test usage scenario {$index}",
                ]
            ]);

            // Property: Stock should be decremented by exact quantity used
            $product->refresh();
            $this->assertEquals(
                $scenario['expected_remaining'],
                $product->stock_quantity,
                "Scenario {$index}: Stock should be decremented by exact quantity used"
            );

            // Property: Visit item should be created with correct details
            $visitItem = $visit->items()->where('product_id', $scenario['product_id'])->first();
            $this->assertNotNull($visitItem, "Visit item should be created");
            $this->assertEquals($scenario['quantity'], $visitItem->quantity);
            $this->assertEquals($scenario['unit_price'], $visitItem->unit_price);
            $this->assertEquals(
                $scenario['quantity'] * $scenario['unit_price'],
                $visitItem->total_price,
                "Total price should be quantity × unit price"
            );
        }
    }

    /**
     * **Feature: maintenance-workflow-refinement, Property 5: Parts Inventory Consistency**
     * **Validates: Requirements 3.4**
     */
    public function test_parts_inventory_consistency_insufficient_stock_property()
    {
        // Create product with limited stock
        $product = Product::factory()->create(['stock_quantity' => 5, 'price' => 10.00]);

        $visit = MaintenanceVisit::factory()->create([
            'tenant_id' => $this->tenant->id,
            'branch_id' => $this->branch->id,
            'status' => 'in_progress',
        ]);

        $initialStock = $product->stock_quantity;

        // Property: Should throw exception when trying to use more parts than available
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Insufficient stock for product {$product->name}. Available: 5, Required: 10");

        $this->visitExecutionService->recordPartsUsed($visit->id, [
            [
                'product_id' => $product->id,
                'quantity' => 10, // More than available stock
                'unit_price' => 10.00,
            ]
        ]);

        // Property: Stock should remain unchanged after failed operation
        $product->refresh();
        $this->assertEquals(
            $initialStock,
            $product->stock_quantity,
            "Stock should remain unchanged after insufficient stock error"
        );

        // Property: No visit item should be created after failed operation
        $visitItemCount = $visit->items()->where('product_id', $product->id)->count();
        $this->assertEquals(0, $visitItemCount, "No visit item should be created after failed operation");
    }

    /**
     * **Feature: maintenance-workflow-refinement, Property 5: Parts Inventory Consistency**
     * **Validates: Requirements 3.4**
     */
    public function test_parts_inventory_consistency_multiple_parts_property()
    {
        // Create multiple products
        $products = collect([
            Product::factory()->create(['stock_quantity' => 100, 'price' => 20.00]),
            Product::factory()->create(['stock_quantity' => 75, 'price' => 35.50]),
            Product::factory()->create(['stock_quantity' => 150, 'price' => 12.25]),
        ]);

        $visit = MaintenanceVisit::factory()->create([
            'tenant_id' => $this->tenant->id,
            'branch_id' => $this->branch->id,
            'status' => 'in_progress',
        ]);

        // Record initial stock levels
        $initialStocks = $products->mapWithKeys(fn($product) => [$product->id => $product->stock_quantity]);

        // Use multiple parts in single operation
        $partsToUse = [
            ['product_id' => $products[0]->id, 'quantity' => 15, 'unit_price' => 20.00],
            ['product_id' => $products[1]->id, 'quantity' => 8, 'unit_price' => 35.50],
            ['product_id' => $products[2]->id, 'quantity' => 22, 'unit_price' => 12.25],
        ];

        $this->visitExecutionService->recordPartsUsed($visit->id, $partsToUse);

        // Property: All products should have correct stock decrements
        foreach ($partsToUse as $partUsed) {
            $product = Product::find($partUsed['product_id']);
            $expectedStock = $initialStocks[$partUsed['product_id']] - $partUsed['quantity'];
            
            $this->assertEquals(
                $expectedStock,
                $product->stock_quantity,
                "Product {$product->id} should have correct stock after multiple parts usage"
            );
        }

        // Property: All visit items should be created
        $visitItemsCount = $visit->items()->count();
        $this->assertEquals(
            count($partsToUse),
            $visitItemsCount,
            "All parts should be recorded as visit items"
        );

        // Property: Total value should be sum of all parts
        $expectedTotalValue = collect($partsToUse)->sum(fn($part) => $part['quantity'] * $part['unit_price']);
        $actualTotalValue = $visit->items()->sum('total_price');
        
        $this->assertEquals(
            $expectedTotalValue,
            $actualTotalValue,
            "Total value should be sum of all parts used"
        );
    }

    /**
     * **Feature: maintenance-workflow-refinement, Property 5: Parts Inventory Consistency**
     * **Validates: Requirements 3.4**
     */
    public function test_parts_inventory_consistency_edge_cases_property()
    {
        // Edge Case 1: Using exact available stock
        $product1 = Product::factory()->create(['stock_quantity' => 10, 'price' => 15.00]);
        $visit1 = MaintenanceVisit::factory()->create([
            'tenant_id' => $this->tenant->id,
            'branch_id' => $this->branch->id,
            'status' => 'in_progress',
        ]);

        $this->visitExecutionService->recordPartsUsed($visit1->id, [
            ['product_id' => $product1->id, 'quantity' => 10, 'unit_price' => 15.00]
        ]);

        $product1->refresh();
        $this->assertEquals(0, $product1->stock_quantity, "Should be able to use exact available stock");

        // Edge Case 2: Zero quantity (should be ignored)
        $product2 = Product::factory()->create(['stock_quantity' => 50, 'price' => 25.00]);
        $visit2 = MaintenanceVisit::factory()->create([
            'tenant_id' => $this->tenant->id,
            'branch_id' => $this->branch->id,
            'status' => 'in_progress',
        ]);

        $this->visitExecutionService->recordPartsUsed($visit2->id, [
            ['product_id' => $product2->id, 'quantity' => 0, 'unit_price' => 25.00]
        ]);

        $product2->refresh();
        $this->assertEquals(50, $product2->stock_quantity, "Zero quantity should not affect stock");

        // Edge Case 3: Non-existent product (should be ignored)
        $visit3 = MaintenanceVisit::factory()->create([
            'tenant_id' => $this->tenant->id,
            'branch_id' => $this->branch->id,
            'status' => 'in_progress',
        ]);

        // Should not throw exception, just log warning and continue
        $this->visitExecutionService->recordPartsUsed($visit3->id, [
            ['product_id' => 99999, 'quantity' => 5, 'unit_price' => 10.00]
        ]);

        $visitItemsCount = $visit3->items()->count();
        $this->assertEquals(0, $visitItemsCount, "Non-existent product should not create visit item");

        // Edge Case 4: Missing required fields (should be ignored)
        $product4 = Product::factory()->create(['stock_quantity' => 30, 'price' => 18.00]);
        $visit4 = MaintenanceVisit::factory()->create([
            'tenant_id' => $this->tenant->id,
            'branch_id' => $this->branch->id,
            'status' => 'in_progress',
        ]);

        $this->visitExecutionService->recordPartsUsed($visit4->id, [
            ['product_id' => $product4->id], // Missing quantity
            ['quantity' => 5], // Missing product_id
        ]);

        $product4->refresh();
        $this->assertEquals(30, $product4->stock_quantity, "Invalid part data should not affect stock");
        
        $visitItemsCount = $visit4->items()->count();
        $this->assertEquals(0, $visitItemsCount, "Invalid part data should not create visit items");
    }
}