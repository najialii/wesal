<?php

namespace App\Services;

use App\Services\Maintenance\MaintenanceAnalyticsService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class MaintenanceMetricsService
{
    public function __construct(
        private MaintenanceAnalyticsService $analyticsService,
        private MaintenanceLoggerService $logger
    ) {}

    /**
     * Get real-time business metrics dashboard
     */
    public function getBusinessMetricsDashboard(): array
    {
        $tracking = $this->logger->startPerformanceTracking('business_metrics_dashboard');

        try {
            $metrics = [
                'overview' => $this->getOverviewMetrics(),
                'performance' => $this->getPerformanceMetrics(),
                'financial' => $this->getFinancialMetrics(),
                'operational' => $this->getOperationalMetrics(),
                'alerts' => $this->getActiveAlerts(),
                'trends' => $this->getTrendMetrics(),
            ];

            // Log business metrics
            $this->logger->logBusinessMetric('dashboard_generated', 1, [
                'metrics_count' => count($metrics),
                'overview_contracts' => $metrics['overview']['total_contracts'] ?? 0,
            ]);

            return $metrics;
        } finally {
            $this->logger->endPerformanceTracking($tracking);
        }
    }

    /**
     * Get overview metrics
     */
    private function getOverviewMetrics(): array
    {
        return Cache::remember('maintenance_overview_metrics', now()->addMinutes(5), function () {
            $contractMetrics = $this->analyticsService->getContractHealthMetrics();
            $slaMetrics = $this->analyticsService->getSLAMetrics();

            return [
                'total_contracts' => $contractMetrics['total_contracts'],
                'active_contracts' => $contractMetrics['active_contracts'],
                'expiring_soon' => $contractMetrics['expiring_soon'],
                'completion_rate' => $slaMetrics['metrics']['completion_rate'],
                'on_time_rate' => $slaMetrics['metrics']['on_time_rate'],
            ];
        });
    }

    /**
     * Get performance metrics
     */
    private function getPerformanceMetrics(): array
    {
        return Cache::remember('maintenance_performance_metrics', now()->addMinutes(10), function () {
            $technicianMetrics = $this->analyticsService->getTechnicianPerformance();
            $slaMetrics = $this->analyticsService->getSLAMetrics();

            return [
                'average_completion_rate' => $technicianMetrics['summary']['average_completion_rate'],
                'average_response_time' => $slaMetrics['metrics']['average_response_time_hours'],
                'average_visit_duration' => $slaMetrics['metrics']['average_visit_duration_minutes'],
                'technician_productivity' => $this->calculateTechnicianProductivity(),
            ];
        });
    }

    /**
     * Get financial metrics
     */
    private function getFinancialMetrics(): array
    {
        return Cache::remember('maintenance_financial_metrics', now()->addMinutes(15), function () {
            $revenueMetrics = $this->analyticsService->getRevenueAnalytics();
            $technicianMetrics = $this->analyticsService->getTechnicianPerformance();

            return [
                'total_revenue' => $revenueMetrics['summary']['total_revenue'],
                'average_visit_value' => $revenueMetrics['summary']['average_visit_value'],
                'revenue_per_technician' => $technicianMetrics['summary']['total_revenue'] / max($technicianMetrics['summary']['total_technicians'], 1),
                'monthly_recurring_revenue' => $this->calculateMonthlyRecurringRevenue(),
            ];
        });
    }

    /**
     * Get operational metrics
     */
    private function getOperationalMetrics(): array
    {
        return Cache::remember('maintenance_operational_metrics', now()->addMinutes(5), function () {
            $slaMetrics = $this->analyticsService->getSLAMetrics();
            
            return [
                'total_visits_today' => $this->getTodayVisitsCount(),
                'overdue_visits' => $slaMetrics['visits']['overdue'],
                'parts_utilization' => $this->calculatePartsUtilization(),
                'schedule_efficiency' => $this->calculateScheduleEfficiency(),
            ];
        });
    }

    /**
     * Get active alerts
     */
    private function getActiveAlerts(): array
    {
        $alerts = [];

        // Contract expiration alerts
        $expiringContracts = DB::table('maintenance_contracts')
            ->where('status', 'active')
            ->whereNotNull('end_date')
            ->whereBetween('end_date', [now(), now()->addDays(7)])
            ->count();

        if ($expiringContracts > 0) {
            $alerts[] = [
                'type' => 'warning',
                'title' => 'Contracts Expiring Soon',
                'message' => "{$expiringContracts} contracts expire within 7 days",
                'action' => 'review_expiring_contracts',
            ];
        }

        // Overdue visits alerts
        $overdueVisits = DB::table('maintenance_visits')
            ->where('status', 'scheduled')
            ->where('scheduled_date', '<', now()->startOfDay())
            ->count();

        if ($overdueVisits > 0) {
            $alerts[] = [
                'type' => 'error',
                'title' => 'Overdue Visits',
                'message' => "{$overdueVisits} visits are overdue",
                'action' => 'review_overdue_visits',
            ];
        }

        // Low completion rate alert
        $slaMetrics = $this->analyticsService->getSLAMetrics();
        if ($slaMetrics['metrics']['completion_rate'] < 80) {
            $alerts[] = [
                'type' => 'warning',
                'title' => 'Low Completion Rate',
                'message' => "Completion rate is {$slaMetrics['metrics']['completion_rate']}%",
                'action' => 'review_performance',
            ];
        }

        return $alerts;
    }

    /**
     * Get trend metrics
     */
    private function getTrendMetrics(): array
    {
        return Cache::remember('maintenance_trend_metrics', now()->addMinutes(30), function () {
            $completionRates = $this->analyticsService->getVisitCompletionRates('week');
            
            // Calculate trends
            $recentRates = array_slice($completionRates, -4); // Last 4 weeks
            $trend = $this->calculateTrend($recentRates, 'completion_rate');

            return [
                'completion_rate_trend' => $trend,
                'revenue_trend' => $this->calculateRevenueTrend(),
                'contract_growth_trend' => $this->calculateContractGrowthTrend(),
            ];
        });
    }

    /**
     * Calculate technician productivity
     */
    private function calculateTechnicianProductivity(): float
    {
        $result = DB::table('maintenance_visits')
            ->where('status', 'completed')
            ->where('scheduled_date', '>=', now()->subMonth())
            ->selectRaw('
                COUNT(*) as total_visits,
                COUNT(DISTINCT assigned_technician_id) as active_technicians
            ')
            ->first();

        if (!$result || $result->active_technicians == 0) {
            return 0;
        }

        return round($result->total_visits / $result->active_technicians, 2);
    }

    /**
     * Calculate monthly recurring revenue
     */
    private function calculateMonthlyRecurringRevenue(): float
    {
        $monthlyContracts = DB::table('maintenance_contracts')
            ->where('status', 'active')
            ->where('frequency', 'monthly')
            ->sum('contract_value');

        $quarterlyContracts = DB::table('maintenance_contracts')
            ->where('status', 'active')
            ->where('frequency', 'quarterly')
            ->sum('contract_value');

        $annualContracts = DB::table('maintenance_contracts')
            ->where('status', 'active')
            ->where('frequency', 'annual')
            ->sum('contract_value');

        return $monthlyContracts + ($quarterlyContracts / 3) + ($annualContracts / 12);
    }

    /**
     * Get today's visits count
     */
    private function getTodayVisitsCount(): int
    {
        return DB::table('maintenance_visits')
            ->whereDate('scheduled_date', now()->toDateString())
            ->count();
    }

    /**
     * Calculate parts utilization
     */
    private function calculatePartsUtilization(): float
    {
        $totalParts = DB::table('maintenance_visit_items')
            ->where('created_at', '>=', now()->subMonth())
            ->sum('quantity_used');

        $availableParts = DB::table('products')
            ->where('is_spare_part', true)
            ->where('is_active', true)
            ->sum('stock_quantity');

        if ($availableParts == 0) {
            return 0;
        }

        return round(($totalParts / ($totalParts + $availableParts)) * 100, 2);
    }

    /**
     * Calculate schedule efficiency
     */
    private function calculateScheduleEfficiency(): float
    {
        $result = DB::table('maintenance_visits')
            ->where('scheduled_date', '>=', now()->subMonth())
            ->selectRaw('
                COUNT(*) as total_visits,
                SUM(CASE WHEN status = "completed" AND DATE(completed_at) = DATE(scheduled_date) THEN 1 ELSE 0 END) as on_time_visits
            ')
            ->first();

        if (!$result || $result->total_visits == 0) {
            return 0;
        }

        return round(($result->on_time_visits / $result->total_visits) * 100, 2);
    }

    /**
     * Calculate trend from data points
     */
    private function calculateTrend(array $dataPoints, string $valueKey): array
    {
        if (count($dataPoints) < 2) {
            return ['direction' => 'stable', 'percentage' => 0];
        }

        $values = array_column($dataPoints, $valueKey);
        $first = reset($values);
        $last = end($values);

        if ($first == 0) {
            return ['direction' => 'stable', 'percentage' => 0];
        }

        $percentage = (($last - $first) / $first) * 100;
        $direction = $percentage > 5 ? 'up' : ($percentage < -5 ? 'down' : 'stable');

        return [
            'direction' => $direction,
            'percentage' => round(abs($percentage), 1),
        ];
    }

    /**
     * Calculate revenue trend
     */
    private function calculateRevenueTrend(): array
    {
        $monthlyRevenue = DB::table('maintenance_visits')
            ->where('status', 'completed')
            ->where('completed_at', '>=', now()->subMonths(3))
            ->selectRaw('
                DATE_FORMAT(completed_at, "%Y-%m") as month,
                SUM(total_cost) as revenue
            ')
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->toArray();

        return $this->calculateTrend($monthlyRevenue, 'revenue');
    }

    /**
     * Calculate contract growth trend
     */
    private function calculateContractGrowthTrend(): array
    {
        $monthlyContracts = DB::table('maintenance_contracts')
            ->where('created_at', '>=', now()->subMonths(3))
            ->selectRaw('
                DATE_FORMAT(created_at, "%Y-%m") as month,
                COUNT(*) as contracts
            ')
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->toArray();

        return $this->calculateTrend($monthlyContracts, 'contracts');
    }
}