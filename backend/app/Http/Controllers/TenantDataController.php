<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class TenantDataController extends Controller
{
    public function posts(Request $request): JsonResponse
    {
        // Posts are automatically scoped to the current user's tenant
        $posts = Post::with(['author', 'tenant'])
            ->when($request->get('status'), function ($query, $status) {
                return $query->where('status', $status);
            })
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return response()->json($posts);
    }

    public function projects(Request $request): JsonResponse
    {
        // Projects are automatically scoped to the current user's tenant
        $projects = Project::with(['manager', 'tenant'])
            ->when($request->get('status'), function ($query, $status) {
                return $query->where('status', $status);
            })
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return response()->json($projects);
    }

    public function users(Request $request): JsonResponse
    {
        // Get users for the current tenant
        $users = User::where('tenant_id', auth()->user()->tenant_id)
            ->with('tenant')
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return response()->json($users);
    }

    public function createPost(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'status' => 'in:draft,published',
        ]);

        // tenant_id is automatically set by the BelongsToTenant trait
        $post = Post::create([
            ...$validated,
            'author_id' => auth()->id(),
            'published_at' => $validated['status'] === 'published' ? now() : null,
        ]);

        return response()->json([
            'message' => 'Post created successfully',
            'post' => $post->load(['author', 'tenant'])
        ], 201);
    }

    public function createProject(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'in:planning,active,completed,cancelled',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after:start_date',
        ]);

        // tenant_id is automatically set by the BelongsToTenant trait
        $project = Project::create([
            ...$validated,
            'manager_id' => auth()->id(),
        ]);

        return response()->json([
            'message' => 'Project created successfully',
            'project' => $project->load(['manager', 'tenant'])
        ], 201);
    }

    public function tenantStats(): JsonResponse
    {
        $user = auth()->user();
        
        if (!$user->tenant_id) {
            return response()->json(['message' => 'No tenant associated'], 403);
        }

        $tenantId = $user->tenant_id;
        
        // Get current branch from session or user's default branch
        $currentBranchId = session('current_branch_id');
        $branch = null;
        
        if ($currentBranchId) {
            $branch = \App\Models\Branch::find($currentBranchId);
        } else {
            // Get user's default branch
            $branch = $user->getDefaultBranch();
            $currentBranchId = $branch ? $branch->id : null;
        }

        // Get actual business data - FILTERED BY TENANT AND BRANCH
        $productsQuery = \App\Models\Product::where('tenant_id', $tenantId);
        if ($currentBranchId) {
            $productsQuery->whereHas('branches', function($query) use ($currentBranchId) {
                $query->where('branches.id', $currentBranchId);
            });
        }
        $productsCount = $productsQuery->count();
            
        $customersCount = \App\Models\Customer::where('tenant_id', $tenantId)->count();
        
        $salesQuery = \App\Models\Sale::where('tenant_id', $tenantId);
        if ($currentBranchId) {
            $salesQuery->where('branch_id', $currentBranchId);
        }
        $salesCount = $salesQuery->count();
            
        $staffQuery = User::where('tenant_id', $tenantId);
        if ($currentBranchId) {
            $staffQuery->whereHas('branches', function($query) use ($currentBranchId) {
                $query->where('branches.id', $currentBranchId);
            });
        }
        $staffCount = $staffQuery->count();
        
        // Calculate today's sales - FILTERED BY TENANT AND BRANCH
        $todaysSalesQuery = \App\Models\Sale::where('tenant_id', $tenantId)
            ->whereDate('created_at', today());
        if ($currentBranchId) {
            $todaysSalesQuery->where('branch_id', $currentBranchId);
        }
        $todaysSales = $todaysSalesQuery->sum('total_amount');
        
        // Calculate monthly revenue - FILTERED BY TENANT AND BRANCH
        $monthlyRevenueQuery = \App\Models\Sale::where('tenant_id', $tenantId)
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year);
        if ($currentBranchId) {
            $monthlyRevenueQuery->where('branch_id', $currentBranchId);
        }
        $monthlyRevenue = $monthlyRevenueQuery->sum('total_amount');
        
        // Calculate low stock products - FILTERED BY TENANT AND BRANCH
        $lowStockQuery = \App\Models\Product::where('tenant_id', $tenantId)
            ->whereRaw('stock_quantity <= min_stock_level');
        if ($currentBranchId) {
            $lowStockQuery->whereHas('branches', function($query) use ($currentBranchId) {
                $query->where('branches.id', $currentBranchId)
                      ->whereRaw('branch_product.stock_quantity <= branch_product.min_stock_level');
            });
        }
        $lowStockCount = $lowStockQuery->count();
        
        // Get recent sales for display - FILTERED BY TENANT AND BRANCH
        $recentSalesQuery = \App\Models\Sale::where('tenant_id', $tenantId)
            ->with(['customer'])
            ->orderBy('created_at', 'desc')
            ->limit(5);
        if ($currentBranchId) {
            $recentSalesQuery->where('branch_id', $currentBranchId);
        }
        $recentSales = $recentSalesQuery->get()
            ->map(function ($sale) {
                return [
                    'id' => $sale->id,
                    'sale_number' => $sale->sale_number ?? 'S-' . str_pad($sale->id, 6, '0', STR_PAD_LEFT),
                    'customer_name' => $sale->customer->name ?? 'Walk-in Customer',
                    'total_amount' => number_format($sale->total_amount, 2),
                    'payment_method' => $sale->payment_method ?? 'Cash',
                    'created_at' => $sale->created_at->format('Y-m-d H:i:s'),
                ];
            });

        // Get low stock products - FILTERED BY TENANT AND BRANCH
        $lowStockProductsQuery = \App\Models\Product::where('tenant_id', $tenantId)
            ->whereRaw('stock_quantity <= min_stock_level')
            ->limit(5);
        if ($currentBranchId) {
            $lowStockProductsQuery->whereHas('branches', function($query) use ($currentBranchId) {
                $query->where('branches.id', $currentBranchId)
                      ->whereRaw('branch_product.stock_quantity <= branch_product.min_stock_level');
            });
        }
        $lowStockProducts = $lowStockProductsQuery->get()
            ->map(function ($product) use ($currentBranchId) {
                // Get branch-specific stock if branch is selected
                $stockQuantity = $currentBranchId ? $product->getStockForBranch($currentBranchId) : $product->stock_quantity;
                $minStockLevel = $currentBranchId ? 
                    ($product->branches()->where('branches.id', $currentBranchId)->first()->pivot->min_stock_level ?? 0) : 
                    $product->min_stock_level;
                
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'sku' => $product->sku,
                    'stock_quantity' => $stockQuantity,
                    'min_stock_level' => $minStockLevel,
                    'unit' => $product->unit ?? 'pcs',
                ];
            });

        // Get weekly sales data - FILTERED BY TENANT AND BRANCH
        $weeklyData = [];
        $startOfWeek = now()->startOfWeek();
        for ($i = 0; $i < 7; $i++) {
            $date = $startOfWeek->copy()->addDays($i);
            $salesQuery = \App\Models\Sale::where('tenant_id', $tenantId)
                ->whereDate('created_at', $date);
            if ($currentBranchId) {
                $salesQuery->where('branch_id', $currentBranchId);
            }
            $sales = $salesQuery->sum('total_amount');
            
            $weeklyData[] = [
                'day' => $date->format('D'),
                'sales' => (float) $sales
            ];
        }

        // Get monthly trends - FILTERED BY TENANT AND BRANCH
        $monthlyTrends = [];
        for ($i = 5; $i >= 0; $i--) {
            $date = now()->subMonths($i);
            $revenueQuery = \App\Models\Sale::where('tenant_id', $tenantId)
                ->whereMonth('created_at', $date->month)
                ->whereYear('created_at', $date->year);
            if ($currentBranchId) {
                $revenueQuery->where('branch_id', $currentBranchId);
            }
            $revenue = $revenueQuery->sum('total_amount');
            
            $ordersQuery = \App\Models\Sale::where('tenant_id', $tenantId)
                ->whereMonth('created_at', $date->month)
                ->whereYear('created_at', $date->year);
            if ($currentBranchId) {
                $ordersQuery->where('branch_id', $currentBranchId);
            }
            $orders = $ordersQuery->count();
            
            $monthlyTrends[] = [
                'month' => $date->format('M'),
                'revenue' => (float) $revenue,
                'orders' => $orders
            ];
        }

        // Get maintenance data if applicable
        $pendingMaintenance = 0;
        $completedMaintenanceToday = 0;
        
        if (class_exists('\App\Models\MaintenanceVisit')) {
            try {
                $pendingQuery = \App\Models\MaintenanceVisit::where('tenant_id', $tenantId)
                    ->where('status', 'scheduled');
                if ($currentBranchId) {
                    $pendingQuery->where('branch_id', $currentBranchId);
                }
                $pendingMaintenance = $pendingQuery->count();
                    
                $completedQuery = \App\Models\MaintenanceVisit::where('tenant_id', $tenantId)
                    ->where('status', 'completed')
                    ->whereDate('updated_at', today());
                if ($currentBranchId) {
                    $completedQuery->where('branch_id', $currentBranchId);
                }
                $completedMaintenanceToday = $completedQuery->count();
            } catch (\Exception $e) {
                \Log::warning('Maintenance stats query failed: ' . $e->getMessage());
            }
        }

        // Return only real data - no mock data
        $stats = [
            'tenant' => $user->tenant->load('plan'),
            'current_branch' => $branch ? [
                'id' => $branch->id,
                'name' => $branch->name,
                'code' => $branch->code
            ] : null,
            'posts_count' => Post::where('tenant_id', $tenantId)->count(),
            'projects_count' => Project::where('tenant_id', $tenantId)->count(),
            'users_count' => $staffCount,
            'published_posts' => Post::where('tenant_id', $tenantId)->where('status', 'published')->count(),
            'active_projects' => Project::where('tenant_id', $tenantId)->where('status', 'active')->count(),
            
            // Branch-scoped business metrics - REAL DATA ONLY
            'products_count' => $productsCount,
            'customers_count' => $customersCount,
            'sales_count' => $salesCount,
            'todays_sales' => (float) $todaysSales,
            'monthly_revenue' => (float) $monthlyRevenue,
            'low_stock_count' => $lowStockCount,
            'pending_maintenance' => $pendingMaintenance,
            'completed_maintenance_today' => $completedMaintenanceToday,
            'recent_sales' => $recentSales,
            'low_stock_products' => $lowStockProducts,
            'weekly_sales' => $weeklyData,
            'monthly_trends' => $monthlyTrends,
        ];

        return response()->json($stats);
    }
}