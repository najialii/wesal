<?php

namespace Tests\Unit\Maintenance;

use Tests\TestCase;
use App\Services\Maintenance\VisitExecutionService;
use App\Services\BranchContextService;
use App\Models\MaintenanceVisit;
use App\Models\MaintenanceContract;
use App\Models\User;
use App\Models\Branch;
use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;

/**
 * Feature: maintenance-workflow-refinement, Property 4: Technician Assignment Validation
 */
class TechnicianAssignmentPropertyTest extends TestCase
{
    use RefreshDatabase;

    private VisitExecutionService $visitExecutionService;
    private BranchContextService $branchContextService;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create mock BranchContextService
        $this->branchContextService = $this->createMock(BranchContextService::class);
        $this->visitExecutionService = new VisitExecutionService($this->branchContextService);
    }

    /**
     * Property Test: Technician Assignment Validation
     * 
     * For any visit assignment, the assigned technician should have access 
     * to the branch where the visit is scheduled.
     * 
     * **Validates: Requirements 3.1**
     */
    public function test_technician_assignment_validation_property()
    {
        // Run property test with multiple iterations
        for ($i = 0; $i < 50; $i++) {
            $this->runTechnicianAssignmentValidationProperty();
        }
    }

    private function runTechnicianAssignmentValidationProperty()
    {
        // Create test tenant
        $tenant = Tenant::factory()->create();
        
        // Create multiple branches for the tenant
        $branches = Branch::factory()->count(3)->create(['tenant_id' => $tenant->id]);
        $targetBranch = $branches->first();
        $otherBranch = $branches->last();
        
        // Create technician with access to specific branch
        $technician = User::factory()->create([
            'tenant_id' => $tenant->id,
            'role' => 'technician'
        ]);
        
        // Assign technician to target branch
        $technician->branches()->attach($targetBranch->id);
        
        // Create contract in the target branch
        $contract = MaintenanceContract::factory()->create([
            'tenant_id' => $tenant->id,
            'branch_id' => $targetBranch->id,
            'assigned_technician_id' => $technician->id,
        ]);
        
        // Create visit in the same branch as contract
        $visit = MaintenanceVisit::factory()->create([
            'tenant_id' => $tenant->id,
            'branch_id' => $targetBranch->id,
            'maintenance_contract_id' => $contract->id,
            'assigned_technician_id' => $technician->id,
            'status' => 'scheduled',
        ]);
        
        // Mock branch context service to return technician's branches
        $this->branchContextService
            ->method('getUserBranches')
            ->with($technician)
            ->willReturn(collect([$targetBranch]));
        
        $this->branchContextService
            ->method('canAccessBranch')
            ->willReturnCallback(function($user, $branchId) use ($technician, $targetBranch) {
                return $user->id === $technician->id && $branchId === $targetBranch->id;
            });
        
        // Authenticate as the technician
        Auth::login($technician);
        
        // Property: Technician should be able to access visits in their assigned branch
        $technicianVisits = $this->visitExecutionService->getTechnicianVisits($technician->id);
        
        // Verify the property holds
        $this->assertGreaterThan(0, $technicianVisits->count(), 
            'Technician should have access to visits in their assigned branch');
        
        $this->assertTrue($technicianVisits->contains('id', $visit->id),
            'Technician should be able to access the visit in their branch');
        
        // Property: Technician should NOT be able to access visits in branches they don't have access to
        $visitInOtherBranch = MaintenanceVisit::factory()->create([
            'tenant_id' => $tenant->id,
            'branch_id' => $otherBranch->id,
            'maintenance_contract_id' => MaintenanceContract::factory()->create([
                'tenant_id' => $tenant->id,
                'branch_id' => $otherBranch->id,
            ])->id,
            'status' => 'scheduled',
        ]);
        
        $allTechnicianVisits = $this->visitExecutionService->getTechnicianVisits($technician->id);
        
        $this->assertFalse($allTechnicianVisits->contains('id', $visitInOtherBranch->id),
            'Technician should NOT be able to access visits in branches they are not assigned to');
        
        // Property: Visit assignment should respect branch boundaries
        $this->assertEquals($targetBranch->id, $visit->branch_id,
            'Visit should be in the same branch as the assigned technician has access to');
        
        $this->assertTrue($technician->branches->contains('id', $visit->branch_id),
            'Assigned technician should have access to the branch where the visit is scheduled');
    }

    /**
     * Test edge case: Technician with no branch assignments
     */
    public function test_technician_with_no_branch_access()
    {
        $tenant = Tenant::factory()->create();
        $branch = Branch::factory()->create(['tenant_id' => $tenant->id]);
        
        // Create technician with NO branch assignments
        $technician = User::factory()->create([
            'tenant_id' => $tenant->id,
            'role' => 'technician'
        ]);
        
        // Mock branch context service to return empty collection
        $this->branchContextService
            ->method('getUserBranches')
            ->with($technician)
            ->willReturn(collect([]));
        
        $this->branchContextService
            ->method('canAccessBranch')
            ->willReturn(false);
        
        Auth::login($technician);
        
        // Property: Technician with no branch access should see no visits
        $visits = $this->visitExecutionService->getTechnicianVisits($technician->id);
        
        $this->assertEquals(0, $visits->count(),
            'Technician with no branch assignments should not see any visits');
    }

    /**
     * Test edge case: Super admin technician
     */
    public function test_super_admin_technician_access()
    {
        $tenant = Tenant::factory()->create();
        $branches = Branch::factory()->count(2)->create(['tenant_id' => $tenant->id]);
        
        // Create super admin technician
        $superAdmin = User::factory()->create([
            'tenant_id' => $tenant->id,
            'role' => 'super_admin'
        ]);
        
        // Create visits in different branches
        $visits = collect();
        foreach ($branches as $branch) {
            $contract = MaintenanceContract::factory()->create([
                'tenant_id' => $tenant->id,
                'branch_id' => $branch->id,
            ]);
            
            $visits->push(MaintenanceVisit::factory()->create([
                'tenant_id' => $tenant->id,
                'branch_id' => $branch->id,
                'maintenance_contract_id' => $contract->id,
                'assigned_technician_id' => $superAdmin->id,
                'status' => 'scheduled',
            ]));
        }
        
        // Mock super admin to have access to all branches
        $this->branchContextService
            ->method('getUserBranches')
            ->with($superAdmin)
            ->willReturn($branches);
        
        $this->branchContextService
            ->method('canAccessBranch')
            ->willReturn(true);
        
        Auth::login($superAdmin);
        
        // Property: Super admin should have access to visits in all branches
        $adminVisits = $this->visitExecutionService->getTechnicianVisits($superAdmin->id);
        
        $this->assertEquals($visits->count(), $adminVisits->count(),
            'Super admin should have access to visits in all branches');
    }
}