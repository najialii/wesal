<?php

namespace App\Services\Maintenance;

use App\Models\MaintenanceContract;
use App\Models\MaintenanceVisit;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class VisitSchedulingService extends BaseMaintenanceService
{
    /**
     * Generate scheduled visits for a contract (idempotent)
     */
    public function generateScheduledVisits(MaintenanceContract $contract): Collection
    {
        DB::beginTransaction();
        
        try {
            // Ensure idempotent generation - check if visits already exist
            $existingVisits = MaintenanceVisit::where('maintenance_contract_id', $contract->id)
                ->where('status', 'scheduled')
                ->pluck('scheduled_date')
                ->map(fn($date) => Carbon::parse($date)->format('Y-m-d'))
                ->toArray();

            $scheduledDates = $this->calculateScheduledDates($contract);
            $newVisits = collect();

            foreach ($scheduledDates as $date) {
                $dateString = $date->format('Y-m-d');
                
                // Skip if visit already exists for this date (idempotent)
                if (in_array($dateString, $existingVisits)) {
                    continue;
                }

                $visit = MaintenanceVisit::create([
                    'maintenance_contract_id' => $contract->id,
                    'customer_id' => $contract->customer_id,
                    'branch_id' => $contract->branch_id,
                    'tenant_id' => $contract->tenant_id,
                    'scheduled_date' => $date,
                    'status' => 'scheduled',
                    'visit_type' => 'maintenance',
                    'priority' => $this->determinePriority($contract, $date),
                    'estimated_duration' => $contract->estimated_duration ?? 60, // Default 1 hour
                ]);

                $newVisits->push($visit);
            }

            Log::info('Scheduled visits generated', [
                'contract_id' => $contract->id,
                'new_visits_count' => $newVisits->count(),
                'total_scheduled_dates' => count($scheduledDates)
            ]);

            DB::commit();
            return $newVisits;
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to generate scheduled visits', [
                'contract_id' => $contract->id,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Reschedule a visit to a new date
     */
    public function rescheduleVisit(int $visitId, Carbon $newDate): MaintenanceVisit
    {
        $visit = $this->findVisit($visitId);
        
        if (!$visit) {
            throw new \InvalidArgumentException('Visit not found');
        }

        if ($visit->status === 'completed') {
            throw new \InvalidArgumentException('Cannot reschedule completed visit');
        }

        DB::beginTransaction();
        
        try {
            $oldDate = $visit->scheduled_date;
            
            $visit->update([
                'scheduled_date' => $newDate,
                'status' => 'rescheduled',
                'rescheduled_from' => $oldDate,
                'rescheduled_at' => Carbon::now(),
                'rescheduled_by' => auth()->id()
            ]);

            Log::info('Visit rescheduled', [
                'visit_id' => $visitId,
                'old_date' => $oldDate,
                'new_date' => $newDate->format('Y-m-d H:i:s')
            ]);

            DB::commit();
            return $visit->fresh();
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to reschedule visit', [
                'visit_id' => $visitId,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Cancel future visits for a contract
     */
    public function cancelFutureVisits(int $contractId): int
    {
        DB::beginTransaction();
        
        try {
            $cancelledCount = MaintenanceVisit::where('maintenance_contract_id', $contractId)
                ->where('status', 'scheduled')
                ->where('scheduled_date', '>', Carbon::now())
                ->update([
                    'status' => 'cancelled',
                    'cancelled_at' => Carbon::now(),
                    'cancelled_by' => auth()->id()
                ]);

            Log::info('Future visits cancelled', [
                'contract_id' => $contractId,
                'cancelled_count' => $cancelledCount
            ]);

            DB::commit();
            return $cancelledCount;
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to cancel future visits', [
                'contract_id' => $contractId,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Get upcoming visits within specified days
     */
    public function getUpcomingVisits(int $days = 7): Collection
    {
        $query = MaintenanceVisit::query()
            ->whereIn('status', ['scheduled', 'rescheduled'])
            ->whereBetween('scheduled_date', [Carbon::now(), Carbon::now()->addDays($days)])
            ->with(['contract', 'customer', 'technician'])
            ->orderBy('scheduled_date');

        $query = $this->applyTenantIsolation($query);
        $query = $this->applyBranchContext($query);

        return $query->get();
    }

    /**
     * Get overdue visits
     */
    public function getOverdueVisits(): Collection
    {
        $query = MaintenanceVisit::query()
            ->where('status', 'scheduled')
            ->where('scheduled_date', '<', Carbon::now()->startOfDay())
            ->with(['contract', 'customer'])
            ->orderBy('scheduled_date');

        $query = $this->applyTenantIsolation($query);
        $query = $this->applyBranchContext($query);

        return $query->get();
    }

    /**
     * Mark overdue visits as missed
     */
    public function markOverdueVisitsAsMissed(): int
    {
        DB::beginTransaction();
        
        try {
            $missedCount = MaintenanceVisit::where('status', 'scheduled')
                ->where('scheduled_date', '<', Carbon::now()->subDays(1)->startOfDay())
                ->update([
                    'status' => 'missed',
                    'missed_at' => Carbon::now()
                ]);

            if ($missedCount > 0) {
                Log::info('Overdue visits marked as missed', [
                    'missed_count' => $missedCount
                ]);
            }

            DB::commit();
            return $missedCount;
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to mark overdue visits as missed', [
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Get visit scheduling statistics
     */
    public function getSchedulingStatistics(): array
    {
        $query = MaintenanceVisit::query();
        $query = $this->applyTenantIsolation($query);
        $query = $this->applyBranchContext($query);

        $totalVisits = $query->count();
        $scheduledVisits = (clone $query)->where('status', 'scheduled')->count();
        $completedVisits = (clone $query)->where('status', 'completed')->count();
        $missedVisits = (clone $query)->where('status', 'missed')->count();
        $cancelledVisits = (clone $query)->where('status', 'cancelled')->count();
        $rescheduledVisits = (clone $query)->where('status', 'rescheduled')->count();

        return [
            'total_visits' => $totalVisits,
            'scheduled_visits' => $scheduledVisits,
            'completed_visits' => $completedVisits,
            'missed_visits' => $missedVisits,
            'cancelled_visits' => $cancelledVisits,
            'rescheduled_visits' => $rescheduledVisits,
            'completion_rate' => $totalVisits > 0 ? round(($completedVisits / $totalVisits) * 100, 2) : 0,
            'miss_rate' => $totalVisits > 0 ? round(($missedVisits / $totalVisits) * 100, 2) : 0
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
     * Calculate scheduled dates based on contract frequency
     */
    private function calculateScheduledDates(MaintenanceContract $contract): array
    {
        $startDate = Carbon::parse($contract->start_date);
        $endDate = Carbon::parse($contract->end_date);
        $frequency = $contract->frequency;
        
        $dates = [];
        $currentDate = $startDate->copy();

        while ($currentDate->lte($endDate)) {
            $dates[] = $currentDate->copy();
            
            switch ($frequency) {
                case 'daily':
                    $currentDate->addDay();
                    break;
                case 'weekly':
                    $currentDate->addWeek();
                    break;
                case 'bi_weekly':
                    $currentDate->addWeeks(2);
                    break;
                case 'monthly':
                    $currentDate->addMonth();
                    break;
                case 'quarterly':
                    $currentDate->addMonths(3);
                    break;
                case 'semi_annual':
                    $currentDate->addMonths(6);
                    break;
                case 'annual':
                    $currentDate->addYear();
                    break;
                default:
                    // For custom frequencies, break to avoid infinite loop
                    break 2;
            }
        }

        return $dates;
    }

    /**
     * Determine visit priority based on contract and date
     */
    private function determinePriority(MaintenanceContract $contract, Carbon $date): string
    {
        // High priority for first visit or if contract is premium
        if ($contract->priority === 'high' || $contract->is_premium) {
            return 'high';
        }
        
        // Medium priority for regular maintenance
        if ($contract->contract_type === 'maintenance') {
            return 'medium';
        }
        
        return 'low';
    }
}