<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class AuditService
{
    /**
     * Log an audit event
     */
    public function log(
        string $action,
        string $entityType,
        ?int $entityId = null,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?string $description = null
    ): void {
        $user = Auth::user();

        AuditLog::create([
            'user_id' => $user?->id,
            'user_email' => $user?->email,
            'user_name' => $user?->name,
            'is_super_admin' => $user?->is_super_admin ?? false,
            'tenant_id' => $user?->tenant_id,
            'action' => $action,
            'resource_type' => $entityType,
            'resource_id' => $entityId ? (string) $entityId : null,
            'method' => Request::method() ?? 'POST',
            'url' => Request::fullUrl(),
            'ip_address' => Request::ip(),
            'user_agent' => Request::userAgent(),
            'response_status' => 200, // Default success status
            'request_data' => array_merge(
                $oldValues ? ['old_values' => $oldValues] : [],
                $newValues ? ['new_values' => $newValues] : [],
                $description ? ['description' => $description] : []
            ),
            'performed_at' => now(),
        ]);
    }

    /**
     * Log branch creation
     */
    public function logBranchCreated(int $branchId, array $data): void
    {
        $this->log(
            action: 'branch.created',
            entityType: 'Branch',
            entityId: $branchId,
            newValues: $data,
            description: "Branch '{$data['name']}' created"
        );
    }

    /**
     * Log branch update
     */
    public function logBranchUpdated(int $branchId, array $oldData, array $newData): void
    {
        $this->log(
            action: 'branch.updated',
            entityType: 'Branch',
            entityId: $branchId,
            oldValues: $oldData,
            newValues: $newData,
            description: "Branch updated"
        );
    }

    /**
     * Log branch deactivation
     */
    public function logBranchDeactivated(int $branchId, string $branchName): void
    {
        $this->log(
            action: 'branch.deactivated',
            entityType: 'Branch',
            entityId: $branchId,
            description: "Branch '{$branchName}' deactivated"
        );
    }

    /**
     * Log branch activation
     */
    public function logBranchActivated(int $branchId, string $branchName): void
    {
        $this->log(
            action: 'branch.activated',
            entityType: 'Branch',
            entityId: $branchId,
            description: "Branch '{$branchName}' activated"
        );
    }

    /**
     * Log staff branch assignment
     */
    public function logStaffBranchAssigned(int $userId, int $branchId, bool $isManager = false): void
    {
        $this->log(
            action: 'staff.branch_assigned',
            entityType: 'User',
            entityId: $userId,
            newValues: ['branch_id' => $branchId, 'is_manager' => $isManager],
            description: "Staff assigned to branch" . ($isManager ? ' as manager' : '')
        );
    }

    /**
     * Log staff branch removal
     */
    public function logStaffBranchRemoved(int $userId, int $branchId): void
    {
        $this->log(
            action: 'staff.branch_removed',
            entityType: 'User',
            entityId: $userId,
            oldValues: ['branch_id' => $branchId],
            description: "Staff removed from branch"
        );
    }

    /**
     * Log stock transfer initiated
     */
    public function logStockTransferInitiated(int $transferId, array $data): void
    {
        $this->log(
            action: 'stock_transfer.initiated',
            entityType: 'StockTransfer',
            entityId: $transferId,
            newValues: $data,
            description: "Stock transfer initiated from branch {$data['from_branch_id']} to {$data['to_branch_id']}"
        );
    }

    /**
     * Log stock transfer completed
     */
    public function logStockTransferCompleted(int $transferId): void
    {
        $this->log(
            action: 'stock_transfer.completed',
            entityType: 'StockTransfer',
            entityId: $transferId,
            description: "Stock transfer completed"
        );
    }

    /**
     * Log stock transfer cancelled
     */
    public function logStockTransferCancelled(int $transferId, ?string $reason = null): void
    {
        $this->log(
            action: 'stock_transfer.cancelled',
            entityType: 'StockTransfer',
            entityId: $transferId,
            description: "Stock transfer cancelled" . ($reason ? ": {$reason}" : '')
        );
    }

    /**
     * Log branch switching
     */
    public function logBranchSwitch(int $fromBranchId, int $toBranchId): void
    {
        $this->log(
            action: 'branch.switched',
            entityType: 'Branch',
            entityId: $toBranchId,
            oldValues: ['branch_id' => $fromBranchId],
            newValues: ['branch_id' => $toBranchId],
            description: "User switched from branch {$fromBranchId} to {$toBranchId}"
        );
    }

    /**
     * Log unauthorized branch access attempt
     */
    public function logUnauthorizedBranchAccess(int $branchId): void
    {
        $this->log(
            action: 'branch.access_denied',
            entityType: 'Branch',
            entityId: $branchId,
            description: "Unauthorized access attempt to branch {$branchId}"
        );
    }
}
