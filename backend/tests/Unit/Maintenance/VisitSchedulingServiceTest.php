<?php

namespace Tests\Unit\Maintenance;

use Tests\TestCase;
use App\Services\Maintenance\VisitSchedulingService;
use App\Services\BranchContextService;
use App\Models\MaintenanceContract;
use App\Models\MaintenanceVisit;
use App\Models\Tenant;
use App\Models\Branch;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Carbon\Carbon;

class VisitSchedulingServiceTest extends TestCase
{
    use RefreshDatabase;

    private VisitSchedulingService $visitSchedulingService;
    private Tenant $tenant;
    private Branch $branch;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create mock BranchContextService
        $branchContextService = $this->createMock(BranchContextService::class);
        $this->visitSchedulingService = new VisitSchedulingService($branchContextService);
        
        // Create test tenant and branch
        $this->tenant = Tenant::factory()->create();
        $this->branch = Branch::factory()->create(['tenant_id' => $this->tenant->id]);
        
        // Create and authenticate user
        $this->user = User::factory()->create(['tenant_id' => $this->tenant->id]);
        $this->actingAs($this->user);
    }

    /**
     * **Feature: maintenance-workflow-refinement, Property 1: Contract Visit Generation Idempotency**
     * **Validates: Requirements 2.2**
     */
    public function test_visit_generation_idempotency_property()
    {
        // Test scenarios with different contract configurations
        $testScenarios = [
            [
                'frequency' => 'weekly',
                'duration_weeks' => 4,
                'expected_visits' => 4,
            ],
            [
                'frequency' => 'monthly', 
                'duration_months' => 6,
                'expected_visits' => 6,
            ],
            [
                'frequency' => 'quarterly',
                'duration_months' => 12,
                'expected_visits' => 4,
            ],
        ];

        foreach ($testScenarios as $index => $scenario) {
            $startDate = Carbon::now();
            $endDate = isset($scenario['duration_weeks']) 
                ? $startDate->copy()->addWeeks($scenario['duration_weeks'])
                : $startDate->copy()->addMonths($scenario['duration_months']);

            $contract = MaintenanceContract::factory()->create([
                'tenant_id' => $this->tenant->id,
                'branch_id' => $this->branch->id,
                'frequency' => $scenario['frequency'],
                'start_date' => $startDate,
                'end_date' => $endDate,
                'status' => 'active',
            ]);

            // Property: First generation should create expected number of visits
            $firstGeneration = $this->visitSchedulingService->generateScheduledVisits($contract);
            $this->assertEquals(
                $scenario['expected_visits'],
                $firstGeneration->count(),
                "Scenario {$index}: First generation should create {$scenario['expected_visits']} visits"
            );

            // Property: Second generation should be idempotent (create no new visits)
            $secondGeneration = $this->visitSchedulingService->generateScheduledVisits($contract);
            $this->assertEquals(
                0,
                $secondGeneration->count(),
                "Scenario {$index}: Second generation should be idempotent and create 0 new visits"
            );

            // Property: Total visits in database should remain the same
            $totalVisitsAfterSecond = MaintenanceVisit::where('maintenance_contract_id', $contract->id)->count();
            $this->assertEquals(
                $scenario['expected_visits'],
                $totalVisitsAfterSecond,
                "Scenario {$index}: Total visits should remain {$scenario['expected_visits']} after second generation"
            );

            // Property: Third generation should also be idempotent
            $thirdGeneration = $this->visitSchedulingService->generateScheduledVisits($contract);
            $this->assertEquals(
                0,
                $thirdGeneration->count(),
                "Scenario {$index}: Third generation should also be idempotent"
            );

            // Property: All visits should have unique scheduled dates
            $visitDates = MaintenanceVisit::where('maintenance_contract_id', $contract->id)
                ->pluck('scheduled_date')
                ->toArray();
            $uniqueDates = array_unique($visitDates);
            $this->assertEquals(
                count($visitDates),
                count($uniqueDates),
                "Scenario {$index}: All visits should have unique scheduled dates"
            );
        }
    }

    /**
     * **Feature: maintenance-workflow-refinement, Property 1: Contract Visit Generation Idempotency**
     * **Validates: Requirements 2.2**
     */
    public function test_visit_generation_idempotency_with_existing_visits()
    {
        $contract = MaintenanceContract::factory()->create([
            'tenant_id' => $this->tenant->id,
            'branch_id' => $this->branch->id,
            'frequency' => 'monthly',
            'start_date' => Carbon::now(),
            'end_date' => Carbon::now()->addMonths(3),
            'status' => 'active',
        ]);

        // Create some visits manually first
        $manualVisit1 = MaintenanceVisit::factory()->create([
            'tenant_id' => $this->tenant->id,
            'branch_id' => $this->branch->id,
            'maintenance_contract_id' => $contract->id,
            'scheduled_date' => Carbon::now()->format('Y-m-d'),
            'status' => 'scheduled',
        ]);

        $manualVisit2 = MaintenanceVisit::factory()->create([
            'tenant_id' => $this->tenant->id,
            'branch_id' => $this->branch->id,
            'maintenance_contract_id' => $contract->id,
            'scheduled_date' => Carbon::now()->addMonth()->format('Y-m-d'),
            'status' => 'scheduled',
        ]);

        // Property: Generation should not duplicate existing visits
        $generatedVisits = $this->visitSchedulingService->generateScheduledVisits($contract);
        
        // Should only create visits for dates that don't already exist
        $expectedNewVisits = 2; // 3 total months - 2 existing = 1 new visit
        $this->assertEquals(
            $expectedNewVisits,
            $generatedVisits->count(),
            "Should only create visits for dates that don't already exist"
        );

        // Property: Total visits should be correct
        $totalVisits = MaintenanceVisit::where('maintenance_contract_id', $contract->id)->count();
        $this->assertEquals(4, $totalVisits, "Total visits should be 4 (2 manual + 2 generated)");

        // Property: Second generation should create no new visits
        $secondGeneration = $this->visitSchedulingService->generateScheduledVisits($contract);
        $this->assertEquals(0, $secondGeneration->count(), "Second generation should create no new visits");
    }

    /**
     * **Feature: maintenance-workflow-refinement, Property 1: Contract Visit Generation Idempotency**
     * **Validates: Requirements 2.2**
     */
    public function test_visit_generation_idempotency_across_different_statuses()
    {
        $contract = MaintenanceContract::factory()->create([
            'tenant_id' => $this->tenant->id,
            'branch_id' => $this->branch->id,
            'frequency' => 'weekly',
            'start_date' => Carbon::now(),
            'end_date' => Carbon::now()->addWeeks(4),
            'status' => 'active',
        ]);

        // Generate initial visits
        $initialVisits = $this->visitSchedulingService->generateScheduledVisits($contract);
        $this->assertEquals(4, $initialVisits->count());

        // Change some visit statuses
        $visits = MaintenanceVisit::where('maintenance_contract_id', $contract->id)->get();
        $visits[0]->update(['status' => 'completed']);
        $visits[1]->update(['status' => 'cancelled']);
        $visits[2]->update(['status' => 'rescheduled']);
        // visits[3] remains 'scheduled'

        // Property: Idempotency should work regardless of visit status changes
        $secondGeneration = $this->visitSchedulingService->generateScheduledVisits($contract);
        $this->assertEquals(
            0,
            $secondGeneration->count(),
            "Should not create new visits even when existing visits have different statuses"
        );

        // Property: Total visit count should remain the same
        $totalVisits = MaintenanceVisit::where('maintenance_contract_id', $contract->id)->count();
        $this->assertEquals(4, $totalVisits, "Total visit count should remain unchanged");
    }

    /**
     * **Feature: maintenance-workflow-refinement, Property 1: Contract Visit Generation Idempotency**
     * **Validates: Requirements 2.2**
     */
    public function test_visit_generation_idempotency_edge_cases()
    {
        // Edge Case 1: Contract with no end date
        $unlimitedContract = MaintenanceContract::factory()->create([
            'tenant_id' => $this->tenant->id,
            'branch_id' => $this->branch->id,
            'frequency' => 'monthly',
            'start_date' => Carbon::now(),
            'end_date' => null,
            'status' => 'active',
        ]);

        // Should handle unlimited contracts gracefully
        $visits = $this->visitSchedulingService->generateScheduledVisits($unlimitedContract);
        $this->assertGreaterThan(0, $visits->count(), "Should generate visits for unlimited contract");
        
        // Second generation should be idempotent
        $secondVisits = $this->visitSchedulingService->generateScheduledVisits($unlimitedContract);
        $this->assertEquals(0, $secondVisits->count(), "Second generation should be idempotent for unlimited contract");

        // Edge Case 2: One-time contract
        $oneTimeContract = MaintenanceContract::factory()->create([
            'tenant_id' => $this->tenant->id,
            'branch_id' => $this->branch->id,
            'frequency' => 'once',
            'start_date' => Carbon::now(),
            'end_date' => Carbon::now()->addDay(),
            'status' => 'active',
        ]);

        $oneTimeVisits = $this->visitSchedulingService->generateScheduledVisits($oneTimeContract);
        $this->assertEquals(1, $oneTimeVisits->count(), "One-time contract should generate exactly 1 visit");

        // Second generation should be idempotent
        $secondOneTimeVisits = $this->visitSchedulingService->generateScheduledVisits($oneTimeContract);
        $this->assertEquals(0, $secondOneTimeVisits->count(), "Second generation should be idempotent for one-time contract");

        // Edge Case 3: Contract with very short duration
        $shortContract = MaintenanceContract::factory()->create([
            'tenant_id' => $this->tenant->id,
            'branch_id' => $this->branch->id,
            'frequency' => 'daily',
            'start_date' => Carbon::now(),
            'end_date' => Carbon::now()->addDays(2),
            'status' => 'active',
        ]);

        $shortVisits = $this->visitSchedulingService->generateScheduledVisits($shortContract);
        $this->assertEquals(2, $shortVisits->count(), "Short contract should generate correct number of visits");

        // Idempotency check
        $secondShortVisits = $this->visitSchedulingService->generateScheduledVisits($shortContract);
        $this->assertEquals(0, $secondShortVisits->count(), "Should be idempotent for short contracts");
    }

    /**
     * **Feature: maintenance-workflow-refinement, Property 7: Visit Scheduling Frequency Compliance**
     * **Validates: Requirements 2.1**
     */
    public function test_visit_scheduling_frequency_compliance_property()
    {
        $frequencyTestCases = [
            [
                'frequency' => 'daily',
                'start_date' => Carbon::now(),
                'end_date' => Carbon::now()->addDays(7),
                'expected_visits' => 7,
                'expected_interval_days' => 1,
            ],
            [
                'frequency' => 'weekly',
                'start_date' => Carbon::now(),
                'end_date' => Carbon::now()->addWeeks(4),
                'expected_visits' => 4,
                'expected_interval_days' => 7,
            ],
            [
                'frequency' => 'bi_weekly',
                'start_date' => Carbon::now(),
                'end_date' => Carbon::now()->addWeeks(8),
                'expected_visits' => 4,
                'expected_interval_days' => 14,
            ],
            [
                'frequency' => 'monthly',
                'start_date' => Carbon::now(),
                'end_date' => Carbon::now()->addMonths(6),
                'expected_visits' => 6,
                'expected_interval_days' => 30, // Approximate
            ],
            [
                'frequency' => 'quarterly',
                'start_date' => Carbon::now(),
                'end_date' => Carbon::now()->addMonths(12),
                'expected_visits' => 4,
                'expected_interval_days' => 90, // Approximate
            ],
        ];

        foreach ($frequencyTestCases as $index => $testCase) {
            $contract = MaintenanceContract::factory()->create([
                'tenant_id' => $this->tenant->id,
                'branch_id' => $this->branch->id,
                'frequency' => $testCase['frequency'],
                'start_date' => $testCase['start_date'],
                'end_date' => $testCase['end_date'],
                'status' => 'active',
            ]);

            $visits = $this->visitSchedulingService->generateScheduledVisits($contract);

            // Property: Number of visits should match expected frequency
            $this->assertEquals(
                $testCase['expected_visits'],
                $visits->count(),
                "Frequency {$testCase['frequency']}: Should generate {$testCase['expected_visits']} visits"
            );

            // Property: Visit dates should follow the specified frequency pattern
            $visitDates = MaintenanceVisit::where('maintenance_contract_id', $contract->id)
                ->orderBy('scheduled_date')
                ->pluck('scheduled_date')
                ->map(fn($date) => Carbon::parse($date))
                ->toArray();

            // Check intervals between consecutive visits
            for ($i = 1; $i < count($visitDates); $i++) {
                $interval = $visitDates[$i]->diffInDays($visitDates[$i - 1]);
                
                // Allow some tolerance for monthly/quarterly due to varying month lengths
                $tolerance = in_array($testCase['frequency'], ['monthly', 'quarterly']) ? 5 : 0;
                
                $this->assertLessThanOrEqual(
                    $testCase['expected_interval_days'] + $tolerance,
                    $interval,
                    "Frequency {$testCase['frequency']}: Interval between visits should not exceed expected interval + tolerance"
                );
                
                $this->assertGreaterThanOrEqual(
                    $testCase['expected_interval_days'] - $tolerance,
                    $interval,
                    "Frequency {$testCase['frequency']}: Interval between visits should not be less than expected interval - tolerance"
                );
            }

            // Property: First visit should be on or after start date
            if (!empty($visitDates)) {
                $this->assertGreaterThanOrEqual(
                    $testCase['start_date']->format('Y-m-d'),
                    $visitDates[0]->format('Y-m-d'),
                    "Frequency {$testCase['frequency']}: First visit should be on or after start date"
                );
            }

            // Property: Last visit should be on or before end date
            if (!empty($visitDates)) {
                $lastVisit = end($visitDates);
                $this->assertLessThanOrEqual(
                    $testCase['end_date']->format('Y-m-d'),
                    $lastVisit->format('Y-m-d'),
                    "Frequency {$testCase['frequency']}: Last visit should be on or before end date"
                );
            }
        }
    }

    /**
     * **Feature: maintenance-workflow-refinement, Property 7: Visit Scheduling Frequency Compliance**
     * **Validates: Requirements 2.1**
     */
    public function test_visit_scheduling_frequency_compliance_with_custom_frequencies()
    {
        $customFrequencyTestCases = [
            [
                'frequency' => 'custom',
                'frequency_value' => 3,
                'frequency_unit' => 'days',
                'start_date' => Carbon::now(),
                'end_date' => Carbon::now()->addDays(15),
                'expected_visits' => 5, // Every 3 days for 15 days
                'expected_interval_days' => 3,
            ],
            [
                'frequency' => 'custom',
                'frequency_value' => 2,
                'frequency_unit' => 'weeks',
                'start_date' => Carbon::now(),
                'end_date' => Carbon::now()->addWeeks(10),
                'expected_visits' => 5, // Every 2 weeks for 10 weeks
                'expected_interval_days' => 14,
            ],
            [
                'frequency' => 'custom',
                'frequency_value' => 2,
                'frequency_unit' => 'months',
                'start_date' => Carbon::now(),
                'end_date' => Carbon::now()->addMonths(8),
                'expected_visits' => 4, // Every 2 months for 8 months
                'expected_interval_days' => 60, // Approximate
            ],
        ];

        foreach ($customFrequencyTestCases as $index => $testCase) {
            $contract = MaintenanceContract::factory()->create([
                'tenant_id' => $this->tenant->id,
                'branch_id' => $this->branch->id,
                'frequency' => $testCase['frequency'],
                'frequency_value' => $testCase['frequency_value'],
                'frequency_unit' => $testCase['frequency_unit'],
                'start_date' => $testCase['start_date'],
                'end_date' => $testCase['end_date'],
                'status' => 'active',
            ]);

            $visits = $this->visitSchedulingService->generateScheduledVisits($contract);

            // Property: Custom frequency should generate expected number of visits
            $this->assertEquals(
                $testCase['expected_visits'],
                $visits->count(),
                "Custom frequency {$testCase['frequency_value']} {$testCase['frequency_unit']}: Should generate {$testCase['expected_visits']} visits"
            );

            // Property: Custom frequency intervals should be respected
            $visitDates = MaintenanceVisit::where('maintenance_contract_id', $contract->id)
                ->orderBy('scheduled_date')
                ->pluck('scheduled_date')
                ->map(fn($date) => Carbon::parse($date))
                ->toArray();

            if (count($visitDates) > 1) {
                for ($i = 1; $i < count($visitDates); $i++) {
                    $interval = $visitDates[$i]->diffInDays($visitDates[$i - 1]);
                    
                    // Allow tolerance for month-based custom frequencies
                    $tolerance = $testCase['frequency_unit'] === 'months' ? 5 : 1;
                    
                    $this->assertLessThanOrEqual(
                        $testCase['expected_interval_days'] + $tolerance,
                        $interval,
                        "Custom frequency: Interval should not exceed expected + tolerance"
                    );
                    
                    $this->assertGreaterThanOrEqual(
                        $testCase['expected_interval_days'] - $tolerance,
                        $interval,
                        "Custom frequency: Interval should not be less than expected - tolerance"
                    );
                }
            }
        }
    }

    /**
     * **Feature: maintenance-workflow-refinement, Property 7: Visit Scheduling Frequency Compliance**
     * **Validates: Requirements 2.1**
     */
    public function test_visit_scheduling_frequency_compliance_edge_cases()
    {
        // Edge Case 1: Very high frequency (daily for a long period)
        $highFrequencyContract = MaintenanceContract::factory()->create([
            'tenant_id' => $this->tenant->id,
            'branch_id' => $this->branch->id,
            'frequency' => 'daily',
            'start_date' => Carbon::now(),
            'end_date' => Carbon::now()->addDays(30),
            'status' => 'active',
        ]);

        $highFrequencyVisits = $this->visitSchedulingService->generateScheduledVisits($highFrequencyContract);
        
        // Property: High frequency should generate correct number of visits
        $this->assertEquals(30, $highFrequencyVisits->count(), "High frequency should generate 30 daily visits");
        
        // Property: All visits should be exactly 1 day apart
        $visitDates = MaintenanceVisit::where('maintenance_contract_id', $highFrequencyContract->id)
            ->orderBy('scheduled_date')
            ->pluck('scheduled_date')
            ->map(fn($date) => Carbon::parse($date))
            ->toArray();

        for ($i = 1; $i < count($visitDates); $i++) {
            $interval = $visitDates[$i]->diffInDays($visitDates[$i - 1]);
            $this->assertEquals(1, $interval, "Daily visits should be exactly 1 day apart");
        }

        // Edge Case 2: Very low frequency (annual)
        $lowFrequencyContract = MaintenanceContract::factory()->create([
            'tenant_id' => $this->tenant->id,
            'branch_id' => $this->branch->id,
            'frequency' => 'annual',
            'start_date' => Carbon::now(),
            'end_date' => Carbon::now()->addYears(3),
            'status' => 'active',
        ]);

        $lowFrequencyVisits = $this->visitSchedulingService->generateScheduledVisits($lowFrequencyContract);
        
        // Property: Low frequency should generate correct number of visits
        $this->assertEquals(3, $lowFrequencyVisits->count(), "Annual frequency should generate 3 visits over 3 years");

        // Edge Case 3: Contract spanning leap year
        $leapYearContract = MaintenanceContract::factory()->create([
            'tenant_id' => $this->tenant->id,
            'branch_id' => $this->branch->id,
            'frequency' => 'monthly',
            'start_date' => Carbon::create(2024, 1, 1), // 2024 is a leap year
            'end_date' => Carbon::create(2024, 12, 31),
            'status' => 'active',
        ]);

        $leapYearVisits = $this->visitSchedulingService->generateScheduledVisits($leapYearContract);
        
        // Property: Leap year should not affect monthly frequency count
        $this->assertEquals(12, $leapYearVisits->count(), "Monthly frequency should generate 12 visits in leap year");
    }
}