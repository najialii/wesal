<?php

namespace Tests\Unit\Maintenance;

use Tests\TestCase;
use App\Services\Maintenance\ContractService;
use App\Services\BranchContextService;
use App\Models\MaintenanceContract;
use App\Models\MaintenanceVisit;
use App\Models\User;
use App\Models\Branch;
use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

/**
 * Feature: maintenance-workflow-refinement, Property 6: Contract Expiration Handling
 */
class ContractExpirationPropertyTest extends TestCase
{
    use RefreshDatabase;

    private ContractService $contractService;
    private BranchContextService $branchContextService;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create mock BranchContextService
        $this->branchContextService = $this->createMock(BranchContextService::class);
        $this->contractService = new ContractService($this->branchContextService);
    }

    /**
     * Property Test: Contract Expiration Handling
     * 
     * For any expired or cancelled contract, all future scheduled visits 
     * should be automatically cancelled.
     * 
     * **Validates: Requirements 2.5**
     */
    public function test_contract_expiration_handling_property()
    {
        // Run property test with multiple iterations
        for ($i = 0; $i < 25; $i++) {
            $this->runContractExpirationProperty();
        }
    }

    private function runContractExpirationProperty()
    {
        // Create test tenant and branch
        $tenant = Tenant::factory()->create();
        $branch = Branch::factory()->create(['tenant_id' => $tenant->id]);
        
        // Create user with access to branch
        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
            'role' => 'business_owner'
        ]);
        
        // Mock branch context service
        $this->branchContextService
            ->method('getUserBranches')
            ->with($user)
            ->willReturn(collect([$branch]));
        
        $this->branchContextService
            ->method('canAccessBranch')
            ->willReturn(true);
        
        Auth::login($user);
        
        // Create expired contract
        $expiredDate = Carbon::now()->subDays(rand(1, 30));
        $contract = MaintenanceContract::factory()->create([
            'tenant_id' => $tenant->id,
            'branch_id' => $branch->id,
            'status' => 'active',
            'start_date' => $expiredDate->copy()->subMonths(6),
            'end_date' => $expiredDate,
        ]);
        
        // Create future scheduled visits
        $futureVisits = collect();
        for ($j = 0; $j < rand(2, 5); $j++) {
            $futureDate = Carbon::now()->addDays(rand(1, 30));
            $visit = MaintenanceVisit::factory()->create([
                'tenant_id' => $tenant->id,
                'branch_id' => $branch->id,
                'maintenance_contract_id' => $contract->id,
                'status' => 'scheduled',
                'scheduled_date' => $futureDate,
            ]);
            $futureVisits->push($visit);
        }
        
        // Create some past visits (should not be affected)
        $pastVisits = collect();
        for ($j = 0; $j < rand(1, 3); $j++) {
            $pastDate = Carbon::now()->subDays(rand(1, 30));
            $visit = MaintenanceVisit::factory()->create([
                'tenant_id' => $tenant->id,
                'branch_id' => $branch->id,
                'maintenance_contract_id' => $contract->id,
                'status' => rand(0, 1) ? 'completed' : 'scheduled',
                'scheduled_date' => $pastDate,
            ]);
            $pastVisits->push($visit);
        }
        
        // Property: Handle contract expiration
        $results = $this->contractService->handleContractExpiration($contract->id);
        
        // Verify the property holds
        $this->assertTrue($results['status_updated'], 
            'Contract status should be updated when expired');
        
        $this->assertEquals($futureVisits->count(), $results['cancelled_visits'],
            'All future scheduled visits should be cancelled');
        
        // Verify contract status is updated
        $contract->refresh();
        $this->assertEquals('expired', $contract->status,
            'Expired contract status should be updated to expired');
        
        // Verify all future visits are cancelled
        foreach ($futureVisits as $visit) {
            $visit->refresh();
            $this->assertEquals('cancelled', $visit->status,
                'Future scheduled visits should be cancelled when contract expires');
            
            $this->assertStringContains('contract expiration', $visit->completion_notes,
                'Cancelled visits should have expiration note');
        }
        
        // Verify past visits are not affected
        foreach ($pastVisits as $visit) {
            $originalStatus = $visit->status;
            $visit->refresh();
            $this->assertEquals($originalStatus, $visit->status,
                'Past visits should not be affected by contract expiration');
        }
    }

    /**
     * Test edge case: Contract with no future visits
     */
    public function test_expired_contract_with_no_future_visits()
    {
        $tenant = Tenant::factory()->create();
        $branch = Branch::factory()->create(['tenant_id' => $tenant->id]);
        
        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
            'role' => 'business_owner'
        ]);
        
        $this->branchContextService
            ->method('getUserBranches')
            ->willReturn(collect([$branch]));
        
        $this->branchContextService
            ->method('canAccessBranch')
            ->willReturn(true);
        
        Auth::login($user);
        
        // Create expired contract with no future visits
        $contract = MaintenanceContract::factory()->create([
            'tenant_id' => $tenant->id,
            'branch_id' => $branch->id,
            'status' => 'active',
            'end_date' => Carbon::now()->subDays(5),
        ]);
        
        // Property: Handle expiration should work even with no future visits
        $results = $this->contractService->handleContractExpiration($contract->id);
        
        $this->assertTrue($results['status_updated']);
        $this->assertEquals(0, $results['cancelled_visits']);
        
        $contract->refresh();
        $this->assertEquals('expired', $contract->status);
    }

    /**
     * Test edge case: Active contract (not expired)
     */
    public function test_active_contract_not_expired()
    {
        $tenant = Tenant::factory()->create();
        $branch = Branch::factory()->create(['tenant_id' => $tenant->id]);
        
        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
            'role' => 'business_owner'
        ]);
        
        $this->branchContextService
            ->method('getUserBranches')
            ->willReturn(collect([$branch]));
        
        $this->branchContextService
            ->method('canAccessBranch')
            ->willReturn(true);
        
        Auth::login($user);
        
        // Create active contract (not expired)
        $contract = MaintenanceContract::factory()->create([
            'tenant_id' => $tenant->id,
            'branch_id' => $branch->id,
            'status' => 'active',
            'end_date' => Carbon::now()->addDays(30),
        ]);
        
        // Create future visits
        $futureVisit = MaintenanceVisit::factory()->create([
            'tenant_id' => $tenant->id,
            'branch_id' => $branch->id,
            'maintenance_contract_id' => $contract->id,
            'status' => 'scheduled',
            'scheduled_date' => Carbon::now()->addDays(7),
        ]);
        
        // Property: Active contracts should not be processed
        $results = $this->contractService->handleContractExpiration($contract->id);
        
        $this->assertFalse($results['status_updated']);
        $this->assertEquals(0, $results['cancelled_visits']);
        
        // Verify contract and visits remain unchanged
        $contract->refresh();
        $this->assertEquals('active', $contract->status);
        
        $futureVisit->refresh();
        $this->assertEquals('scheduled', $futureVisit->status);
    }

    /**
     * Test bulk processing of expired contracts
     */
    public function test_bulk_expired_contract_processing()
    {
        $tenant = Tenant::factory()->create();
        $branch = Branch::factory()->create(['tenant_id' => $tenant->id]);
        
        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
            'role' => 'business_owner'
        ]);
        
        $this->branchContextService
            ->method('getUserBranches')
            ->willReturn(collect([$branch]));
        
        $this->branchContextService
            ->method('canAccessBranch')
            ->willReturn(true);
        
        Auth::login($user);
        
        // Create multiple expired contracts
        $expiredContracts = collect();
        $totalFutureVisits = 0;
        
        for ($i = 0; $i < 3; $i++) {
            $contract = MaintenanceContract::factory()->create([
                'tenant_id' => $tenant->id,
                'branch_id' => $branch->id,
                'status' => 'active',
                'end_date' => Carbon::now()->subDays(rand(1, 10)),
            ]);
            $expiredContracts->push($contract);
            
            // Add future visits to each contract
            $visitCount = rand(1, 3);
            for ($j = 0; $j < $visitCount; $j++) {
                MaintenanceVisit::factory()->create([
                    'tenant_id' => $tenant->id,
                    'branch_id' => $branch->id,
                    'maintenance_contract_id' => $contract->id,
                    'status' => 'scheduled',
                    'scheduled_date' => Carbon::now()->addDays(rand(1, 20)),
                ]);
                $totalFutureVisits++;
            }
        }
        
        // Property: Bulk processing should handle all expired contracts
        $results = $this->contractService->processExpiredContracts();
        
        $this->assertEquals($expiredContracts->count(), $results['processed_contracts']);
        $this->assertEquals($totalFutureVisits, $results['total_cancelled_visits']);
        
        // Verify all contracts are updated
        foreach ($expiredContracts as $contract) {
            $contract->refresh();
            $this->assertEquals('expired', $contract->status);
        }
    }
}