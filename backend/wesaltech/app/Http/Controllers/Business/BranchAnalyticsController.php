<?php

namespace App\Http\Controllers\Business;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Services\BranchAnalyticsService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Carbon\Carbon;

class BranchAnalyticsController extends Controller
{
    protected BranchAnalyticsService $analyticsService;

    public function __construct(BranchAnalyticsService $analyticsService)
    {
        $this->analyticsService = $analyticsService;
    }

    /**
     * Get branch-specific metrics
     * GET /api/business/analytics/branch/{id}
     */
    public function branchMetrics(Request $request, int $branchId): JsonResponse
    {
        $user = auth()->user();
        $branch = Branch::where('tenant_id', $user->tenant_id)
            ->findOrFail($branchId);
        
        // Verify user has access to this branch (unless owner)
        if (!$user->hasRole('owner') && !$user->canAccessBranch($branchId)) {
            return response()->json([
                'message' => 'You do not have access to this branch'
            ], 403);
        }
        
        // Parse date range
        $startDate = $request->has('start_date') 
            ? Carbon::parse($request->get('start_date'))
            : Carbon::now()->subDays(30);
        
        $endDate = $request->has('end_date')
            ? Carbon::parse($request->get('end_date'))
            : Carbon::now();
        
        $metrics = $this->analyticsService->getBranchMetrics($branchId, $startDate, $endDate);
        
        return response()->json([
            'branch' => [
                'id' => $branch->id,
                'name' => $branch->name,
                'code' => $branch->code,
            ],
            'period' => [
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
            ],
            'metrics' => $metrics
        ]);
    }

    /**
     * Compare multiple branches
     * GET /api/business/analytics/compare
     */
    public function compareBranches(Request $request): JsonResponse
    {
        $user = auth()->user();
        
        // Only owners can compare branches
        if (!$user->hasRole('owner')) {
            return response()->json([
                'message' => 'Only business owners can compare branches'
            ], 403);
        }
        
        $validated = $request->validate([
            'branch_ids' => 'required|array|min:2',
            'branch_ids.*' => 'required|exists:branches,id',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);
        
        // Verify all branches belong to user's tenant
        $branches = Branch::whereIn('id', $validated['branch_ids'])
            ->where('tenant_id', $user->tenant_id)
            ->get();
        
        if ($branches->count() !== count($validated['branch_ids'])) {
            return response()->json([
                'message' => 'Some branches do not belong to your organization'
            ], 403);
        }
        
        // Parse date range
        $startDate = $request->has('start_date') 
            ? Carbon::parse($request->get('start_date'))
            : Carbon::now()->subDays(30);
        
        $endDate = $request->has('end_date')
            ? Carbon::parse($request->get('end_date'))
            : Carbon::now();
        
        $comparison = $this->analyticsService->compareBranches(
            $validated['branch_ids'],
            $startDate,
            $endDate
        );
        
        return response()->json([
            'branches' => $branches->map(function ($branch) {
                return [
                    'id' => $branch->id,
                    'name' => $branch->name,
                    'code' => $branch->code,
                ];
            }),
            'period' => [
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
            ],
            'comparison' => $comparison
        ]);
    }

    /**
     * Get consolidated metrics (owner only)
     * GET /api/business/analytics/consolidated
     */
    public function consolidatedMetrics(Request $request): JsonResponse
    {
        $user = auth()->user();
        
        // Only owners can view consolidated metrics
        if (!$user->hasRole('owner')) {
            return response()->json([
                'message' => 'Only business owners can view consolidated metrics'
            ], 403);
        }
        
        // Parse date range
        $startDate = $request->has('start_date') 
            ? Carbon::parse($request->get('start_date'))
            : Carbon::now()->subDays(30);
        
        $endDate = $request->has('end_date')
            ? Carbon::parse($request->get('end_date'))
            : Carbon::now();
        
        $metrics = $this->analyticsService->getConsolidatedMetrics(
            $user->tenant_id,
            $startDate,
            $endDate
        );
        
        return response()->json([
            'period' => [
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
            ],
            'metrics' => $metrics
        ]);
    }
}
