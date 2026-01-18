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

        // Get actual business data - FILTERED BY TENANT
        $productsCount = \App\Models\Product::where('tenant_id', $tenantId)->count();
        $customersCount = \App\Models\Customer::where('tenant_id', $tenantId)->count();
        $salesCount = \App\Models\Sale::where('tenant_id', $tenantId)->count();
        $staffCount = User::where('tenant_id', $tenantId)->count();
        
        // Calculate today's sales - FILTERED BY TENANT
        $todaysSales = \App\Models\Sale::where('tenant_id', $tenantId)
            ->whereDate('created_at', today())
            ->sum('total_amount');
        
        // Calculate low stock products - FILTERED BY TENANT
        $lowStockCount = \App\Models\Product::where('tenant_id', $tenantId)
            ->whereRaw('stock_quantity <= min_stock_level')
            ->count();
        
        // Get recent sales for display - FILTERED BY TENANT
        $recentSales = \App\Models\Sale::where('tenant_id', $tenantId)
            ->with(['customer'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
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

        // Get low stock products - FILTERED BY TENANT
        $lowStockProducts = \App\Models\Product::where('tenant_id', $tenantId)
            ->whereRaw('stock_quantity <= min_stock_level')
            ->limit(5)
            ->get()
            ->map(function ($product) {
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'sku' => $product->sku,
                    'stock_quantity' => $product->stock_quantity,
                    'min_stock_level' => $product->min_stock_level,
                    'unit' => $product->unit ?? 'pcs',
                ];
            });

        // If this is a new tenant with no data, provide sample/demo data
        if ($productsCount == 0 && $salesCount == 0 && $customersCount == 0) {
            $stats = [
                'tenant' => $user->tenant->load('plan'),
                'posts_count' => 0, // Keep for backward compatibility
                'projects_count' => 0, // Keep for backward compatibility
                'users_count' => $staffCount,
                'published_posts' => 0, // Keep for backward compatibility
                'active_projects' => 0, // Keep for backward compatibility
                
                // Business metrics with sample data for new accounts
                'products_count' => 12,
                'customers_count' => 8,
                'sales_count' => 15,
                'todays_sales' => 1250.00, // Always a number
                'low_stock_count' => 3,
                'monthly_revenue' => 18500.00,
                'weekly_sales' => [
                    ['day' => 'Mon', 'sales' => 850],
                    ['day' => 'Tue', 'sales' => 1200],
                    ['day' => 'Wed', 'sales' => 950],
                    ['day' => 'Thu', 'sales' => 1400],
                    ['day' => 'Fri', 'sales' => 1800],
                    ['day' => 'Sat', 'sales' => 2200],
                    ['day' => 'Sun', 'sales' => 1100],
                ],
                'recent_sales' => [
                    [
                        'id' => 1,
                        'sale_number' => 'S-000001',
                        'customer_name' => 'Ahmed Al-Rashid',
                        'total_amount' => '125.50',
                        'payment_method' => 'Card',
                        'created_at' => now()->subHours(2)->format('Y-m-d H:i:s'),
                    ],
                    [
                        'id' => 2,
                        'sale_number' => 'S-000002',
                        'customer_name' => 'Sarah Johnson',
                        'total_amount' => '89.25',
                        'payment_method' => 'Cash',
                        'created_at' => now()->subHours(4)->format('Y-m-d H:i:s'),
                    ],
                    [
                        'id' => 3,
                        'sale_number' => 'S-000003',
                        'customer_name' => 'Mohammed Hassan',
                        'total_amount' => '245.00',
                        'payment_method' => 'Card',
                        'created_at' => now()->subHours(6)->format('Y-m-d H:i:s'),
                    ],
                ],
                'low_stock_products' => [
                    [
                        'id' => 1,
                        'name' => 'Wireless Headphones',
                        'sku' => 'WH-001',
                        'stock_quantity' => 3,
                        'min_stock_level' => 5,
                        'unit' => 'pcs',
                    ],
                    [
                        'id' => 2,
                        'name' => 'USB Cable Type-C',
                        'sku' => 'USB-TC-001',
                        'stock_quantity' => 2,
                        'min_stock_level' => 10,
                        'unit' => 'pcs',
                    ],
                    [
                        'id' => 3,
                        'name' => 'Phone Screen Protector',
                        'sku' => 'SP-001',
                        'stock_quantity' => 1,
                        'min_stock_level' => 8,
                        'unit' => 'pcs',
                    ],
                ],
                'is_demo_data' => true,
            ];
        } else {
            // Return actual data for established businesses
            $stats = [
                'tenant' => $user->tenant->load('plan'),
                'posts_count' => Post::where('tenant_id', $tenantId)->count(),
                'projects_count' => Project::where('tenant_id', $tenantId)->count(),
                'users_count' => $staffCount,
                'published_posts' => Post::where('tenant_id', $tenantId)->where('status', 'published')->count(),
                'active_projects' => Project::where('tenant_id', $tenantId)->where('status', 'active')->count(),
                
                // Actual business metrics
                'products_count' => $productsCount,
                'customers_count' => $customersCount,
                'sales_count' => $salesCount,
                'todays_sales' => (float) $todaysSales, // Ensure it's always a number
                'low_stock_count' => $lowStockCount,
                'recent_sales' => $recentSales,
                'low_stock_products' => $lowStockProducts,
                'is_demo_data' => false,
            ];
        }

        return response()->json($stats);
    }
}