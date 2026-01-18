<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class BranchContextService
{
    /**
     * Set the current active branch for a user
     */
    public function setCurrentBranch(User $user, int $branchId): void
    {
        // Verify user has access to this branch
        if (!$this->canAccessBranch($user, $branchId)) {
            throw new \Exception('User does not have access to this branch');
        }

        // Store in session
        session(['active_branch_id' => $branchId]);

        // Cache the branch for quick access
        Cache::put("user_{$user->id}_active_branch", $branchId, now()->addHours(24));
    }

    /**
     * Get the current active branch for a user
     */
    public function getCurrentBranch(User $user): ?Branch
    {
        $branchId = $this->getCurrentBranchId($user);

        if (!$branchId) {
            return null;
        }

        return Branch::find($branchId);
    }

    /**
     * Get the current active branch ID for a user
     */
    public function getCurrentBranchId(User $user): ?int
    {
        // Check cache first
        $cachedBranchId = Cache::get("user_{$user->id}_active_branch");
        if ($cachedBranchId) {
            return $cachedBranchId;
        }

        // Check session
        if (session()->has('active_branch_id')) {
            return session('active_branch_id');
        }

        // Get user's default branch (first assigned branch)
        $branch = $user->branches()->first();
        if ($branch) {
            $this->setCurrentBranch($user, $branch->id);
            return $branch->id;
        }

        return null;
    }

    /**
     * Get all branches assigned to a user
     */
    public function getUserBranches(User $user): Collection
    {
        \Log::info('Getting user branches', [
            'user_id' => $user->id,
            'tenant_id' => $user->tenant_id,
            'is_tenant_admin' => $user->isTenantAdmin(),
            'roles' => $user->getRoleNames(),
        ]);
        
        // Business owners have access to all branches (including inactive and soft-deleted ones)
        if ($user->isTenantAdmin()) {
            $branches = Branch::where('tenant_id', $user->tenant_id)
                        ->withTrashed()  // Include soft-deleted branches
                        ->orderBy('is_default', 'desc')
                        ->orderBy('name', 'asc')
                        ->get();
            \Log::info('Tenant admin branches', ['count' => $branches->count(), 'branches' => $branches->pluck('name')->toArray()]);
            return $branches;
        }

        // Regular users only see their assigned active branches
        $branches = $user->branches()->active()->get();
        \Log::info('Regular user branches', ['count' => $branches->count()]);
        return $branches;
    }

    /**
     * Check if user can access a specific branch
     */
    public function canAccessBranch(User $user, int $branchId): bool
    {
        // Super admins can access any branch
        if ($user->isSuperAdmin()) {
            return true;
        }

        $branch = Branch::find($branchId);
        if (!$branch) {
            return false;
        }

        // Check tenant match
        if ($branch->tenant_id !== $user->tenant_id) {
            return false;
        }

        // Business owners can access all branches in their tenant
        if ($user->isTenantAdmin()) {
            return true;
        }

        // Check if user is assigned to this branch
        return $user->branches()->where('branches.id', $branchId)->exists();
    }

    /**
     * Switch user's active branch
     */
    public function switchBranch(User $user, int $branchId): bool
    {
        if (!$this->canAccessBranch($user, $branchId)) {
            return false;
        }

        $this->setCurrentBranch($user, $branchId);
        return true;
    }

    /**
     * Clear branch context for a user
     */
    public function clearBranchContext(User $user): void
    {
        session()->forget('active_branch_id');
        Cache::forget("user_{$user->id}_active_branch");
        Cache::forget("user_{$user->id}_branches");
    }

    /**
     * Clear branch cache for a tenant (when branches are modified)
     */
    public function clearTenantBranchCache(int $tenantId): void
    {
        // Clear branch list cache for tenant
        Cache::forget("tenant_{$tenantId}_branches");
        
        // Clear all user branch caches for this tenant
        // Note: In production, consider using cache tags for better management
    }

    /**
     * Get all branches for a tenant (cached)
     */
    public function getTenantBranches(int $tenantId): Collection
    {
        return Cache::remember(
            "tenant_{$tenantId}_branches",
            now()->addMinutes(30),
            function () use ($tenantId) {
                return Branch::where('tenant_id', $tenantId)
                            ->active()
                            ->get();
            }
        );
    }

    /**
     * Check if user is a manager of a specific branch
     */
    public function isManagerOf(User $user, int $branchId): bool
    {
        return $user->branches()
                    ->where('branches.id', $branchId)
                    ->wherePivot('is_manager', true)
                    ->exists();
    }
}
