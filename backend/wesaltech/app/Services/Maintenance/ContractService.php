<?php

namespace App\Services\Maintenance;

use App\Models\MaintenanceContract;
use App\Models\MaintenanceContractItem;
use App\Models\MaintenanceVisit;
use App\Models\Customer;
use App\Models\Branch;
use App\Exceptions\MaintenanceException;
use App\Services\MaintenanceLoggerService;
use App\Services\BranchContextService;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ContractService extends BaseMaintenanceService
{
    public function __construct(
        BranchContextService $branchContext,
        private MaintenanceLoggerService $logger
    ) {
        parent::__construct($branchContext);
    }

    /**
     * Create a new maintenance contract
     */
    public function createContract(array $data): MaintenanceContract
    {
        // Validate permissions
        if (!$this->validateMaintenancePermissions('create_contract')) {
            throw MaintenanceException::branchAccessDenied(0);
        }

        DB::beginTransaction();
        
        try {
            // Validate branch access
            if (isset($data['branch_id']) && !$this->validateBranchAccess($data['branch_id'])) {
                throw MaintenanceException::branchAccessDenied($data['branch_id']);
            }

            // Set tenant ID for isolation
            $data['tenant_id'] = $this->getCurrentTenantId();
            
            // Get customer details
            $customer = Customer::find($data['customer_id']);
            if (!$customer) {
                throw MaintenanceException::contractValidationFailed(['Customer not found']);
            }
            
            // Determine branch_id
            $branchId = $this->determineBranchId($data);
            
            // Calculate total visits based on frequency and duration
            if (isset($data['frequency']) && isset($data['start_date']) && isset($data['end_date'])) {
                $data['total_visits'] = $this->calculateTotalVisits(
                    $data['frequency'],
                    Carbon::parse($data['start_date']),
                    Carbon::parse($data['end_date'])
                );
            }

            $contract = MaintenanceContract::create([
                'tenant_id' => $data['tenant_id'],
                'branch_id' => $branchId,
                'product_id' => $data['product_id'],
                'customer_id' => $data['customer_id'],
                'customer_name' => $customer->name,
                'customer_phone' => $customer->phone,
                'customer_email' => $customer->email,
                'customer_address' => $customer->address,
                'assigned_technician_id' => $data['assigned_technician_id'] ?? null,
                'frequency' => $data['frequency'],
                'frequency_value' => $data['frequency_value'] ?? null,
                'frequency_unit' => $data['frequency_unit'] ?? null,
                'start_date' => $data['start_date'],
                'end_date' => $data['end_date'] ?? null,
                'contract_value' => $data['contract_value'] ?? null,
                'special_instructions' => $data['special_instructions'] ?? null,
                'status' => $data['status'] ?? 'active',
                'total_visits' => $data['total_visits'] ?? null,
            ]);

            // Save maintenance products as separate items
            if (isset($data['maintenance_products']) && is_array($data['maintenance_products'])) {
                foreach ($data['maintenance_products'] as $productData) {
                    if (isset($productData['id']) && $productData['id'] > 0) {
                        MaintenanceContractItem::create([
                            'tenant_id' => $data['tenant_id'],
                            'maintenance_contract_id' => $contract->id,
                            'maintenance_product_id' => $productData['id'],
                            'quantity' => $productData['quantity'] ?? 1,
                            'unit_cost' => $productData['unit_cost'] ?? 0,
                            'is_included' => true,
                        ]);
                    }
                }
            }
            
            $this->logger->logContractCreated($contract->id, $contract->tenant_id, [
                'customer_id' => $contract->customer_id,
                'total_visits' => $contract->total_visits,
                'contract_value' => $contract->contract_value,
                'branch_id' => $contract->branch_id
            ]);

            DB::commit();
            return $contract->load(['product', 'customer', 'assignedTechnician', 'items.product']);
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to create maintenance contract', [
                'error' => $e->getMessage(),
                'data' => $data
            ]);
            throw $e;
        }
    }

    /**
     * Update an existing maintenance contract
     */
    public function updateContract(int $id, array $data): MaintenanceContract
    {
        // Validate permissions
        if (!$this->validateMaintenancePermissions('update_contract')) {
            throw MaintenanceException::branchAccessDenied(0);
        }

        $contract = $this->findContract($id);
        
        if (!$contract) {
            throw MaintenanceException::contractNotFound($id);
        }

        // Validate tenant isolation
        if (!$this->validateTenantIsolation($contract->tenant_id)) {
            throw MaintenanceException::branchAccessDenied($contract->branch_id ?? 0);
        }

        DB::beginTransaction();
        
        try {
            // Validate branch access if branch is being changed
            if (isset($data['branch_id']) && !$this->validateBranchAccess($data['branch_id'])) {
                throw MaintenanceException::branchAccessDenied($data['branch_id']);
            }

            // Update customer details if customer changed
            if (isset($data['customer_id']) && $data['customer_id'] != $contract->customer_id) {
                $customer = Customer::find($data['customer_id']);
                if ($customer) {
                    $data['customer_name'] = $customer->name;
                    $data['customer_phone'] = $customer->phone;
                    $data['customer_email'] = $customer->email;
                    $data['customer_address'] = $customer->address;
                }
            }

            // Recalculate total visits if frequency or dates changed
            if (isset($data['frequency']) || isset($data['start_date']) || isset($data['end_date'])) {
                $frequency = $data['frequency'] ?? $contract->frequency;
                $startDate = isset($data['start_date']) ? Carbon::parse($data['start_date']) : $contract->start_date;
                $endDate = isset($data['end_date']) ? Carbon::parse($data['end_date']) : $contract->end_date;
                
                $data['total_visits'] = $this->calculateTotalVisits($frequency, $startDate, $endDate);
            }

            $contract->update(array_filter($data, fn($value) => $value !== null));

            // Update maintenance products
            if (isset($data['maintenance_products'])) {
                // Delete existing items
                $contract->items()->delete();
                
                // Add new items
                if (is_array($data['maintenance_products'])) {
                    foreach ($data['maintenance_products'] as $productData) {
                        if (isset($productData['id']) && $productData['id'] > 0) {
                            MaintenanceContractItem::create([
                                'tenant_id' => $this->getCurrentTenantId(),
                                'maintenance_contract_id' => $contract->id,
                                'maintenance_product_id' => $productData['id'],
                                'quantity' => $productData['quantity'] ?? 1,
                                'unit_cost' => $productData['unit_cost'] ?? 0,
                                'is_included' => true,
                            ]);
                        }
                    }
                }
            }
            
            Log::info('Maintenance contract updated', [
                'contract_id' => $contract->id,
                'changes' => array_keys($data)
            ]);

            DB::commit();
            return $contract->fresh(['product', 'customer', 'assignedTechnician', 'items.product']);
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to update maintenance contract', [
                'contract_id' => $id,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Get contract health metrics
     */
    public function getContractHealth(int $contractId): array
    {
        $contract = $this->findContract($contractId);
        
        if (!$contract) {
            throw MaintenanceException::contractNotFound($contractId);
        }

        $completedVisits = $this->getCompletedVisitsCount($contractId);
        $remainingVisits = $this->calculateRemainingVisits($contractId);
        $totalVisits = $contract->total_visits ?? 0;
        
        $completionRate = $totalVisits > 0 ? ($completedVisits / $totalVisits) * 100 : 0;
        $daysUntilExpiry = $contract->end_date ? Carbon::now()->diffInDays($contract->end_date, false) : null;
        
        return [
            'contract_id' => $contractId,
            'status' => $contract->status,
            'total_visits' => $totalVisits,
            'completed_visits' => $completedVisits,
            'remaining_visits' => $remainingVisits,
            'completion_rate' => round($completionRate, 2),
            'days_until_expiry' => $daysUntilExpiry,
            'is_expiring_soon' => $daysUntilExpiry !== null && $daysUntilExpiry <= 30 && $daysUntilExpiry >= 0,
            'is_expired' => $daysUntilExpiry !== null && $daysUntilExpiry < 0,
            'health_status' => $this->determineHealthStatus($completionRate, $daysUntilExpiry)
        ];
    }

    /**
     * Get contracts expiring within specified days
     */
    public function getExpiringContracts(int $days = 30): Collection
    {
        $query = MaintenanceContract::query()
            ->where('status', 'active')
            ->whereNotNull('end_date')
            ->whereBetween('end_date', [Carbon::now(), Carbon::now()->addDays($days)])
            ->with([
                'customer:id,name,phone,email', 
                'branch:id,name,code',
                'assignedTechnician:id,name,email',
                'product:id,name'
            ])
            ->orderBy('end_date');

        $query = $this->applyTenantIsolation($query);
        $query = $this->applyBranchContext($query);

        return $query->get();
    }

    /**
     * Calculate remaining visits for a contract
     */
    public function calculateRemainingVisits(int $contractId): int
    {
        $contract = $this->findContract($contractId);
        
        if (!$contract) {
            return 0;
        }

        $completedVisits = $this->getCompletedVisitsCount($contractId);
        $totalVisits = $contract->total_visits ?? 0;
        
        return max(0, $totalVisits - $completedVisits);
    }

    /**
     * Get contract metrics for reporting
     */
    public function getContractMetrics(int $contractId): array
    {
        $contract = $this->findContract($contractId);
        
        if (!$contract) {
            throw new \InvalidArgumentException('Contract not found');
        }

        $visits = MaintenanceVisit::where('maintenance_contract_id', $contractId)->get();
        
        $completedVisits = $visits->where('status', 'completed')->count();
        $pendingVisits = $visits->where('status', 'scheduled')->count();
        $missedVisits = $visits->where('status', 'missed')->count();
        
        $avgCompletionTime = $visits->where('status', 'completed')
            ->filter(fn($visit) => $visit->started_at && $visit->completed_at)
            ->avg(fn($visit) => Carbon::parse($visit->completed_at)->diffInMinutes(Carbon::parse($visit->started_at)));

        return [
            'contract_id' => $contractId,
            'total_visits_planned' => $contract->total_visits ?? 0,
            'completed_visits' => $completedVisits,
            'pending_visits' => $pendingVisits,
            'missed_visits' => $missedVisits,
            'avg_completion_time_minutes' => $avgCompletionTime ? round($avgCompletionTime, 2) : null,
            'on_time_completion_rate' => $this->calculateOnTimeCompletionRate($contractId),
            'customer_satisfaction' => $this->calculateCustomerSatisfaction($contractId)
        ];
    }

    /**
     * Find contract with proper access control
     */
    private function findContract(int $id): ?MaintenanceContract
    {
        $query = MaintenanceContract::where('id', $id);
        $query = $this->applyTenantIsolation($query);
        $query = $this->applyBranchContext($query);
        
        return $query->first();
    }

    /**
     * Calculate total visits based on frequency and duration
     */
    private function calculateTotalVisits(string $frequency, Carbon $startDate, Carbon $endDate): int
    {
        $totalDays = $startDate->diffInDays($endDate);
        
        switch ($frequency) {
            case 'daily':
                return $totalDays + 1;
            case 'weekly':
                return intval($totalDays / 7) + 1;
            case 'bi_weekly':
                return intval($totalDays / 14) + 1;
            case 'monthly':
                return $startDate->diffInMonths($endDate) + 1;
            case 'quarterly':
                return intval($startDate->diffInMonths($endDate) / 3) + 1;
            case 'semi_annual':
                return intval($startDate->diffInMonths($endDate) / 6) + 1;
            case 'annual':
                return $startDate->diffInYears($endDate) + 1;
            default:
                return 1;
        }
    }

    /**
     * Get completed visits count for a contract
     */
    private function getCompletedVisitsCount(int $contractId): int
    {
        return MaintenanceVisit::where('maintenance_contract_id', $contractId)
            ->where('status', 'completed')
            ->count();
    }

    /**
     * Determine health status based on completion rate and expiry
     */
    private function determineHealthStatus(float $completionRate, ?int $daysUntilExpiry): string
    {
        if ($daysUntilExpiry !== null && $daysUntilExpiry < 0) {
            return 'expired';
        }
        
        if ($daysUntilExpiry !== null && $daysUntilExpiry <= 7) {
            return 'critical';
        }
        
        if ($completionRate >= 80) {
            return 'healthy';
        } elseif ($completionRate >= 60) {
            return 'warning';
        } else {
            return 'poor';
        }
    }

    /**
     * Calculate on-time completion rate
     */
    private function calculateOnTimeCompletionRate(int $contractId): float
    {
        $completedVisits = MaintenanceVisit::where('maintenance_contract_id', $contractId)
            ->where('status', 'completed')
            ->get();

        if ($completedVisits->isEmpty()) {
            return 0.0;
        }

        $onTimeVisits = $completedVisits->filter(function ($visit) {
            return $visit->completed_at && $visit->scheduled_date && 
                   Carbon::parse($visit->completed_at)->isSameDay(Carbon::parse($visit->scheduled_date));
        })->count();

        return round(($onTimeVisits / $completedVisits->count()) * 100, 2);
    }

    /**
     * Calculate customer satisfaction (placeholder - would integrate with feedback system)
     */
    private function calculateCustomerSatisfaction(int $contractId): ?float
    {
        // Placeholder for customer satisfaction calculation
        // This would integrate with a feedback/rating system
        return null;
    }

    /**
     * Handle contract expiration - cancel future visits and update status
     */
    public function handleContractExpiration(int $contractId): array
    {
        $contract = $this->findContract($contractId);
        
        if (!$contract) {
            throw new \InvalidArgumentException('Contract not found');
        }

        DB::beginTransaction();
        
        try {
            $results = [
                'contract_id' => $contractId,
                'cancelled_visits' => 0,
                'notifications_sent' => 0,
                'status_updated' => false,
            ];

            // Check if contract is expired
            if ($contract->end_date && Carbon::parse($contract->end_date)->isPast()) {
                // Update contract status to expired
                $contract->update(['status' => 'expired']);
                $results['status_updated'] = true;

                // Cancel all future scheduled visits
                $futureVisits = MaintenanceVisit::where('maintenance_contract_id', $contractId)
                    ->where('status', 'scheduled')
                    ->where('scheduled_date', '>', now())
                    ->get();

                foreach ($futureVisits as $visit) {
                    $visit->update([
                        'status' => 'cancelled',
                        'completion_notes' => 'Automatically cancelled due to contract expiration'
                    ]);
                    $results['cancelled_visits']++;
                }

                // Send expiration notification (placeholder for notification system)
                $this->sendExpirationNotification($contract);
                $results['notifications_sent'] = 1;

                Log::info('Contract expiration handled', [
                    'contract_id' => $contractId,
                    'cancelled_visits' => $results['cancelled_visits']
                ]);
            }

            DB::commit();
            return $results;
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to handle contract expiration', [
                'contract_id' => $contractId,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Process all expired contracts
     */
    public function processExpiredContracts(): array
    {
        $query = MaintenanceContract::query()
            ->where('status', 'active')
            ->whereNotNull('end_date')
            ->where('end_date', '<', now());

        $query = $this->applyTenantIsolation($query);
        $query = $this->applyBranchContext($query);

        $expiredContracts = $query->get();
        
        $results = [
            'processed_contracts' => 0,
            'total_cancelled_visits' => 0,
            'notifications_sent' => 0,
        ];

        foreach ($expiredContracts as $contract) {
            try {
                $contractResults = $this->handleContractExpiration($contract->id);
                $results['processed_contracts']++;
                $results['total_cancelled_visits'] += $contractResults['cancelled_visits'];
                $results['notifications_sent'] += $contractResults['notifications_sent'];
            } catch (\Exception $e) {
                Log::error('Failed to process expired contract', [
                    'contract_id' => $contract->id,
                    'error' => $e->getMessage()
                ]);
            }
        }

        return $results;
    }

    /**
     * Create contract renewal workflow
     */
    public function createRenewalWorkflow(int $contractId, array $renewalData): MaintenanceContract
    {
        $originalContract = $this->findContract($contractId);
        
        if (!$originalContract) {
            throw new \InvalidArgumentException('Original contract not found');
        }

        DB::beginTransaction();
        
        try {
            // Create new contract based on original
            $newContractData = [
                'tenant_id' => $originalContract->tenant_id,
                'branch_id' => $originalContract->branch_id,
                'product_id' => $originalContract->product_id,
                'customer_id' => $originalContract->customer_id,
                'customer_name' => $originalContract->customer_name,
                'customer_phone' => $originalContract->customer_phone,
                'customer_email' => $originalContract->customer_email,
                'customer_address' => $originalContract->customer_address,
                'assigned_technician_id' => $originalContract->assigned_technician_id,
                'frequency' => $renewalData['frequency'] ?? $originalContract->frequency,
                'frequency_value' => $renewalData['frequency_value'] ?? $originalContract->frequency_value,
                'frequency_unit' => $renewalData['frequency_unit'] ?? $originalContract->frequency_unit,
                'start_date' => $renewalData['start_date'],
                'end_date' => $renewalData['end_date'] ?? null,
                'contract_value' => $renewalData['contract_value'] ?? $originalContract->contract_value,
                'special_instructions' => $renewalData['special_instructions'] ?? $originalContract->special_instructions,
                'status' => 'active',
            ];

            // Calculate total visits for new contract
            if (isset($newContractData['start_date']) && isset($newContractData['end_date'])) {
                $newContractData['total_visits'] = $this->calculateTotalVisits(
                    $newContractData['frequency'],
                    Carbon::parse($newContractData['start_date']),
                    Carbon::parse($newContractData['end_date'])
                );
            }

            $newContract = MaintenanceContract::create($newContractData);

            // Copy contract items from original contract
            foreach ($originalContract->items as $item) {
                MaintenanceContractItem::create([
                    'tenant_id' => $newContract->tenant_id,
                    'maintenance_contract_id' => $newContract->id,
                    'maintenance_product_id' => $item->maintenance_product_id,
                    'quantity' => $item->quantity,
                    'unit_cost' => $item->unit_cost,
                    'is_included' => $item->is_included,
                ]);
            }

            // Update original contract status to renewed
            $originalContract->update(['status' => 'renewed']);

            Log::info('Contract renewal created', [
                'original_contract_id' => $contractId,
                'new_contract_id' => $newContract->id
            ]);

            DB::commit();
            return $newContract->load(['product', 'customer', 'assignedTechnician', 'items.product']);
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to create contract renewal', [
                'original_contract_id' => $contractId,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Send expiration notification (placeholder for notification system)
     */
    private function sendExpirationNotification(MaintenanceContract $contract): void
    {
        // Placeholder for notification system integration
        // This would typically send email/SMS notifications to:
        // - Customer about contract expiration
        // - Sales team about renewal opportunity
        // - Management about expired contracts
        
        Log::info('Contract expiration notification sent', [
            'contract_id' => $contract->id,
            'customer_name' => $contract->customer_name,
            'customer_email' => $contract->customer_email,
        ]);
    }
    private function determineBranchId(array $data): ?int
    {
        $branchId = $data['branch_id'] ?? null;
        
        if (!$branchId) {
            $currentBranch = $this->branchContext->getCurrentBranch();
            $branchId = $currentBranch?->id;
        }
        
        if (!$branchId) {
            // Get default branch for tenant
            $defaultBranch = Branch::where('tenant_id', $this->getCurrentTenantId())
                ->where('is_default', true)
                ->first();
            $branchId = $defaultBranch?->id;
        }
        
        if (!$branchId) {
            // Fallback: get any branch for tenant
            $anyBranch = Branch::where('tenant_id', $this->getCurrentTenantId())->first();
            $branchId = $anyBranch?->id;
        }

        return $branchId;
    }
}