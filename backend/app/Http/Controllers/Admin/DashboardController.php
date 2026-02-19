<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\Plan;
use App\Models\User;
use App\Models\Subscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DashboardController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            // Get all dashboard data
            $overview = $this->getOverviewStats();
            $revenue = $this->getRevenueStats();
            $recentActivity = $this->getRecentActivity();
            $growth = $this->getGrowthStats();

            return response()->json([
                'overview' => $overview,
                'revenue' => $revenue,
                'recent_activity' => $recentActivity,
                'growth' => $growth,
                'timestamp' => now()->toISOString(),
            ]);
        } catch (\Exception $e) {
            Log::error('Dashboard index failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return response()->json([
                'error' => 'Failed to load dashboard data',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    private function getOverviewStats(): array
    {
        try {
            $totalTenants = Tenant::count();
            $activeTenants = Tenant::where('status', 'active')->count();
            $totalUsers = User::whereNotNull('tenant_id')->count();
            
            // Check if subscriptions table exists and has data
            $totalRevenue = 0;
            $monthlyRevenue = 0;
            
            try {
                $totalRevenue = Subscription::where('payment_status', 'paid')->sum('amount') ?? 0;
                $monthlyRevenue = Subscription::where('payment_status', 'paid')
                    ->whereMonth('created_at', now()->month)
                    ->sum('amount') ?? 0;
            } catch (\Exception $e) {
                // Subscriptions table might not exist or have issues
                \Log::warning('Subscription queries failed: ' . $e->getMessage());
            }

            return [
                'total_tenants' => $totalTenants,
                'active_tenants' => $activeTenants,
                'total_users' => $totalUsers,
                'total_revenue' => $totalRevenue,
                'monthly_revenue' => $monthlyRevenue,
            ];
        } catch (\Exception $e) {
            \Log::error('Dashboard overview stats failed: ' . $e->getMessage());
            return [
                'total_tenants' => 0,
                'active_tenants' => 0,
                'total_users' => 0,
                'total_revenue' => 0,
                'monthly_revenue' => 0,
            ];
        }
    }

    private function getRevenueStats(): array
    {
        try {
            $monthlyRevenue = Subscription::select(
                    DB::raw('MONTH(created_at) as month'),
                    DB::raw('YEAR(created_at) as year'),
                    DB::raw('SUM(amount) as total')
                )
                ->where('payment_status', 'paid')
                ->where('created_at', '>=', now()->subMonths(12))
                ->groupBy('year', 'month')
                ->orderBy('year', 'desc')
                ->orderBy('month', 'desc')
                ->get();

            $planRevenue = Plan::select('plans.name', DB::raw('SUM(subscriptions.amount) as total'))
                ->join('subscriptions', 'plans.id', '=', 'subscriptions.plan_id')
                ->where('subscriptions.payment_status', 'paid')
                ->groupBy('plans.id', 'plans.name')
                ->orderBy('total', 'desc')
                ->get();

            return [
                'monthly' => $monthlyRevenue,
                'by_plan' => $planRevenue,
            ];
        } catch (\Exception $e) {
            \Log::error('Revenue stats failed: ' . $e->getMessage());
            return [
                'monthly' => [],
                'by_plan' => [],
            ];
        }
    }

    private function getGrowthStats(): array
    {
        try {
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
            ];
        } catch (\Exception $e) {
            Log::error('Growth stats failed: ' . $e->getMessage());
            return [
                'tenants' => [],
                'users' => [],
            ];
        }
    }

    private function getRecentActivity(): array
    {
        try {
            $recentTenants = Tenant::latest()
                ->limit(5)
                ->get();

            $recentSubscriptions = [];
            try {
                $recentSubscriptions = Subscription::with(['tenant', 'plan'])
                    ->latest()
                    ->limit(5)
                    ->get();
            } catch (\Exception $e) {
                \Log::warning('Recent subscriptions query failed: ' . $e->getMessage());
            }

            return [
                'tenants' => $recentTenants,
                'subscriptions' => $recentSubscriptions,
            ];
        } catch (\Exception $e) {
            \Log::error('Recent activity failed: ' . $e->getMessage());
            return [
                'tenants' => [],
                'subscriptions' => [],
            ];
        }
    }

    public function tenantMetrics(): JsonResponse
    {
        $metrics = [
            'status_distribution' => Tenant::select('status', DB::raw('COUNT(*) as count'))
                ->groupBy('status')
                ->get(),
            'plan_distribution' => Plan::select('plans.name', DB::raw('COUNT(tenants.id) as count'))
                ->leftJoin('tenants', 'plans.id', '=', 'tenants.plan_id')
                ->groupBy('plans.id', 'plans.name')
                ->get(),
            'trial_status' => [
                'on_trial' => Tenant::whereNotNull('trial_ends_at')
                    ->where('trial_ends_at', '>', now())
                    ->count(),
                'trial_expired' => Tenant::whereNotNull('trial_ends_at')
                    ->where('trial_ends_at', '<=', now())
                    ->count(),
            ],
        ];

        return response()->json($metrics);
    }
}