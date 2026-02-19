<?php

namespace App\Services\Maintenance;

use App\Models\MaintenanceContract;
use App\Models\MaintenanceVisit;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class MaintenanceAnalyticsService extends BaseMaintenanceService
{
    /**
     * Get contract health metrics across all contracts
     */
    public function getContractHealthMetrics(): array
    {
        $cacheKey = "contract_health_metrics_" . $this->getCurrentTenantId() . "_" . $this->getCurrentBranch()?->id;
        
        return Cache::remember($cacheKey, now()->addMinutes(10), function () {
            $query = MaintenanceContract::query()
                ->select(['id', 'status', 'end_date'])
                ->with(['visits:id,maintenance_contract_id,status']);
            
            $query = $this->applyTenantIsolation($query);
            $query = $this->applyBranchContext($query);
            
            $contracts = $query->get();
            
            $totalContracts = $contracts->count();
            $activeContracts = $contracts->where('status', 'active')->count();
            $expiredContracts = $contracts->filter(function ($contract) {
                return $contract->end_date && Carbon::parse($contract->end_date)->isPast();
            })->count();
            
            $expiringContracts = $contracts->filter(function ($contract) {
                return $contract->end_date && 
                       Carbon::parse($contract->end_date)->between(now(), now()->addDays(30));
            })->count();
            
            // Calculate average completion rates
            $contractsWithVisits = $contracts->filter(fn($c) => $c->visits->count() > 0);
            $averageCompletionRate = $contractsWithVisits->avg(function ($contract) {
                $totalVisits = $contract->visits->count();
                $completedVisits = $contract->visits->where('status', 'completed')->count();
                return $totalVisits > 0 ? ($completedVisits / $totalVisits) * 100 : 0;
            });

            return [
                'total_contracts' => $totalContracts,
                'active_contracts' => $activeContracts,
                'expired_contracts' => $expiredContracts,
                'expiring_soon' => $expiringContracts,
                'average_completion_rate' => round($averageCompletionRate ?? 0, 2),
                'health_distribution' => $this->getHealthDistribution($contracts),
            ];
        });
    }

    /**
     * Get SLA (Service Level Agreement) metrics
     */
    public function getSLAMetrics(?Carbon $startDate = null, ?Carbon $endDate = null): array
    {
        $startDate = $startDate ?? now()->subMonth();
        $endDate = $endDate ?? now();
        
        $cacheKey = "sla_metrics_" . $this->getCurrentTenantId() . "_{$startDate->format('Y-m-d')}_{$endDate->format('Y-m-d')}";
        
        return Cache::remember($cacheKey, now()->addMinutes(10), function () use ($startDate, $endDate) {
            $query = MaintenanceVisit::select([
                'id', 'status', 'scheduled_date', 'scheduled_time', 
                'actual_start_time', 'actual_end_time', 'assigned_technician_id'
            ])
            ->whereBetween('scheduled_date', [$startDate, $endDate]);
            $query = $this->applyTenantIsolation($query);
            $query = $this->applyBranchContext($query);
            
            $visits = $query->get();
            
            $totalVisits = $visits->count();
            $completedVisits = $visits->where('status', 'completed');
            $overdueVisits = $visits->where('status', 'scheduled')
                ->filter(fn($v) => Carbon::parse($v->scheduled_date)->isPast());
            
            $onTimeVisits = $completedVisits->filter(function ($visit) {
                return $visit->completed_at && 
                       Carbon::parse($visit->completed_at)->lte(Carbon::parse($visit->scheduled_date)->endOfDay());
            });
            
            $onTimeRate = $totalVisits > 0 ? ($onTimeVisits->count() / $totalVisits) * 100 : 0;
            $completionRate = $totalVisits > 0 ? ($completedVisits->count() / $totalVisits) * 100 : 0;
            
            // Calculate average response time (time from scheduled to actual start)
            $averageResponseTime = $completedVisits->filter(function ($visit) {
                return $visit->started_at && $visit->scheduled_date;
            })->avg(function ($visit) {
                return Carbon::parse($visit->scheduled_date)
                    ->diffInHours(Carbon::parse($visit->started_at));
            });

            // Calculate average visit duration
            $averageVisitDuration = $completedVisits->filter(function ($visit) {
                return $visit->started_at && $visit->completed_at;
            })->avg(function ($visit) {
                return Carbon::parse($visit->started_at)
                    ->diffInMinutes(Carbon::parse($visit->completed_at));
            });

            return [
                'period' => [
                    'start' => $startDate->toDateString(),
                    'end' => $endDate->toDateString(),
                ],
                'visits' => [
                    'total' => $totalVisits,
                    'completed' => $completedVisits->count(),
                    'overdue' => $overdueVisits->count(),
                    'on_time' => $onTimeVisits->count(),
                ],
                'metrics' => [
                    'on_time_rate' => round($onTimeRate, 2),
                    'completion_rate' => round($completionRate, 2),
                    'average_response_time_hours' => round($averageResponseTime ?? 0, 2),
                    'average_visit_duration_minutes' => round($averageVisitDuration ?? 0, 2),
                ],
            ];
        });
    }

    /**
     * Get technician performance metrics
     */
    public function getTechnicianPerformance(?Carbon $startDate = null, ?Carbon $endDate = null): array
    {
        $startDate = $startDate ?? now()->subMonth();
        $endDate = $endDate ?? now();
        
        $cacheKey = "technician_performance_" . $this->getCurrentTenantId() . "_{$startDate->format('Y-m-d')}_{$endDate->format('Y-m-d')}";
        
        return Cache::remember($cacheKey, now()->addMinutes(10), function () use ($startDate, $endDate) {
            $query = MaintenanceVisit::with(['technician'])
                ->whereBetween('scheduled_date', [$startDate, $endDate])
                ->whereNotNull('technician_id');
            
            $query = $this->applyTenantIsolation($query);
            $query = $this->applyBranchContext($query);
            
            $visits = $query->get();
            
            $technicianStats = $visits->groupBy('technician_id')->map(function ($technicianVisits, $technicianId) {
                $technician = $technicianVisits->first()->technician;
                $totalVisits = $technicianVisits->count();
                $completedVisits = $technicianVisits->where('status', 'completed');
                
                $completionRate = $totalVisits > 0 ? ($completedVisits->count() / $totalVisits) * 100 : 0;
                
                $averageRating = $completedVisits->whereNotNull('rating')
                    ->avg('rating');
                
                $totalRevenue = $completedVisits->sum('total_cost');
                
                return [
                    'technician_id' => $technicianId,
                    'technician_name' => $technician->name ?? 'Unknown',
                    'total_visits' => $totalVisits,
                    'completed_visits' => $completedVisits->count(),
                    'completion_rate' => round($completionRate, 2),
                    'average_rating' => round($averageRating ?? 0, 2),
                    'total_revenue' => round($totalRevenue, 2),
                ];
            })->values();
            
            return [
                'period' => [
                    'start' => $startDate->toDateString(),
                    'end' => $endDate->toDateString(),
                ],
                'technicians' => $technicianStats->toArray(),
                'summary' => [
                    'total_technicians' => $technicianStats->count(),
                    'average_completion_rate' => round($technicianStats->avg('completion_rate'), 2),
                    'average_rating' => round($technicianStats->avg('average_rating'), 2),
                    'total_revenue' => round($technicianStats->sum('total_revenue'), 2),
                ],
            ];
        });
    }

    /**
     * Get visit completion rates over time
     */
    public function getVisitCompletionRates(string $groupBy = 'week'): array
    {
        $startDate = now()->subMonths(3);
        $endDate = now();
        
        $dateFormat = match($groupBy) {
            'day' => '%Y-%m-%d',
            'week' => '%Y-%u',
            'month' => '%Y-%m',
            default => '%Y-%u',
        };
        
        $query = MaintenanceVisit::whereBetween('scheduled_date', [$startDate, $endDate]);
        $query = $this->applyTenantIsolation($query);
        $query = $this->applyBranchContext($query);
        
        $completionData = $query->select(
                DB::raw("DATE_FORMAT(scheduled_date, '{$dateFormat}') as period"),
                DB::raw('COUNT(*) as total_visits'),
                DB::raw('SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END) as completed_visits')
            )
            ->groupBy('period')
            ->orderBy('period')
            ->get();
        
        return $completionData->map(function ($item) {
            $completionRate = $item->total_visits > 0 ? 
                ($item->completed_visits / $item->total_visits) * 100 : 0;
            
            return [
                'period' => $item->period,
                'total_visits' => $item->total_visits,
                'completed_visits' => $item->completed_visits,
                'completion_rate' => round($completionRate, 2),
            ];
        })->toArray();
    }

    /**
     * Get comprehensive branch metrics
     */
    public function getBranchMetrics(?Carbon $startDate = null, ?Carbon $endDate = null): array
    {
        $startDate = $startDate ?? now()->subMonth();
        $endDate = $endDate ?? now();
        
        $contractMetrics = $this->getContractHealthMetrics();
        $slaMetrics = $this->getSLAMetrics($startDate, $endDate);
        $technicianMetrics = $this->getTechnicianPerformance($startDate, $endDate);
        
        return [
            'period' => [
                'start' => $startDate->toDateString(),
                'end' => $endDate->toDateString(),
            ],
            'contracts' => $contractMetrics,
            'sla' => $slaMetrics,
            'technicians' => $technicianMetrics,
        ];
    }

    /**
     * Get revenue analytics
     */
    public function getRevenueAnalytics(?Carbon $startDate = null, ?Carbon $endDate = null): array
    {
        $startDate = $startDate ?? now()->subMonth();
        $endDate = $endDate ?? now();
        
        $query = MaintenanceVisit::where('status', 'completed')
            ->whereBetween('completed_at', [$startDate, $endDate]);
        
        $query = $this->applyTenantIsolation($query);
        $query = $this->applyBranchContext($query);
        
        $visits = $query->get();
        
        $totalRevenue = $visits->sum('total_cost');
        $averageVisitValue = $visits->count() > 0 ? $totalRevenue / $visits->count() : 0;
        
        // Revenue by contract
        $revenueByContract = $visits->groupBy('maintenance_contract_id')
            ->map(function ($contractVisits) {
                $contract = $contractVisits->first()->contract;
                return [
                    'contract_id' => $contract->id,
                    'customer_name' => $contract->customer_name,
                    'revenue' => $contractVisits->sum('total_cost'),
                    'visits_count' => $contractVisits->count(),
                ];
            })
            ->sortByDesc('revenue')
            ->values();
        
        return [
            'period' => [
                'start' => $startDate->toDateString(),
                'end' => $endDate->toDateString(),
            ],
            'summary' => [
                'total_revenue' => round($totalRevenue, 2),
                'total_visits' => $visits->count(),
                'average_visit_value' => round($averageVisitValue, 2),
            ],
            'by_contract' => $revenueByContract->take(10)->toArray(),
        ];
    }

    /**
     * Get health distribution for contracts
     */
    private function getHealthDistribution($contracts): array
    {
        $distribution = [
            'healthy' => 0,
            'warning' => 0,
            'poor' => 0,
            'critical' => 0,
            'expired' => 0,
        ];
        
        foreach ($contracts as $contract) {
            $visits = $contract->visits;
            $totalVisits = $visits->count();
            $completedVisits = $visits->where('status', 'completed')->count();
            $overdueVisits = $visits->where('status', 'scheduled')
                ->filter(fn($v) => Carbon::parse($v->scheduled_date)->isPast())
                ->count();
            
            $completionRate = $totalVisits > 0 ? ($completedVisits / $totalVisits) * 100 : 0;
            $daysUntilExpiry = $contract->end_date ? Carbon::now()->diffInDays($contract->end_date, false) : null;
            
            if ($daysUntilExpiry !== null && $daysUntilExpiry < 0) {
                $distribution['expired']++;
            } elseif ($daysUntilExpiry !== null && $daysUntilExpiry <= 7) {
                $distribution['critical']++;
            } elseif ($completionRate >= 80) {
                $distribution['healthy']++;
            } elseif ($completionRate >= 60) {
                $distribution['warning']++;
            } else {
                $distribution['poor']++;
            }
        }
        
        return $distribution;
    }
}