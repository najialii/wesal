<?php

namespace App\Http\Middleware;

use App\Services\BranchContextService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureBranchAccess
{
    protected BranchContextService $branchContext;

    public function __construct(BranchContextService $branchContext)
    {
        $this->branchContext = $branchContext;
    }

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        // Super admins bypass branch checks
        if ($user->isSuperAdmin()) {
            return $next($request);
        }

        // If branch_id is provided in request, validate access
        if ($request->has('branch_id')) {
            $branchId = $request->input('branch_id');
            
            if (!$this->branchContext->canAccessBranch($user, $branchId)) {
                return response()->json([
                    'error' => 'BRANCH_ACCESS_DENIED',
                    'message' => 'You do not have access to this branch'
                ], 403);
            }

            // Set as active branch for this request
            $this->branchContext->setCurrentBranch($user, $branchId);
        }

        // Ensure user has an active branch set
        $currentBranch = $this->branchContext->getCurrentBranch($user);
        
        if (!$currentBranch && !$user->isTenantAdmin()) {
            return response()->json([
                'error' => 'NO_BRANCH_ASSIGNED',
                'message' => 'You are not assigned to any branch'
            ], 403);
        }

        // Add branch context to request
        $request->merge(['active_branch_id' => $currentBranch?->id]);

        return $next($request);
    }
}
