<?php

namespace App\Http\Controllers\Business;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Services\BranchContextService;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class BranchController extends Controller
{
    protected BranchContextService $branchContext;
    protected AuditService $auditService;

    public function __construct(BranchContextService $branchContext, AuditService $auditService)
    {
        $this->branchContext = $branchContext;
        $this->auditService = $auditService;
    }

    /**
     * List all branches (owner) or assigned branches (staff)
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->isTenantAdmin()) {
            // Business owners see all active branches (excluding soft-deleted ones)
            $branches = Branch::where('tenant_id', $user->tenant_id)
                            ->with(['users' => function($query) {
                                $query->select('users.id', 'users.name', 'users.email');
                            }])
                            ->withCount('users', 'products', 'sales')
                            ->get();
        } else {
            // Staff see only their assigned active branches
            $branches = $user->branches()
                            ->with(['users' => function($query) {
                                $query->select('users.id', 'users.name', 'users.email');
                            }])
                            ->withCount('users', 'products', 'sales')
                            ->get();
        }

        return response()->json([
            'branches' => $branches,
            'total' => $branches->count(),
        ]);
    }

    /**
     * Create a new branch (owner only)
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->isTenantAdmin()) {
            return response()->json([
                'error' => 'UNAUTHORIZED',
                'message' => 'Only business owners can create branches'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:branches,code,NULL,id,tenant_id,' . $user->tenant_id,
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'VALIDATION_ERROR',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $branch = Branch::create([
            'tenant_id' => $user->tenant_id,
            'name' => $request->name,
            'code' => $request->code,
            'address' => $request->address,
            'city' => $request->city,
            'phone' => $request->phone,
            'email' => $request->email,
            'is_default' => false,
            'is_active' => true,
        ]);

        // Log audit event
        $this->auditService->logBranchCreated($branch->id, $branch->toArray());

        // Clear tenant branch cache
        $this->branchContext->clearTenantBranchCache($user->tenant_id);

        return response()->json([
            'message' => 'Branch created successfully',
            'branch' => $branch
        ], 201);
    }

    /**
     * Get branch details
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        if (!$this->branchContext->canAccessBranch($user, $id)) {
            return response()->json([
                'error' => 'BRANCH_ACCESS_DENIED',
                'message' => 'You do not have access to this branch'
            ], 403);
        }

        $branch = Branch::with(['users', 'products'])
                       ->withCount('users', 'products', 'sales')
                       ->findOrFail($id);

        return response()->json(['branch' => $branch]);
    }

    /**
     * Update branch (owner only)
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        if (!$user->isTenantAdmin()) {
            return response()->json([
                'error' => 'UNAUTHORIZED',
                'message' => 'Only business owners can update branches'
            ], 403);
        }

        $branch = Branch::where('tenant_id', $user->tenant_id)->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'code' => 'sometimes|required|string|max:50|unique:branches,code,' . $id . ',id,tenant_id,' . $user->tenant_id,
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'VALIDATION_ERROR',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $oldData = $branch->toArray();
        
        $branch->update($request->only([
            'name', 'code', 'address', 'city', 'phone', 'email'
        ]));

        // Log audit event
        $this->auditService->logBranchUpdated($branch->id, $oldData, $branch->fresh()->toArray());

        // Clear tenant branch cache
        $this->branchContext->clearTenantBranchCache($user->tenant_id);

        return response()->json([
            'message' => 'Branch updated successfully',
            'branch' => $branch
        ]);
    }

    /**
     * Deactivate branch (owner only)
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        if (!$user->isTenantAdmin()) {
            return response()->json([
                'error' => 'UNAUTHORIZED',
                'message' => 'Only business owners can deactivate branches'
            ], 403);
        }

        $branch = Branch::where('tenant_id', $user->tenant_id)->findOrFail($id);

        if ($branch->is_default) {
            return response()->json([
                'error' => 'CANNOT_DEACTIVATE_DEFAULT',
                'message' => 'Cannot deactivate the default branch'
            ], 400);
        }

        $branch->update(['is_active' => false]);

        // Log audit event
        $this->auditService->logBranchDeactivated($branch->id, $branch->name);

        // Clear tenant branch cache
        $this->branchContext->clearTenantBranchCache($user->tenant_id);

        return response()->json([
            'message' => 'Branch deactivated successfully'
        ]);
    }

    /**
     * Reactivate branch (owner only)
     */
    public function activate(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        if (!$user->isTenantAdmin()) {
            return response()->json([
                'error' => 'UNAUTHORIZED',
                'message' => 'Only business owners can activate branches'
            ], 403);
        }

        $branch = Branch::where('tenant_id', $user->tenant_id)->findOrFail($id);
        $branch->update(['is_active' => true]);

        // Log audit event
        $this->auditService->logBranchActivated($branch->id, $branch->name);

        // Clear tenant branch cache
        $this->branchContext->clearTenantBranchCache($user->tenant_id);

        return response()->json([
            'message' => 'Branch activated successfully',
            'branch' => $branch->fresh()
        ]);
    }

