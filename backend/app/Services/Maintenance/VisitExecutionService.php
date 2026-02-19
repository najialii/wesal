<?php

namespace App\Services\Maintenance;

use App\Models\MaintenanceVisit;
use App\Models\MaintenanceVisitItem;
use App\Models\Product;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class VisitExecutionService extends BaseMaintenanceService
{
    /**
     * Start a visit (assign technician and mark as in progress)
     */
    public function startVisit(int $visitId, int $technicianId): MaintenanceVisit
    {
        $visit = $this->findVisit($visitId);
        
        if (!$visit) {
            throw new \InvalidArgumentException('Visit not found');
        }

        if (!in_array($visit->status, ['scheduled', 'rescheduled'])) {
            throw new \InvalidArgumentException('Visit cannot be started in current status: ' . $visit->status);
        }

        // Validate technician access to branch
        if (!$this->validateTechnicianBranchAccess($technicianId, $visit->branch_id)) {
            throw new \InvalidArgumentException('Technician does not have access to this branch');
        }

        DB::beginTransaction();
        
        try {
            $visit->update([
                'technician_id' => $technicianId,
                'status' => 'in_progress',
                'started_at' => Carbon::now(),
                'started_by' => auth()->id()
            ]);

            Log::info('Visit started', [
                'visit_id' => $visitId,
                'technician_id' => $technicianId,
                'started_at' => $visit->started_at
            ]);

            DB::commit();
            return $visit->fresh();
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to start visit', [
                'visit_id' => $visitId,
                'technician_id' => $technicianId,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Complete a visit with results and parts used
     */
    public function completeVisit(int $visitId, array $data): MaintenanceVisit
    {
        $visit = $this->findVisit($visitId);
        
        if (!$visit) {
            throw new \InvalidArgumentException('Visit not found');
        }

        if ($visit->status !== 'in_progress') {
            throw new \InvalidArgumentException('Visit must be in progress to complete');
        }

        DB::beginTransaction();
        
        try {
            // Update visit with completion data
            $visit->update([
                'status' => $data['result'] ?? 'completed',
                'completed_at' => Carbon::now(),
                'completed_by' => auth()->id(),
                'notes' => $data['notes'] ?? null,
                'customer_signature' => $data['customer_signature'] ?? null,
                'customer_feedback' => $data['customer_feedback'] ?? null,
                'rating' => $data['rating'] ?? null,
                'work_performed' => $data['work_performed'] ?? null,
                'issues_found' => $data['issues_found'] ?? null,
                'recommendations' => $data['recommendations'] ?? null
            ]);

            // Record parts used if provided
            if (isset($data['parts_used']) && is_array($data['parts_used'])) {
                $this->recordPartsUsed($visitId, $data['parts_used']);
            }

            // Schedule next visit if this is part of a recurring contract
            if ($visit->contract && $visit->contract->status === 'active') {
                $this->scheduleNextVisit($visit);
            }

            Log::info('Visit completed', [
                'visit_id' => $visitId,
                'result' => $data['result'] ?? 'completed',
                'parts_used_count' => isset($data['parts_used']) ? count($data['parts_used']) : 0
            ]);

            DB::commit();
            return $visit->fresh(['items', 'contract']);
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to complete visit', [
                'visit_id' => $visitId,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Record parts used during a visit
     */
    public function recordPartsUsed(int $visitId, array $parts): void
    {
        foreach ($parts as $partData) {
            if (!isset($partData['product_id']) || !isset($partData['quantity'])) {
                continue;
            }

            $product = Product::find($partData['product_id']);
            if (!$product) {
                Log::warning('Product not found for visit item', [
                    'visit_id' => $visitId,
                    'product_id' => $partData['product_id']
                ]);
                continue;
            }

            // Check inventory availability
            if ($product->stock_quantity < $partData['quantity']) {
                throw new \InvalidArgumentException(
                    "Insufficient stock for product {$product->name}. Available: {$product->stock_quantity}, Required: {$partData['quantity']}"
                );
            }

            // Create visit item record
            MaintenanceVisitItem::create([
                'maintenance_visit_id' => $visitId,
                'product_id' => $partData['product_id'],
                'quantity' => $partData['quantity'],
                'unit_price' => $partData['unit_price'] ?? $product->price,
                'total_price' => ($partData['unit_price'] ?? $product->price) * $partData['quantity'],
                'notes' => $partData['notes'] ?? null
            ]);

            // Update product inventory
            $product->decrement('stock_quantity', $partData['quantity']);

            Log::info('Part used recorded', [
                'visit_id' => $visitId,
                'product_id' => $product->id,
                'quantity' => $partData['quantity'],
                'remaining_stock' => $product->fresh()->stock_quantity
            ]);
        }
    }

    /**
     * Update visit status with validation
     */
    public function updateVisitStatus(int $visitId, string $status): MaintenanceVisit
    {
        $visit = $this->findVisit($visitId);
        
        if (!$visit) {
            throw new \InvalidArgumentException('Visit not found');
        }

        if (!$this->isValidStatusTransition($visit->status, $status)) {
            throw new \InvalidArgumentException(
                "Invalid status transition from {$visit->status} to {$status}"
            );
        }

        DB::beginTransaction();
        
        try {
            $updateData = ['status' => $status];
            
            // Add timestamp fields based on status
            switch ($status) {
                case 'in_progress':
                    $updateData['started_at'] = Carbon::now();
                    break;
                case 'completed':
                    $updateData['completed_at'] = Carbon::now();
                    break;
                case 'cancelled':
                    $updateData['cancelled_at'] = Carbon::now();
                    break;
                case 'missed':
                    $updateData['missed_at'] = Carbon::now();
                    break;
            }

            $visit->update($updateData);

            Log::info('Visit status updated', [
                'visit_id' => $visitId,
                'old_status' => $visit->getOriginal('status'),
                'new_status' => $status
            ]);

            DB::commit();
            return $visit->fresh();
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to update visit status', [
                'visit_id' => $visitId,
                'status' => $status,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Get visits for a specific technician
     */
    public function getTechnicianVisits(int $technicianId, ?string $status = null): Collection
    {
        $query = MaintenanceVisit::where('technician_id', $technicianId)
            ->with(['contract', 'customer', 'items.product'])
            ->orderBy('scheduled_date');

        if ($status) {
            $query->where('status', $status);
        }

        $query = $this->applyTenantIsolation($query);
        $query = $this->applyBranchContext($query);

        return $query->get();
    }

    /**
     * Get today's visits for a technician
     */
    public function getTodayVisitsForTechnician(int $technicianId): Collection
    {
        $query = MaintenanceVisit::where('technician_id', $technicianId)
            ->whereDate('scheduled_date', Carbon::today())
            ->whereIn('status', ['scheduled', 'rescheduled', 'in_progress'])
            ->with(['contract', 'customer', 'items.product'])
            ->orderBy('scheduled_date');

        $query = $this->applyTenantIsolation($query);
        $query = $this->applyBranchContext($query);

        return $query->get();
    }

    /**
     * Get visit execution statistics for a technician
     */
    public function getTechnicianPerformanceStats(int $technicianId, ?Carbon $startDate = null, ?Carbon $endDate = null): array
    {
        $query = MaintenanceVisit::where('technician_id', $technicianId);
        
        if ($startDate) {
            $query->where('scheduled_date', '>=', $startDate);
        }
        
        if ($endDate) {
            $query->where('scheduled_date', '<=', $endDate);
        }

        $query = $this->applyTenantIsolation($query);
        $query = $this->applyBranchContext($query);

        $visits = $query->get();
        
        $totalVisits = $visits->count();
        $completedVisits = $visits->where('status', 'completed')->count();
        $missedVisits = $visits->where('status', 'missed')->count();
        
        $avgDuration = $visits->where('status', 'completed')
            ->filter(fn($visit) => $visit->started_at && $visit->completed_at)
            ->avg(fn($visit) => Carbon::parse($visit->completed_at)->diffInMinutes(Carbon::parse($visit->started_at)));

        $avgRating = $visits->where('status', 'completed')
            ->whereNotNull('rating')
            ->avg('rating');

        return [
            'technician_id' => $technicianId,
            'total_visits' => $totalVisits,
            'completed_visits' => $completedVisits,
            'missed_visits' => $missedVisits,
            'completion_rate' => $totalVisits > 0 ? round(($completedVisits / $totalVisits) * 100, 2) : 0,
            'avg_duration_minutes' => $avgDuration ? round($avgDuration, 2) : null,
            'avg_rating' => $avgRating ? round($avgRating, 2) : null,
            'period_start' => $startDate?->format('Y-m-d'),
            'period_end' => $endDate?->format('Y-m-d')
        ];
    }

    /**
     * Find visit with proper access control
     */
    private function findVisit(int $id): ?MaintenanceVisit
    {
        $query = MaintenanceVisit::where('id', $id);
        $query = $this->applyTenantIsolation($query);
        $query = $this->applyBranchContext($query);
        
        return $query->first();
    }

    /**
     * Validate technician has access to branch
     */
    private function validateTechnicianBranchAccess(int $technicianId, int $branchId): bool
    {
        $technician = User::find($technicianId);
        
        if (!$technician || !$technician->hasRole('technician')) {
            return false;
        }

        // Check if technician has access to this branch
        if (method_exists($technician, 'branches')) {
            return $technician->branches()->where('id', $branchId)->exists();
        }

        return true; // Default to true if no branch restriction system
    }

    /**
     * Validate status transition
     */
    private function isValidStatusTransition(string $currentStatus, string $newStatus): bool
    {
        $validTransitions = [
            'scheduled' => ['in_progress', 'rescheduled', 'cancelled', 'missed'],
            'rescheduled' => ['in_progress', 'cancelled', 'missed'],
            'in_progress' => ['completed', 'failed', 'no_access'],
            'completed' => [], // Completed visits cannot be changed
            'failed' => ['rescheduled'],
            'no_access' => ['rescheduled'],
            'cancelled' => [],
            'missed' => ['rescheduled']
        ];

        return isset($validTransitions[$currentStatus]) && 
               in_array($newStatus, $validTransitions[$currentStatus]);
    }

    /**
     * Schedule next visit for recurring contracts
     */
    private function scheduleNextVisit(MaintenanceVisit $completedVisit): void
    {
        $contract = $completedVisit->contract;
        
        if (!$contract || $contract->status !== 'active') {
            return;
        }

        // Calculate next visit date based on frequency
        $nextDate = $this->calculateNextVisitDate($completedVisit->scheduled_date, $contract->frequency);
        
        // Don't schedule if beyond contract end date
        if ($nextDate->gt(Carbon::parse($contract->end_date))) {
            return;
        }

        // Check if next visit already exists
        $existingVisit = MaintenanceVisit::where('maintenance_contract_id', $contract->id)
            ->whereDate('scheduled_date', $nextDate)
            ->exists();

        if (!$existingVisit) {
            MaintenanceVisit::create([
                'maintenance_contract_id' => $contract->id,
                'customer_id' => $contract->customer_id,
                'branch_id' => $contract->branch_id,
                'tenant_id' => $contract->tenant_id,
                'scheduled_date' => $nextDate,
                'status' => 'scheduled',
                'visit_type' => 'maintenance',
                'priority' => $completedVisit->priority,
                'estimated_duration' => $contract->estimated_duration ?? 60,
            ]);

            Log::info('Next visit scheduled automatically', [
                'contract_id' => $contract->id,
                'completed_visit_id' => $completedVisit->id,
                'next_visit_date' => $nextDate->format('Y-m-d')
            ]);
        }
    }

    /**
     * Calculate next visit date based on frequency
     */
    private function calculateNextVisitDate(Carbon $currentDate, string $frequency): Carbon
    {
        $nextDate = Carbon::parse($currentDate)->copy();
        
        switch ($frequency) {
            case 'daily':
                return $nextDate->addDay();
            case 'weekly':
                return $nextDate->addWeek();
            case 'bi_weekly':
                return $nextDate->addWeeks(2);
            case 'monthly':
                return $nextDate->addMonth();
            case 'quarterly':
                return $nextDate->addMonths(3);
            case 'semi_annual':
                return $nextDate->addMonths(6);
            case 'annual':
                return $nextDate->addYear();
            default:
                return $nextDate->addMonth(); // Default to monthly
        }
    }
}