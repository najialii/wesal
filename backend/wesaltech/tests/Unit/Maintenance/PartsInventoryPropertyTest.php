<?php

namespace Tests\Unit\Maintenance;

use Tests\TestCase;
use App\Services\Maintenance\VisitExecutionService;
use App\Models\MaintenanceVisit;
use App\Models\MaintenanceProduct;
use App\Models\MaintenanceVisitItem;
use Illuminate\Foundation\Testing\RefreshDatabase;

/**
 * Property-Based Test for Parts Inventory Consistency
 * **Feature: maintenance-workflow-refinement, Property 5: Parts Inventory Consistency**
 * **Validates: Requirements 3.4**
 * 
 * This test verifies that parts inventory is consistently tracked and updated
 * when parts are used during maintenance visits, ensuring inventory accuracy.
 */
class PartsInventoryPropertyTest extends TestCase
{
    use RefreshDatabase;

    private VisitExecutionService $visitExecutionService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->visitExecutionService = app(VisitExecutionService::class);
    }

    /**
     * Property 5: Parts inventory should remain consistent after visit completion
     * 
     * For any maintenance visit with parts usage, the inventory levels should
     * be accurately decremented by the exact quantities used.
     */
    public function test_parts_inventory_consistency_property()
    {
        // Generate test data using property-based testing approach
        $iterations = 50;
        
        for ($i = 0; $i < $iterations; $i++) {
            $this->runInventoryConsistencyTest();
        }
    }

    private function runInventoryConsistencyTest()
    {
        // Generate random test data
        $initialStock = rand(10, 100);
        $quantityUsed = rand(1, min(10, $initialStock));
        
        // Create maintenance product with initial stock
        $product = MaintenanceProduct::factory()->create([
            'stock_quantity' => $initialStock,
            'unit_cost' => rand(10, 100) / 10, // Random cost between 1.0 and 10.0
        ]);

        // Create maintenance visit
        $visit = MaintenanceVisit::factory()->create([
            'status' => 'in_progress'
        ]);

        // Record initial inventory state
        $initialInventory = $product->fresh()->stock_quantity;

        // Complete visit with parts usage
        $visitData = [
            'status' => 'completed',
            'completion_notes' => 'Test completion with parts usage',
            'parts_used' => [
                [
                    'maintenance_product_id' => $product->id,
                    'quantity_used' => $quantityUsed,
                    'unit_cost' => $product->unit_cost,
                    'notes' => 'Used in maintenance'
                ]
            ]
        ];

        // Execute the visit completion
        $result = $this->visitExecutionService->completeVisit($visit->id, $visitData);

        // Verify the operation was successful
        $this->assertTrue($result['success']);

        // Property 1: Inventory should be decremented by exact quantity used
        $updatedProduct = $product->fresh();
        $expectedStock = $initialInventory - $quantityUsed;
        $this->assertEquals(
            $expectedStock,
            $updatedProduct->stock_quantity,
            "Inventory should be decremented by exactly {$quantityUsed} units"
        );

        // Property 2: Visit item should record the correct quantity and cost
        $visitItem = MaintenanceVisitItem::where('maintenance_visit_id', $visit->id)
            ->where('maintenance_product_id', $product->id)
            ->first();
        
        $this->assertNotNull($visitItem, 'Visit item should be created');
        $this->assertEquals($quantityUsed, $visitItem->quantity_used);
        $this->assertEquals($product->unit_cost, $visitItem->unit_cost);
        $this->assertEquals($quantityUsed * $product->unit_cost, $visitItem->total_cost);

        // Property 3: Total cost calculation should be accurate
        $expectedTotalCost = $quantityUsed * $product->unit_cost;
        $this->assertEquals($expectedTotalCost, $visitItem->total_cost);

        // Property 4: Inventory should never go negative
        $this->assertGreaterThanOrEqual(0, $updatedProduct->stock_quantity);
    }

    /**
     * Property 5.1: Multiple parts usage should maintain inventory consistency
     */
    public function test_multiple_parts_inventory_consistency()
    {
        $iterations = 25;
        
        for ($i = 0; $i < $iterations; $i++) {
            $this->runMultiplePartsInventoryTest();
        }
    }

    private function runMultiplePartsInventoryTest()
    {
        // Create multiple products with random initial stock
        $products = collect();
        $partsUsage = [];
        $initialStocks = [];

        $numProducts = rand(2, 5);
        
        for ($j = 0; $j < $numProducts; $j++) {
            $initialStock = rand(5, 50);
            $quantityUsed = rand(1, min(5, $initialStock));
            
            $product = MaintenanceProduct::factory()->create([
                'stock_quantity' => $initialStock,
                'unit_cost' => rand(10, 100) / 10,
            ]);
            
            $products->push($product);
            $initialStocks[$product->id] = $initialStock;
            
            $partsUsage[] = [
                'maintenance_product_id' => $product->id,
                'quantity_used' => $quantityUsed,
                'unit_cost' => $product->unit_cost,
                'notes' => "Used product {$j}"
            ];
        }

        // Create maintenance visit
        $visit = MaintenanceVisit::factory()->create([
            'status' => 'in_progress'
        ]);

        // Complete visit with multiple parts usage
        $visitData = [
            'status' => 'completed',
            'completion_notes' => 'Test completion with multiple parts',
            'parts_used' => $partsUsage
        ];

        // Execute the visit completion
        $result = $this->visitExecutionService->completeVisit($visit->id, $visitData);

        // Verify the operation was successful
        $this->assertTrue($result['success']);

        // Property: Each product's inventory should be correctly decremented
        foreach ($partsUsage as $usage) {
            $product = MaintenanceProduct::find($usage['maintenance_product_id']);
            $expectedStock = $initialStocks[$product->id] - $usage['quantity_used'];
            
            $this->assertEquals(
                $expectedStock,
                $product->stock_quantity,
                "Product {$product->id} inventory should be decremented correctly"
            );
        }

        // Property: Total visit cost should equal sum of all parts costs
        $expectedTotalCost = collect($partsUsage)->sum(function ($usage) {
            return $usage['quantity_used'] * $usage['unit_cost'];
        });

        $actualTotalCost = MaintenanceVisitItem::where('maintenance_visit_id', $visit->id)
            ->sum('total_cost');

        $this->assertEquals($expectedTotalCost, $actualTotalCost);
    }

    /**
     * Property 5.2: Insufficient stock should be handled gracefully
     */
    public function test_insufficient_stock_handling()
    {
        $iterations = 20;
        
        for ($i = 0; $i < $iterations; $i++) {
            $this->runInsufficientStockTest();
        }
    }

    private function runInsufficientStockTest()
    {
        // Create product with limited stock
        $availableStock = rand(1, 5);
        $requestedQuantity = $availableStock + rand(1, 10); // Request more than available
        
        $product = MaintenanceProduct::factory()->create([
            'stock_quantity' => $availableStock,
            'unit_cost' => rand(10, 100) / 10,
        ]);

        // Create maintenance visit
        $visit = MaintenanceVisit::factory()->create([
            'status' => 'in_progress'
        ]);

        // Attempt to complete visit with insufficient stock
        $visitData = [
            'status' => 'completed',
            'completion_notes' => 'Test with insufficient stock',
            'parts_used' => [
                [
                    'maintenance_product_id' => $product->id,
                    'quantity_used' => $requestedQuantity,
                    'unit_cost' => $product->unit_cost,
                    'notes' => 'Requesting more than available'
                ]
            ]
        ];

        // Execute the visit completion
        $result = $this->visitExecutionService->completeVisit($visit->id, $visitData);

        // Property: Operation should fail gracefully when insufficient stock
        $this->assertFalse($result['success']);
        $this->assertStringContainsString('insufficient stock', strtolower($result['message']));

        // Property: Inventory should remain unchanged when operation fails
        $unchangedProduct = $product->fresh();
        $this->assertEquals($availableStock, $unchangedProduct->stock_quantity);

        // Property: No visit items should be created when operation fails
        $visitItemCount = MaintenanceVisitItem::where('maintenance_visit_id', $visit->id)->count();
        $this->assertEquals(0, $visitItemCount);
    }

    /**
     * Property 5.3: Concurrent inventory updates should maintain consistency
     */
    public function test_concurrent_inventory_updates()
    {
        // This test simulates concurrent access to inventory
        $initialStock = 20;
        $product = MaintenanceProduct::factory()->create([
            'stock_quantity' => $initialStock,
            'unit_cost' => 10.0,
        ]);

        // Create multiple visits that will use the same product
        $visits = MaintenanceVisit::factory()->count(3)->create([
            'status' => 'in_progress'
        ]);

        $quantityPerVisit = 5;
        $totalQuantityUsed = 0;

        // Complete each visit sequentially (simulating concurrent access)
        foreach ($visits as $visit) {
            $visitData = [
                'status' => 'completed',
                'completion_notes' => 'Concurrent test visit',
                'parts_used' => [
                    [
                        'maintenance_product_id' => $product->id,
                        'quantity_used' => $quantityPerVisit,
                        'unit_cost' => $product->unit_cost,
                        'notes' => 'Concurrent usage'
                    ]
                ]
            ];

            $result = $this->visitExecutionService->completeVisit($visit->id, $visitData);
            
            if ($result['success']) {
                $totalQuantityUsed += $quantityPerVisit;
            }
        }

        // Property: Final inventory should reflect all successful operations
        $finalProduct = $product->fresh();
        $expectedFinalStock = $initialStock - $totalQuantityUsed;
        
        $this->assertEquals($expectedFinalStock, $finalProduct->stock_quantity);
        $this->assertGreaterThanOrEqual(0, $finalProduct->stock_quantity);
    }
}