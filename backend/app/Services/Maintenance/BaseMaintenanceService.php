<?php

namespace App\Services\Maintenance;

use App\Services\BranchContextService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;

abstract class BaseMaintenanceService
{
    protected BranchContextService $branchContext;

    public function __construct(BranchContextService $branchContext)
    {
        $this->branchContext = $branchContext;
    }

    /**
     * Apply tenant isolation to a query
     */
    protected function applyTenantIsolation(Builder $query): Builder
    {
        $tenantId = $this->getCurrentTenantId();
        
        if ($tenantId) {
            $query->where('tenant_id', $tenantId);
        }
        
        return $query;
    }

    /**
     * Apply branch context to a query
     */
    protected function applyBranchContext(Builder $query): Builder
    {
        $user = Auth::user();
        
        if (!$user) {
            return $query;
        }

        // Super admins can see all data
        if ($user->isSuperAdmin()) {
            return $query;
        }

        // Business owners can see all branches in their tenant
        if ($user->isTenantAdmin()) {
            return $query;
        }

        // Regular users only see data from their assigned branches
        $userBranches = $this->branchContext->getUserBranches($user);
        $branchIds = $userBranches->pluck('id')->toArray();
        
        if (!empty($branchIds)) {
            $query->whereIn('branch_id', $branchIds);
        } else {
            // If user has no branches, return empty result
            $query->whereRaw('1 = 0');
        }
        
        return $query;
    }

    /**
     * Get current tenant ID
     */
    protected function getCurrentTenantId(): ?int
    {
        $user = Auth::user();
        return $user?->tenant_id;
    }

    /**
     * Validate branch access for current user
     */
    protected function validateBranchAccess(int $branchId): bool
    {
        $user = Auth::user();
        
        if (!$user) {
            return false;
        }
        
        // Log security event for branch access attempts
        if (!$this->branchContext->canAccessBranch($user, $branchId)) {
            $this->logSecurityEvent('branch_access_denied', $user->id, [
                'attempted_branch_id' => $branchId,
                'user_tenant_id' => $user->tenant_id,
                'user_role' => $user->role
            ]);
            return false;
        }
        
        return true;
    }

    /**
     * Validate tenant isolation
     */
    protected function validateTenantIsolation(int $resourceTenantId): bool
    {
        $currentTenantId = $this->getCurrentTenantId();
        
        if (!$currentTenantId) {
            return false;
        }
        
        if ($resourceTenantId !== $currentTenantId) {
            $user = Auth::user();
            $this->logSecurityEvent('tenant_isolation_violation', $user?->id ?? 0, [
                'resource_tenant_id' => $resourceTenantId,
                'user_tenant_id' => $currentTenantId
            ]);
            return false;
        }
        
        return true;
    }

    /**
     * Validate user permissions for maintenance operations
     */
    protected function validateMaintenancePermissions(string $operation): bool
    {
        $user = Auth::user();
        
        if (!$user) {
            return false;
        }
        
        // Super admins and tenant admins have all permissions
        if ($user->isSuperAdmin() || $user->isTenantAdmin()) {
            return true;
        }
        
        // Define permission matrix
        $permissions = [
            'create_contract' => ['business_owner', 'manager', 'salesman', 'tenant_admin'],
            'update_contract' => ['business_owner', 'manager', 'salesman', 'tenant_admin'],
            'delete_contract' => ['business_owner', 'manager', 'tenant_admin'],
            'create_visit' => ['business_owner', 'manager', 'technician', 'tenant_admin'],
            'update_visit' => ['business_owner', 'manager', 'technician', 'tenant_admin'],
            'complete_visit' => ['technician', 'manager', 'tenant_admin'],
            'view_analytics' => ['business_owner', 'manager', 'tenant_admin'],
            'manage_technicians' => ['business_owner', 'manager', 'tenant_admin'],
        ];
        
        $allowedRoles = $permissions[$operation] ?? [];
        
        // Check if user has any of the allowed roles
        $hasPermission = false;
        foreach ($allowedRoles as $role) {
            if ($user->hasRole($role)) {
                $hasPermission = true;
                break;
            }
        }
        
        if (!$hasPermission) {
            $userRoles = $user->roles->pluck('name')->toArray();
            $this->logSecurityEvent('permission_denied', $user->id, [
                'operation' => $operation,
                'user_roles' => $userRoles,
                'allowed_roles' => $allowedRoles
            ]);
            return false;
        }
        
        return true;
    }

    /**
     * Log security events
     */
    protected function logSecurityEvent(string $event, int $userId, array $metadata = []): void
    {
        // This would integrate with the MaintenanceLoggerService
        // For now, we'll use Laravel's built-in logging
        \Log::warning('Maintenance Security Event', [
            'event' => $event,
            'user_id' => $userId,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'timestamp' => now()->toISOString(),
            'metadata' => $metadata
        ]);
    }

    /**
     * Get current branch for the user
     */
    protected function getCurrentBranch()
    {
        $user = Auth::user();
        
        if (!$user) {
            return null;
        }
        
        return $this->branchContext->getCurrentBranch($user);
    }
}