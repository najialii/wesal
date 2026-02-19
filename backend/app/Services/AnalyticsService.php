<?php

namespace App\Services;

use App\Models\Tenant;
use App\Models\Plan;
use App\Models\User;
use App\Models\Subscription;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class AnalyticsService
{
    public function getOverviewStats(): array
    {
        return Cache::remember('admin.analytics.overview', 300, function () {
            return [
                'total_tenants' => Tenant::count(),
                'active_tenants' => Tenant::where('status', 'active')->count(),
                'suspended_tenants' => Tenant::where('status', 'suspended')->count(),
                'cancelled_tenants' => Tenant::where('status', 'cancelled')->count(),
                'total_users' => User::whereNotNull('tenant_id')->count(),
                'total_revenue' => Subscription::where('payment_status', 'paid')->sum('amount'),
                'monthly_revenue' => Subscription::where('payment_status', 'paid')
                    ->whereMonth('created_at', now()->month)
                    ->whereYear('created_at', now()->year)
                    ->sum('amount'),
                'trial_tenants' => Tenant::whereNotNull('trial_ends_at')
                    ->where('trial_ends_at', '>', now())->count(),
                'recent_tenants' => Tenant::where('created_at', '>=', now()->subDays(30))->count(),
                'avg_revenue_per_tenant' => $this->getAverageRevenuePerTenant(),
                'churn_rate' => $this->getChurnRate(),
                'growth_rate' => $this->getGrowthRate(),
            ];
        });
    }

    public function getRevenueStats(): array
    {
        return Cache::remember('admin.analytics.revenue', 300, function () {
            $monthlyRevenue = Subscription::select(
                    DB::raw('MONTH(created_at) as month'),
                    DB::raw('YEAR(created_at) as year'),
                    DB::raw('SUM(amount) as total'),
                    DB::raw('COUNT(*) as count')
                )
                ->where('payment_status', 'paid')
                ->where('created_at', '>=', now()->subMonths(12))
                ->groupBy('year', 'month')
                ->orderBy('year', 'desc')
                ->orderBy('month', 'desc')
                ->get();

            $planRevenue = Plan::select('plans.name', 'plans.id', DB::raw('SUM(subscriptions.amount) as total'), DB::raw('COUNT(subscriptions.id) as count'))
                ->join('subscriptions', 'plans.id', '=', 'subscriptions.plan_id')
                ->where('subscriptions.payment_status', 'paid')
                ->groupBy('plans.id', 'plans.name')
                ->orderBy('total', 'desc')
                ->get();

            return [
                'monthly' => $monthlyRevenue,
                'by_plan' => $planRevenue,
                'total_mrr' => $this->getMonthlyRecurringRevenue(),
                'arr' => $this->getAnnualRecurringRevenue(),
                'revenue_growth' => $this->getRevenueGrowthRate(),
            ];
        });
    }

    public function getGrowthStats(): array
    {
        return Cache::remember('admin.analytics.growth', 300, function () {
            $tenantGrowth = Tenant::select(
                    DB::raw('DATE(created_at) as date'),
                    DB::raw('COUNT(*) as count')
                )
                ->where('created_at', '>=', now()->subDays(30))
                ->groupBy('date')
                ->orderBy('date')
                ->get();

            $userGrowth = User::select(
                    DB::raw('DATE(created_at) as date'),
                    DB::raw('COUNT(*) as count')
                )
                ->whereNotNull('tenant_id')
                ->where('created_at', '>=', now()->subDays(30))
                ->groupBy('date')
                ->orderBy('date')
                ->get();

            return [
                'tenants' => $tenantGrowth,
                'users' => $userGrowth,
                'tenant_growth_rate' => $this->calculateGrowthRate($tenantGrowth),
                'user_growth_rate' => $this->calculateGrowthRate($userGrowth),
            ];
        });
    }

    public function getRecentActivity(): array
    {
        return [
            'tenants' => Tenant::with(['plan', 'creator'])
                ->latest()
                ->limit(10)
                ->get(),
            'subscriptions' => Subscription::with(['tenant', 'plan'])
                ->latest()
                ->limit(10)
                ->get(),
            'users' => User::with(['tenant'])
                ->whereNotNull('tenant_id')
                ->latest()
                ->limit(10)
                ->get(),
        ];
    }

    public function getPerformanceMetrics(): array
    {
        return Cache::remember('admin.analytics.performance', 600, function () {
            return [
                'avg_session_duration' => $this->getAverageSessionDuration(),
                'active_users_today' => $this->getActiveUsersToday(),
                'active_users_week' => $this->getActiveUsersWeek(),
                'active_users_month' => $this->getActiveUsersMonth(),
                'feature_usage' => $this->getFeatureUsageStats(),
                'system_load' => $this->getSystemLoadMetrics(),
            ];
        });
    }

    public function getTenantMetrics(array $filters = []): array
    {
        $query = Tenant::with(['plan', 'subscriptions']);

        if (!empty($filters['date_from'])) {
            $query->where('created_at', '>=', $filters['date_from']);
        }

        if (!empty($filters['date_to'])) {
            $query->where('created_at', '<=', $filters['date_to']);
        }

        if (!empty($filters['plan_id'])) {
            $query->where('plan_id', $filters['plan_id']);
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        $tenants = $query->get();

        return [
            'status_distribution' => $tenants->groupBy('status')->map->count(),
            'plan_distribution' => $tenants->groupBy('plan.name')->map->count(),
            'trial_status' => [
                'on_trial' => $tenants->filter(function ($tenant) {
                    return $tenant->trial_ends_at && $tenant->trial_ends_at > now();
                })->count(),
                'trial_expired' => $tenants->filter(function ($tenant) {
                    return $tenant->trial_ends_at && $tenant->trial_ends_at <= now();
                })->count(),
            ],
            'revenue_by_tenant' => $this->getRevenueByTenant($tenants),
            'usage_metrics' => $this->getUsageMetricsByTenant($tenants),
        ];
    }

    public function getRevenueAnalytics(string $period, string $groupBy = 'month'): array
    {
        $dateFrom = $this->getPeriodStartDate($period);
        
        $query = Subscription::select(
                $this->getDateGrouping($groupBy),
                DB::raw('SUM(amount) as revenue'),
                DB::raw('COUNT(*) as subscriptions'),
                DB::raw('COUNT(DISTINCT tenant_id) as unique_tenants')
            )
            ->where('payment_status', 'paid')
            ->where('created_at', '>=', $dateFrom)
            ->groupBy(DB::raw($this->getDateGrouping($groupBy, false)))
            ->orderBy(DB::raw($this->getDateGrouping($groupBy, false)));

        return [
            'data' => $query->get(),
            'summary' => [
                'total_revenue' => Subscription::where('payment_status', 'paid')
                    ->where('created_at', '>=', $dateFrom)
                    ->sum('amount'),
                'total_subscriptions' => Subscription::where('payment_status', 'paid')
                    ->where('created_at', '>=', $dateFrom)
                    ->count(),
                'avg_revenue_per_subscription' => $this->getAverageRevenuePerSubscription($dateFrom),
            ],
        ];
    }

    public function getUserAnalytics(array $filters = []): array
    {
        $query = User::whereNotNull('tenant_id');

        if (!empty($filters['date_from'])) {
            $query->where('created_at', '>=', $filters['date_from']);
        }

        if (!empty($filters['date_to'])) {
            $query->where('created_at', '<=', $filters['date_to']);
        }

        if (!empty($filters['tenant_id'])) {
            $query->where('tenant_id', $filters['tenant_id']);
        }

        return [
            'total_users' => $query->count(),
            'active_users' => $query->where('last_login_at', '>=', now()->subDays(30))->count(),
            'new_users_today' => $query->whereDate('created_at', today())->count(),
            'new_users_week' => $query->where('created_at', '>=', now()->subWeek())->count(),
            'new_users_month' => $query->where('created_at', '>=', now()->subMonth())->count(),
            'user_growth' => $this->getUserGrowthTrend($filters),
            'user_activity' => $this->getUserActivityMetrics($filters),
        ];
    }

    public function generateReport(string $type, string $format, array $options = []): array
    {
        $data = $this->getReportData($type, $options);
        $filename = $this->generateReportFilename($type, $format);
        
        // In a real implementation, you would generate the actual file here
        // For now, we'll return a mock response
        return [
            'url' => "/admin/reports/download/{$filename}",
            'filename' => $filename,
            'expires_at' => now()->addHours(24),
            'size' => count($data) * 1024, // Mock size
        ];
    }

    public function getSystemHealth(): array
    {
        return [
            'database' => $this->checkDatabaseHealth(),
            'cache' => $this->checkCacheHealth(),
            'storage' => $this->checkStorageHealth(),
            'queue' => $this->checkQueueHealth(),
            'overall_status' => 'healthy', // This would be calculated based on individual checks
        ];
    }

    public function getRealTimeMetrics(): array
    {
        return [
            'active_sessions' => $this->getActiveSessionsCount(),
            'current_load' => $this->getCurrentSystemLoad(),
            'memory_usage' => $this->getMemoryUsage(),
            'response_time' => $this->getAverageResponseTime(),
            'error_rate' => $this->getErrorRate(),
        ];
    }

    // Private helper methods

    private function getAverageRevenuePerTenant(): float
    {
        $totalRevenue = Subscription::where('payment_status', 'paid')->sum('amount');
        $totalTenants = Tenant::count();
        
        return $totalTenants > 0 ? $totalRevenue / $totalTenants : 0;
    }

    private function getChurnRate(): float
    {
        $cancelledThisMonth = Tenant::where('status', 'cancelled')
            ->whereMonth('updated_at', now()->month)
            ->count();
        
        $totalTenantsStartOfMonth = Tenant::where('created_at', '<', now()->startOfMonth())->count();
        
        return $totalTenantsStartOfMonth > 0 ? ($cancelledThisMonth / $totalTenantsStartOfMonth) * 100 : 0;
    }

    private function getGrowthRate(): float
    {
        $currentMonth = Tenant::whereMonth('created_at', now()->month)->count();
        $lastMonth = Tenant::whereMonth('created_at', now()->subMonth()->month)->count();
        
        return $lastMonth > 0 ? (($currentMonth - $lastMonth) / $lastMonth) * 100 : 0;
    }

    private function getMonthlyRecurringRevenue(): float
    {
        return Subscription::where('payment_status', 'paid')
            ->whereMonth('created_at', now()->month)
            ->sum('amount');
    }

    private function getAnnualRecurringRevenue(): float
    {
        return $this->getMonthlyRecurringRevenue() * 12;
    }

    private function getRevenueGrowthRate(): float
    {
        $currentMonth = $this->getMonthlyRecurringRevenue();
        $lastMonth = Subscription::where('payment_status', 'paid')
            ->whereMonth('created_at', now()->subMonth()->month)
            ->sum('amount');
        
        return $lastMonth > 0 ? (($currentMonth - $lastMonth) / $lastMonth) * 100 : 0;
    }

    private function calculateGrowthRate($data): float
    {
        if ($data->count() < 2) return 0;
        
        $latest = $data->last()->count;
        $previous = $data->first()->count;
        
        return $previous > 0 ? (($latest - $previous) / $previous) * 100 : 0;
    }

    private function getPeriodStartDate(string $period): Carbon
    {
        return match ($period) {
            '7d' => now()->subDays(7),
            '30d' => now()->subDays(30),
            '90d' => now()->subDays(90),
            '1y' => now()->subYear(),
            default => now()->subYears(10),
        };
    }

    private function getDateGrouping(string $groupBy, bool $withAlias = true): string
    {
        $grouping = match ($groupBy) {
            'day' => 'DATE(created_at)',
            'week' => 'YEARWEEK(created_at)',
            'month' => 'YEAR(created_at), MONTH(created_at)',
            'year' => 'YEAR(created_at)',
            default => 'YEAR(created_at), MONTH(created_at)',
        };

        return $withAlias ? "{$grouping} as period" : $grouping;
    }

    private function getAverageRevenuePerSubscription(Carbon $dateFrom): float
    {
        $subscriptions = Subscription::where('payment_status', 'paid')
            ->where('created_at', '>=', $dateFrom);
        
        $count = $subscriptions->count();
        $total = $subscriptions->sum('amount');
        
        return $count > 0 ? $total / $count : 0;
    }

    private function getRevenueByTenant($tenants): array
    {
        return $tenants->map(function ($tenant) {
            return [
                'tenant_id' => $tenant->id,
                'tenant_name' => $tenant->name,
                'revenue' => $tenant->subscriptions->where('payment_status', 'paid')->sum('amount'),
            ];
        })->toArray();
    }

    private function getUsageMetricsByTenant($tenants): array
    {
        // Mock implementation - in real app, this would query actual usage data
        return $tenants->map(function ($tenant) {
            return [
                'tenant_id' => $tenant->id,
                'tenant_name' => $tenant->name,
                'users_count' => $tenant->users()->count(),
                'last_activity' => $tenant->users()->max('last_login_at'),
            ];
        })->toArray();
    }

    private function getUserGrowthTrend(array $filters): array
    {
        // Mock implementation
        return [
            'daily' => [],
            'weekly' => [],
            'monthly' => [],
        ];
    }

    private function getUserActivityMetrics(array $filters): array
    {
        // Mock implementation
        return [
            'avg_session_duration' => 1800, // 30 minutes
            'pages_per_session' => 5.2,
            'bounce_rate' => 0.25,
        ];
    }

    private function getReportData(string $type, array $options): array
    {
        // Mock implementation - would generate actual report data
        return [];
    }

    private function generateReportFilename(string $type, string $format): string
    {
        return "{$type}_report_" . now()->format('Y-m-d_H-i-s') . ".{$format}";
    }

    // System health check methods
    private function checkDatabaseHealth(): array
    {
        try {
            DB::select('SELECT 1');
            return ['status' => 'healthy', 'response_time' => 5];
        } catch (\Exception $e) {
            return ['status' => 'unhealthy', 'error' => $e->getMessage()];
        }
    }

    private function checkCacheHealth(): array
    {
        try {
            Cache::put('health_check', 'ok', 10);
            $value = Cache::get('health_check');
            return ['status' => $value === 'ok' ? 'healthy' : 'unhealthy'];
        } catch (\Exception $e) {
            return ['status' => 'unhealthy', 'error' => $e->getMessage()];
        }
    }

    private function checkStorageHealth(): array
    {
        // Mock implementation
        return ['status' => 'healthy', 'free_space' => '85%'];
    }

    private function checkQueueHealth(): array
    {
        // Mock implementation
        return ['status' => 'healthy', 'pending_jobs' => 0];
    }

    // Real-time metrics methods
    private function getActiveSessionsCount(): int
    {
        // Mock implementation
        return rand(50, 200);
    }

    private function getCurrentSystemLoad(): float
    {
        // Mock implementation
        return round(rand(10, 80) / 100, 2);
    }

    private function getMemoryUsage(): array
    {
        // Mock implementation
        return [
            'used' => '2.1GB',
            'total' => '8GB',
            'percentage' => 26.25,
        ];
    }

    private function getAverageResponseTime(): float
    {
        // Mock implementation
        return round(rand(50, 300) / 100, 2);
    }

    private function getErrorRate(): float
    {
        // Mock implementation
        return round(rand(0, 5) / 100, 3);
    }

    private function getAverageSessionDuration(): int
    {
        // Mock implementation - returns seconds
        return rand(900, 3600); // 15 minutes to 1 hour
    }

    private function getActiveUsersToday(): int
    {
        return User::whereNotNull('tenant_id')
            ->whereDate('last_login_at', today())
            ->count();
    }

    private function getActiveUsersWeek(): int
    {
        return User::whereNotNull('tenant_id')
            ->where('last_login_at', '>=', now()->subWeek())
            ->count();
    }

    private function getActiveUsersMonth(): int
    {
        return User::whereNotNull('tenant_id')
            ->where('last_login_at', '>=', now()->subMonth())
            ->count();
    }

    private function getFeatureUsageStats(): array
    {
        // Mock implementation
        return [
            'pos_usage' => rand(60, 95),
            'inventory_usage' => rand(40, 80),
            'reports_usage' => rand(20, 60),
            'maintenance_usage' => rand(10, 40),
        ];
    }

    private function getSystemLoadMetrics(): array
    {
        // Mock implementation
        return [
            'cpu_usage' => rand(10, 80),
            'memory_usage' => rand(20, 70),
            'disk_usage' => rand(30, 60),
            'network_io' => rand(5, 50),
        ];
    }
}