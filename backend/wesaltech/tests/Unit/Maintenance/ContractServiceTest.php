<?php

namespace Tests\Unit\Maintenance;

use Tests\TestCase;
use App\Services\Maintenance\ContractService;
use App\Models\MaintenanceContract;
use App\Models\MaintenanceVisit;
use App\Models\Tenant;
use App\Models\Branch;
use App\Models\Product;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Carbon\Carbon;

class ContractServiceTest extends TestCase
{
    use RefreshDatabase;

    private ContractService $contractService;
    private Tenant $tenant;
    private Branch $branch;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->contractService = new ContractService();
        
        // Create test tenant and branch
        $this->tenant = Tenant::factory()->create();
        $this->branch = Branch::factory()->create(['tenant_id' => $this->tenant->id]);
        
        // Create and authenticate user
        $this->user = User::factory()->create(['tenant_id' => $this->tenant->id]);
        $this->actingAs($this->user);
    }

    /**
     * **Feature: maintenance-workflow-refinement, Property 3: Contract Health Calculation**
     * **Validates: Requirements 1.4**
     */
    public function test_contract_health_calculation_remaining_visits_consistency()
    {
        // Test with multiple contract scenarios
        $testScenarios = [
            // Scenario 1: New contract with no visits
            [
                'total_visits' => 0,
                'completed_visits' => 0,
                'expected_remaining' => 12, // Monthly for 1 year
            ],
            // Scenario 2: Contract with some completed visits
            [
                'total_visits' => 6,
                'completed_visits' => 4,
                'expected_remaining' => 8, // 12 - 4 completed
            ],
            // Scenario 3: Contract with all visits completed
            [
                'total_visits' => 12,
                'completed_visits' => 12,
                'expected_remaining' => 0,
            ],
            // Scenario 4: Contract with mixed visit statuses
            [
                'total_visits' => 8,
                'completed_visits' => 3,
                'expected_remaining' => 9, // 12 - 3 completed
            ],
        ];

        foreach ($testScenarios as $index => $scenario) {
            // Create contract with 1-year duration and monthly frequency
            $contract = MaintenanceContract::factory()->create([
                'tenant_id' => $this->tenant->id,
                'branch_id' => $this->branch->id,
                'frequency' => 'monthly',
                'start_date' => now()->subYear(),
                'end_date' => now(),
                'status' => 'active',
            ]);

            // Create visits according to scenario
            for ($i = 0; $i < $scenario['completed_visits']; $i++) {
                MaintenanceVisit::factory()->completed()->create([
                    'tenant_id' => $this->tenant->id,
                    'branch_id' => $this->branch->id,
                    'maintenance_contract_id' => $contract->id,
                ]);
            }

            // Create remaining visits as scheduled
            $remainingVisits = $scenario['total_visits'] - $scenario['completed_visits'];
            for ($i = 0; $i < $remainingVisits; $i++) {
                MaintenanceVisit::factory()->scheduled()->create([
                    'tenant_id' => $this->tenant->id,
                    'branch_id' => $this->branch->id,
                    'maintenance_contract_id' => $contract->id,
                ]);
            }

            // Test the property: remaining visits = total planned - completed
            $health = $this->contractService->getContractHealth($contract->id);
            $actualRemaining = $this->contractService->calculateRemainingVisits($contract);
            
            // The property: remaining visits should equal total planned minus completed
            $this->assertEquals(
                $scenario['expected_remaining'],
                $actualRemaining,
                "Scenario {$index}: Remaining visits calculation failed. Expected: {$scenario['expected_remaining']}, Got: {$actualRemaining}"
            );

            // Additional property: health metrics should be consistent
            $this->assertEquals($scenario['completed_visits'], $health['completed_visits']);
            $this->assertEquals($scenario['total_visits'], $health['total_visits']);
            
            // Property: completion rate should be calculated correctly
            $expectedCompletionRate = $scenario['total_visits'] > 0 ? 
                ($scenario['completed_visits'] / $scenario['total_visits']) * 100 : 0;
            $this->assertEquals(
                round($expectedCompletionRate, 2),
                $health['completion_rate'],
                "Scenario {$index}: Completion rate calculation failed"
            );
        }
    }

    /**
     * **Feature: maintenance-workflow-refinement, Property 3: Contract Health Calculation**
     * **Validates: Requirements 1.4**
     */
    public function test_contract_health_calculation_with_different_frequencies()
    {
        $frequencies = [
            'weekly' => ['duration_months' => 12, 'expected_visits' => 52],
            'monthly' => ['duration_months' => 12, 'expected_visits' => 12],
            'quarterly' => ['duration_months' => 12, 'expected_visits' => 4],
            'semi_annual' => ['duration_months' => 12, 'expected_visits' => 2],
            'annual' => ['duration_months' => 24, 'expected_visits' => 2],
        ];

        foreach ($frequencies as $frequency => $config) {
            $contract = MaintenanceContract::factory()->create([
                'tenant_id' => $this->tenant->id,
                'branch_id' => $this->branch->id,
                'frequency' => $frequency,
                'start_date' => now(),
                'end_date' => now()->addMonths($config['duration_months']),
                'status' => 'active',
            ]);

            // Create some completed visits (25% of expected)
            $completedCount = intval($config['expected_visits'] * 0.25);
            for ($i = 0; $i < $completedCount; $i++) {
                MaintenanceVisit::factory()->completed()->create([
                    'tenant_id' => $this->tenant->id,
                    'branch_id' => $this->branch->id,
                    'maintenance_contract_id' => $contract->id,
                ]);
            }

            // Test the property: remaining visits calculation is consistent across frequencies
            $remainingVisits = $this->contractService->calculateRemainingVisits($contract);
            $expectedRemaining = $config['expected_visits'] - $completedCount;
            
            $this->assertEquals(
                $expectedRemaining,
                $remainingVisits,
                "Frequency {$frequency}: Remaining visits calculation failed. Expected: {$expectedRemaining}, Got: {$remainingVisits}"
            );

            // Property: health calculation should work for all frequencies
            $health = $this->contractService->getContractHealth($contract->id);
            $this->assertIsArray($health);
            $this->assertArrayHasKey('remaining_visits', $health);
            $this->assertEquals($expectedRemaining, $health['remaining_visits']);
        }
    }

    /**
     * **Feature: maintenance-workflow-refinement, Property 3: Contract Health Calculation**
     * **Validates: Requirements 1.4**
     */
    public function test_contract_health_calculation_with_custom_frequency()
    {
        $customFrequencies = [
            ['value' => 2, 'unit' => 'weeks', 'duration_months' => 6, 'expected_visits' => 13], // Every 2 weeks for 6 months
            ['value' => 3, 'unit' => 'months', 'duration_months' => 12, 'expected_visits' => 4], // Every 3 months for 1 year
            ['value' => 10, 'unit' => 'days', 'duration_months' => 2, 'expected_visits' => 6], // Every 10 days for 2 months
        ];

        foreach ($customFrequencies as $index => $config) {
            $contract = MaintenanceContract::factory()->create([
                'tenant_id' => $this->tenant->id,
                'branch_id' => $this->branch->id,
                'frequency' => 'custom',
                'frequency_value' => $config['value'],
                'frequency_unit' => $config['unit'],
                'start_date' => now(),
                'end_date' => now()->addMonths($config['duration_months']),
                'status' => 'active',
            ]);

            // Create some completed visits
            $completedCount = intval($config['expected_visits'] / 2);
            for ($i = 0; $i < $completedCount; $i++) {
                MaintenanceVisit::factory()->completed()->create([
                    'tenant_id' => $this->tenant->id,
                    'branch_id' => $this->branch->id,
                    'maintenance_contract_id' => $contract->id,
                ]);
            }

            // Test the property: custom frequency calculations are consistent
            $remainingVisits = $this->contractService->calculateRemainingVisits($contract);
            $expectedRemaining = $config['expected_visits'] - $completedCount;
            
            $this->assertEquals(
                $expectedRemaining,
                $remainingVisits,
                "Custom frequency {$index}: Remaining visits calculation failed. Expected: {$expectedRemaining}, Got: {$remainingVisits}"
            );

            // Property: health status should be determined correctly
            $health = $this->contractService->getContractHealth($contract->id);
            $this->assertContains($health['health_status'], ['excellent', 'good', 'fair', 'poor', 'active']);
        }
    }

    /**
     * **Feature: maintenance-workflow-refinement, Property 3: Contract Health Calculation**
     * **Validates: Requirements 1.4**
     */
    public function test_contract_health_calculation_with_overdue_visits()
    {
        $contract = MaintenanceContract::factory()->create([
            'tenant_id' => $this->tenant->id,
            'branch_id' => $this->branch->id,
            'frequency' => 'monthly',
            'start_date' => now()->subYear(),
            'end_date' => now()->addYear(),
            'status' => 'active',
        ]);

        // Create a mix of visit statuses
        $visitConfigs = [
            ['status' => 'completed', 'count' => 5],
            ['status' => 'scheduled', 'count' => 3],
            ['status' => 'overdue', 'count' => 2], // These should affect health status
        ];

        foreach ($visitConfigs as $config) {
            for ($i = 0; $i < $config['count']; $i++) {
                if ($config['status'] === 'overdue') {
                    MaintenanceVisit::factory()->overdue()->create([
                        'tenant_id' => $this->tenant->id,
                        'branch_id' => $this->branch->id,
                        'maintenance_contract_id' => $contract->id,
                    ]);
                } else {
                    MaintenanceVisit::factory()->create([
                        'tenant_id' => $this->tenant->id,
                        'branch_id' => $this->branch->id,
                        'maintenance_contract_id' => $contract->id,
                        'status' => $config['status'],
                    ]);
                }
            }
        }

        // Test the property: overdue visits should affect health status
        $health = $this->contractService->getContractHealth($contract->id);
        
        // Property: overdue visits should be counted correctly
        $this->assertEquals(2, $health['overdue_visits']);
        
        // Property: health status should reflect overdue condition
        $this->assertEquals('overdue', $health['health_status']);
        
        // Property: total visits should include all statuses
        $expectedTotal = array_sum(array_column($visitConfigs, 'count'));
        $this->assertEquals($expectedTotal, $health['total_visits']);
        
        // Property: completed visits should only count completed status
        $this->assertEquals(5, $health['completed_visits']);
    }

    /**
     * **Feature: maintenance-workflow-refinement, Property 3: Contract Health Calculation**
     * **Validates: Requirements 1.4**
     */
    public function test_contract_health_calculation_edge_cases()
    {
        // Edge Case 1: Contract with no end date (unlimited)
        $unlimitedContract = MaintenanceContract::factory()->create([
            'tenant_id' => $this->tenant->id,
            'branch_id' => $this->branch->id,
            'frequency' => 'monthly',
            'start_date' => now()->subMonths(6),
            'end_date' => null, // No end date
            'status' => 'active',
        ]);

        $remainingVisits = $this->contractService->calculateRemainingVisits($unlimitedContract);
        $this->assertEquals(PHP_INT_MAX, $remainingVisits, "Unlimited contract should have PHP_INT_MAX remaining visits");

        // Edge Case 2: One-time contract
        $oneTimeContract = MaintenanceContract::factory()->create([
            'tenant_id' => $this->tenant->id,
            'branch_id' => $this->branch->id,
            'frequency' => 'once',
            'start_date' => now(),
            'end_date' => now()->addMonth(),
            'status' => 'active',
        ]);

        $remainingVisits = $this->contractService->calculateRemainingVisits($oneTimeContract);
        $this->assertEquals(1, $remainingVisits, "One-time contract should have 1 remaining visit");

        // Complete the one-time visit
        MaintenanceVisit::factory()->completed()->create([
            'tenant_id' => $this->tenant->id,
            'branch_id' => $this->branch->id,
            'maintenance_contract_id' => $oneTimeContract->id,
        ]);

        $remainingVisits = $this->contractService->calculateRemainingVisits($oneTimeContract);
        $this->assertEquals(0, $remainingVisits, "Completed one-time contract should have 0 remaining visits");

        // Edge Case 3: Expired contract
        $expiredContract = MaintenanceContract::factory()->expired()->create([
            'tenant_id' => $this->tenant->id,
            'branch_id' => $this->branch->id,
        ]);

        $health = $this->contractService->getContractHealth($expiredContract->id);
        $this->assertTrue($health['is_expired'], "Expired contract should be marked as expired");
        $this->assertLessThan(0, $health['days_until_expiry'], "Expired contract should have negative days until expiry");
    }
}