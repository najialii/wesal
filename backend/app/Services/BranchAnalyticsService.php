<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\Sale;
use App\Models\Product;
use App\Models\MaintenanceContract;
use App\Models\StockMovement;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class BranchAnalyticsService
{
    /**
     * Get metrics for a single branch
     */
    public function getBranchMetrics(int $branchId, Carbon $startDate, Carbon $endDate): array
    {
        $cacheKey = "branch_metrics_{$branchId}_{$startDate->format('Y-m-d')}_{$endDate->format('Y-m-d')}";
        
        return Cache::remember($cacheKey, now()->addMinutes(5), function () use ($branchId, $startDate, $endDate) {
            $branch = Branch::findOrFail($branchId);

            // Sales metrics
            $sales = Sale::where('branch_id', $branchId)
                        ->whereBetween('sale_date', [$startDate, $endDate])
                        ->get();

            $totalRevenue = $sales->sum('total_amount');
            $totalSales = $sales->count();
            $averageSaleValue = $totalSales > 0 ? $totalRevenue / $totalSales : 0;

            // Product metrics
            $productCount = $branch->products()->count();
            $lowStockProducts = $branch->products()
                ->wherePivot('stock_quantity', '<=', DB::raw('branch_product.min_stock_level'))
                ->count();

            $totalStockValue = $branch->products()
                ->get()
                ->sum(function ($product) use ($branchId) {
                    $stock = $product->getStockForBranch($branchId);
                    return $stock * $product->cost_price;
                });

            // Maintenance metrics
            $activeContracts = MaintenanceContract::where('branch_id', $branchId)
                ->where('status', 'active')
                ->count();

            $completedVisits = DB::table('maintenance_visits')
                ->where('branch_id', $branchId)
                ->where('status', 'completed')
                ->whereBetween('actual_end_time', [$startDate, $endDate])
                ->count();

            // Staff metrics
            $staffCount = $branch->users()->count();

            return [
                'branch' => [
                    'id' => $branch->id,
                    'name' => $branch->name,
                    'code' => $branch->code,
                ],
                'period' => [
                    'start' => $startDate->toDateString(),
                    'end' => $endDate->toDateString(),
                ],
                'sales' => [
                    'total_revenue' => round($totalRevenue, 2),
                    'total_sales' => $totalSales,
                    'average_sale_value' => round($averageSaleValue, 2),
                ],
                'inventory' => [
                    'total_products' => $productCount,
                    'low_stock_products' => $lowStockProducts,
                    'total_stock_value' => round($totalStockValue, 2),
                ],
                'maintenance' => [
                    'active_contracts' => $activeContracts,
                    'completed_visits' => $completedVisits,
                ],
                'staff' => [
                    'total_staff' => $staffCount,
                ],
            ];
        });
    }

    /**
     * Compare metrics across multiple branches
     */
    public function compareBranches(array $branchIds, Carbon $startDate, Carbon $endDate): array
    {
        $comparison = [];

        foreach ($branchIds as $branchId) {
            $comparison[] = $this->getBranchMetrics($branchId, $startDate, $endDate);
        }

        // Add rankings
        $revenueRanking = collect($comparison)->sortByDesc('sales.total_revenue')->values()->all();
        $salesCountRanking = collect($comparison)->sortByDesc('sales.total_sales')->values()->all();

        return [
            'branches' => $comparison,
            'rankings' => [
                'by_revenue' => array_map(fn($b) => $b['branch']['id'], $revenueRanking),
                'by_sales_count' => array_map(fn($b) => $b['branch']['id'], $salesCountRanking),
            ],
            'period' => [
                'start' => $startDate->toDateString(),
                'end' => $endDate->toDateString(),
            ],
        ];
    }

    /**
     * Get consolidated metrics across all branches for a tenant
     */
    public function getConsolidatedMetrics(int $tenantId, Carbon $startDate, Carbon $endDate): array
    {
        $cacheKey = "consolidated_metrics_{$tenantId}_{$startDate->format('Y-m-d')}_{$endDate->format('Y-m-d')}";
        
        return Cache::remember($cacheKey, now()->addMinutes(5), function () use ($tenantId, $startDate, $endDate) {
            $branches = Branch::where('tenant_id', $tenantId)->active()->get();
            $branchIds = $branches->pluck('id')->toArray();

            // Aggregate sales across all branches
            $sales = Sale::whereIn('branch_id', $branchIds)
                        ->whereBetween('sale_date', [$startDate, $endDate])
                        ->get();

            $totalRevenue = $sales->sum('total_amount');
            $totalSales = $sales->count();
            $averageSaleValue = $totalSales > 0 ? $totalRevenue / $totalSales : 0;

            // Aggregate product metrics
            $totalProducts = DB::table('branch_product')
                ->whereIn('branch_id', $branchIds)
                ->distinct('product_id')
                ->count('product_id');

            $totalStockValue = DB::table('branch_product')
                ->join('products', 'branch_product.product_id', '=', 'products.id')
                ->whereIn('branch_id', $branchIds)
                ->sum(DB::raw('branch_product.stock_quantity * products.cost_price'));

            $lowStockProducts = DB::table('branch_product')
                ->whereIn('branch_id', $branchIds)
                ->whereRaw('stock_quantity <= min_stock_level')
                ->count();

            // Aggregate maintenance metrics
            $activeContracts = MaintenanceContract::whereIn('branch_id', $branchIds)
                ->where('status', 'active')
                ->count();

            $completedVisits = DB::table('maintenance_visits')
                ->whereIn('branch_id', $branchIds)
                ->where('status', 'completed')
                ->whereBetween('actual_end_time', [$startDate, $endDate])
                ->count();

            // Staff metrics
            $totalStaff = DB::table('branch_user')
                ->whereIn('branch_id', $branchIds)
                ->distinct('user_id')
                ->count('user_id');

            // Per-branch breakdown
            $branchBreakdown = [];
            foreach ($branches as $branch) {
                $branchSales = Sale::where('branch_id', $branch->id)
                    ->whereBetween('sale_date', [$startDate, $endDate])
                    ->sum('total_amount');

                $branchBreakdown[] = [
                    'branch_id' => $branch->id,
                    'branch_name' => $branch->name,
                    'revenue' => round($branchSales, 2),
                    'percentage' => $totalRevenue > 0 ? round(($branchSales / $totalRevenue) * 100, 2) : 0,
                ];
            }

            return [
                'period' => [
                    'start' => $startDate->toDateString(),
                    'end' => $endDate->toDateString(),
                ],
                'summary' => [
                    'total_branches' => $branches->count(),
                    'total_revenue' => round($totalRevenue, 2),
                    'total_sales' => $totalSales,
                    'average_sale_value' => round($averageSaleValue, 2),
                    'total_products' => $totalProducts,
                    'total_stock_value' => round($totalStockValue, 2),
                    'low_stock_products' => $lowStockProducts,
                    'active_contracts' => $activeContracts,
                    'completed_visits' => $completedVisits,
                    'total_staff' => $totalStaff,
                ],
                'branch_breakdown' => $branchBreakdown,
            ];
        });
    }

    /**
     * Get sales trend for a branch
     */
    public function getSalesTrend(int $branchId, Carbon $startDate, Carbon $endDate, string $groupBy = 'day'): array
    {
        $dateFormat = match($groupBy) {
            'hour' => '%Y-%m-%d %H:00:00',
            'day' => '%Y-%m-%d',
            'week' => '%Y-%u',
            'month' => '%Y-%m',
            'year' => '%Y',
            default => '%Y-%m-%d',
        };

        $trend = Sale::where('branch_id', $branchId)
            ->whereBetween('sale_date', [$startDate, $endDate])
            ->select(
                DB::raw("DATE_FORMAT(sale_date, '{$dateFormat}') as period"),
                DB::raw('COUNT(*) as sales_count'),
                DB::raw('SUM(total_amount) as revenue')
            )
            ->groupBy('period')
            ->orderBy('period')
            ->get();

        return $trend->map(function ($item) {
            return [
                'period' => $item->period,
                'sales_count' => $item->sales_count,
                'revenue' => round($item->revenue, 2),
            ];
        })->toArray();
    }

    /**
     * Get top selling products for a branch
     */
    public function getTopProducts(int $branchId, Carbon $startDate, Carbon $endDate, int $limit = 10): array
    {
        return DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->where('sales.branch_id', $branchId)
            ->whereBetween('sales.sale_date', [$startDate, $endDate])
            ->select(
                'products.id',
                'products.name',
                DB::raw('SUM(sale_items.quantity) as total_quantity'),
                DB::raw('SUM(sale_items.total_amount) as total_revenue')
            )
            ->groupBy('products.id', 'products.name')
            ->orderByDesc('total_revenue')
            ->limit($limit)
            ->get()
            ->map(function ($item) {
                return [
                    'product_id' => $item->id,
                    'product_name' => $item->name,
                    'quantity_sold' => $item->total_quantity,
                    'revenue' => round($item->total_revenue, 2),
                ];
            })
            ->toArray();
    }

    /**
     * Clear analytics cache for a branch
     */
    public function clearCache(int $branchId): void
    {
        Cache::tags(['branch_analytics', "branch_{$branchId}"])->flush();
    }

    /**
     * Clear all analytics cache for a tenant
     */
    public function clearTenantCache(int $tenantId): void
    {
        Cache::tags(['branch_analytics', "tenant_{$tenantId}"])->flush();
    }
}