    /**
     * Get current active branch
     */
    public function current(Request $request): JsonResponse
    {
        $user = $request->user();
        $currentBranch = $this->branchContext->getCurrentBranch($user);

        if (!$currentBranch) {
            return response()->json([
                'error' => 'NO_ACTIVE_BRANCH',
                'message' => 'No active branch set'
            ], 404);
        }

        return response()->json(['branch' => $currentBranch]);
    }

    /**
     * Switch active branch
     */
    public function switchBranch(Request $request): JsonResponse
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'branch_id' => 'required|integer|exists:branches,id'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'VALIDATION_ERROR',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $branchId = $request->branch_id;

        if (!$this->branchContext->canAccessBranch($user, $branchId)) {
            return response()->json([
                'error' => 'BRANCH_ACCESS_DENIED',
                'message' => 'You do not have access to this branch'
            ], 403);
        }

        $this->branchContext->setCurrentBranch($user, $branchId);
        $branch = Branch::find($branchId);

        return response()->json([
            'message' => 'Branch switched successfully',
            'branch' => $branch
        ]);
    }

    /**
     * Get user's assigned branches
     */
    public function myBranches(Request $request): JsonResponse
    {
        $user = $request->user();
        
        \Log::info('MyBranches endpoint called', [
            'user_id' => $user->id,
            'tenant_id' => $user->tenant_id,
            'is_tenant_admin' => $user->isTenantAdmin(),
            'roles' => $user->getRoleNames(),
        ]);
        
        // Clear cache to ensure fresh data
        $this->branchContext->clearBranchContext($user);
        
        // Get branches using the service (handles business owner vs staff logic)
        $branches = $this->branchContext->getUserBranches($user);
        
        \Log::info('Branches retrieved', [
            'count' => $branches->count(),
            'branches' => $branches->pluck('id', 'name')->toArray(),
        ]);

        // EMERGENCY FIX: If no branches exist, create one immediately
        if ($branches->isEmpty() && $user->isTenantAdmin()) {
            \Log::info('Creating emergency branch for tenant admin');
            
            $emergencyBranch = Branch::create([
                'tenant_id' => $user->tenant_id,
                'name' => 'Main Branch',
                'code' => 'MAIN-' . $user->tenant_id,
                'address' => 'Main Office',
                'city' => 'City',
                'phone' => '',
                'email' => $user->email,
                'is_default' => true,
                'is_active' => true,
            ]);
            
            $branches = collect([$emergencyBranch]);
            \Log::info('Emergency branch created', ['branch_id' => $emergencyBranch->id]);
        }

        return response()->json([
            'branches' => $branches,
            'total' => $branches->count(),
            'debug' => [
                'user_id' => $user->id,
                'tenant_id' => $user->tenant_id,
                'is_tenant_admin' => $user->isTenantAdmin(),
                'roles' => $user->getRoleNames(),
                'branches_count' => $branches->count(),
            ]
        ]);
    }

    /**
     * Get summary of all branches (entity counts, metrics)
     */
    public function summary(Request $request): JsonResponse
    {
        $user = $request->user();

        // Get branches based on user role
        if ($user->isTenantAdmin()) {
            // Business owners see all branches
            $branches = Branch::where('tenant_id', $user->tenant_id)
                ->withCount([
                    'products as product_count',
                    'sales as sales_count',
                    'maintenanceContracts as contracts_count' => function ($query) {
                        $query->where('status', 'active');
                    },
                ])
                ->get();
        } else {
            // Staff see only their assigned branches
            $branches = $user->branches()
                ->withCount([
                    'products as product_count',
                    'sales as sales_count',
                    'maintenanceContracts as contracts_count' => function ($query) {
                        $query->where('status', 'active');
                    },
                ])
                ->get();
        }

        $summaries = $branches->map(function ($branch) {
            // Calculate low stock count
            $lowStockCount = \DB::table('branch_product')
                ->where('branch_id', $branch->id)
                ->whereRaw('stock_quantity <= min_stock_level')
                ->count();

            // Calculate total revenue for this branch
            $totalRevenue = \DB::table('sales')
                ->where('branch_id', $branch->id)
                ->sum('total_amount');

            return [
                'id' => $branch->id,
                'name' => $branch->name,
                'code' => $branch->code,
                'is_active' => $branch->is_active,
                'is_default' => $branch->is_default,
                'product_count' => $branch->product_count,
                'sales_count' => $branch->sales_count,
                'contracts_count' => $branch->contracts_count,
                'low_stock_count' => $lowStockCount,
                'total_revenue' => (float) $totalRevenue,
                'has_low_stock_warning' => $lowStockCount > 0,
            ];
        });

        return response()->json([
            'summaries' => $summaries,
            'total_branches' => $summaries->count(),
            'totals' => [
                'products' => $summaries->sum('product_count'),
                'sales' => $summaries->sum('sales_count'),
                'contracts' => $summaries->sum('contracts_count'),
                'revenue' => $summaries->sum('total_revenue'),
                'low_stock_items' => $summaries->sum('low_stock_count'),
            ]
        ]);
    }

    /**
     * Get detailed summary for a specific branch
     */
    public function branchSummary(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        if (!$this->branchContext->canAccessBranch($user, $id)) {
            return response()->json([
                'error' => 'BRANCH_ACCESS_DENIED',
                'message' => 'You do not have access to this branch'
            ], 403);
        }

        $branch = Branch::where('tenant_id', $user->tenant_id)->findOrFail($id);

        // Product counts
        $productCount = \DB::table('branch_product')
            ->where('branch_id', $id)
            ->where('is_active', true)
            ->count();

        $lowStockCount = \DB::table('branch_product')
            ->where('branch_id', $id)
            ->where('is_active', true)
            ->whereRaw('stock_quantity <= min_stock_level')
            ->count();

        $totalStock = \DB::table('branch_product')
            ->where('branch_id', $id)
            ->sum('stock_quantity');

        // Sales metrics
        $salesCount = \DB::table('sales')
            ->where('branch_id', $id)
            ->count();

        $totalRevenue = \DB::table('sales')
            ->where('branch_id', $id)
            ->sum('total_amount');

        $todaySales = \DB::table('sales')
            ->where('branch_id', $id)
            ->whereDate('created_at', today())
            ->count();

        $todayRevenue = \DB::table('sales')
            ->where('branch_id', $id)
            ->whereDate('created_at', today())
            ->sum('total_amount');

        // Maintenance metrics
        $activeContracts = \DB::table('maintenance_contracts')
            ->where('branch_id', $id)
            ->where('status', 'active')
            ->count();

        $pendingVisits = \DB::table('maintenance_visits')
            ->where('branch_id', $id)
            ->where('status', 'scheduled')
            ->count();

        // Staff count
        $staffCount = \DB::table('branch_user')
            ->where('branch_id', $id)
            ->count();

        return response()->json([
            'branch' => [
                'id' => $branch->id,
                'name' => $branch->name,
                'code' => $branch->code,
                'is_active' => $branch->is_active,
                'is_default' => $branch->is_default,
            ],
            'products' => [
                'total' => $productCount,
                'low_stock' => $lowStockCount,
                'total_stock_units' => (int) $totalStock,
            ],
            'sales' => [
                'total_count' => $salesCount,
                'total_revenue' => (float) $totalRevenue,
                'today_count' => $todaySales,
                'today_revenue' => (float) $todayRevenue,
            ],
            'maintenance' => [
                'active_contracts' => $activeContracts,
                'pending_visits' => $pendingVisits,
            ],
            'staff' => [
                'count' => $staffCount,
            ],
            'warnings' => [
                'has_low_stock' => $lowStockCount > 0,
                'low_stock_count' => $lowStockCount,
            ],
        ]);
    }
}
