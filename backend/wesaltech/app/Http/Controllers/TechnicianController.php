<?php

namespace App\Http\Controllers;

use App\Models\MaintenanceVisit;
use App\Models\MaintenanceProduct;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class TechnicianController extends Controller
{
    /**
     * Get the branch IDs the technician has access to
     */
    private function getTechnicianBranchIds()
    {
        $technician = Auth::user();
        
        // Get branches assigned to this technician
        $branchIds = $technician->branches()->pluck('branches.id')->toArray();
        
        // If no specific branches assigned, they have no access (strict mode)
        return $branchIds;
    }

    /**
     * Get dashboard statistics for technician
     */
    public function dashboard()
    {
        $technician = Auth::user();
        $today = Carbon::today();
        $branchIds = $this->getTechnicianBranchIds();

        // Build base query with branch filtering
        $baseQuery = MaintenanceVisit::where(function($query) use ($technician) {
                $query->where('assigned_technician_id', $technician->id)
                      ->orWhereHas('contract', function($q) use ($technician) {
                          $q->where('assigned_technician_id', $technician->id);
                      });
            });
        
        // Apply branch filter if technician has specific branches
        if (!empty($branchIds)) {
            $baseQuery->where(function($q) use ($branchIds) {
                $q->whereIn('branch_id', $branchIds)
                  ->orWhereHas('contract', function($cq) use ($branchIds) {
                      $cq->whereIn('branch_id', $branchIds);
                  });
            });
        }

        $todayVisits = (clone $baseQuery)
            ->whereDate('scheduled_date', $today)
            ->get();

        $stats = [
            'today_visits_count' => $todayVisits->count(),
            'completed_today' => $todayVisits->where('status', 'completed')->count(),
            'pending_today' => $todayVisits->whereIn('status', ['scheduled', 'in_progress'])->count(),
            'in_progress' => $todayVisits->where('status', 'in_progress')->count(),
            'next_visit' => (clone $baseQuery)
                ->where('status', 'scheduled')
                ->where('scheduled_date', '>=', now())
                ->orderBy('scheduled_date')
                ->orderBy('scheduled_time')
                ->with(['contract.customer', 'contract.product', 'branch'])
                ->first(),
            'today_visits' => $todayVisits->load(['contract.customer', 'contract.product', 'branch']),
            'branch_ids' => $branchIds,
        ];

        return response()->json($stats);
    }

    /**
     * Get all visits assigned to technician
     */
    public function getVisits(Request $request)
    {
        $technician = Auth::user();
        $branchIds = $this->getTechnicianBranchIds();
        
        $query = MaintenanceVisit::where(function($q) use ($technician) {
            $q->where('assigned_technician_id', $technician->id)
              ->orWhereHas('contract', function($cq) use ($technician) {
                  $cq->where('assigned_technician_id', $technician->id);
              });
        });

        // Apply branch filter
        if (!empty($branchIds)) {
            $query->where(function($q) use ($branchIds) {
                $q->whereIn('branch_id', $branchIds)
                  ->orWhereHas('contract', function($cq) use ($branchIds) {
                      $cq->whereIn('branch_id', $branchIds);
                  });
            });
        }

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->has('start_date')) {
            $query->whereDate('scheduled_date', '>=', $request->start_date);
        }
        if ($request->has('end_date')) {
            $query->whereDate('scheduled_date', '<=', $request->end_date);
        }

        if (!$request->has('start_date') && !$request->has('end_date')) {
            $query->whereDate('scheduled_date', '>=', Carbon::today());
        }

        $visits = $query->with(['contract.customer', 'contract.product', 'items.maintenanceProduct', 'branch'])
            ->orderBy('scheduled_date')
            ->orderBy('scheduled_time')
            ->get();

        return response()->json([
            'visits' => $visits,
            'total' => $visits->count(),
        ]);
    }

    /**
     * Get today's visits
     */
    public function getTodayVisits()
    {
        $technician = Auth::user();
        $branchIds = $this->getTechnicianBranchIds();
        
        $query = MaintenanceVisit::where(function($q) use ($technician) {
                $q->where('assigned_technician_id', $technician->id)
                  ->orWhereHas('contract', function($cq) use ($technician) {
                      $cq->where('assigned_technician_id', $technician->id);
                  });
            })
            ->whereDate('scheduled_date', Carbon::today());

        if (!empty($branchIds)) {
            $query->where(function($q) use ($branchIds) {
                $q->whereIn('branch_id', $branchIds)
                  ->orWhereHas('contract', function($cq) use ($branchIds) {
                      $cq->whereIn('branch_id', $branchIds);
                  });
            });
        }

        $visits = $query->with(['contract.customer', 'contract.product', 'items.maintenanceProduct', 'branch'])
            ->orderBy('scheduled_time')
            ->get();

        return response()->json([
            'visits' => $visits,
            'total' => $visits->count(),
        ]);
    }

    /**
     * Get single visit details
     */
    public function getVisit($id)
    {
        $technician = Auth::user();
        $branchIds = $this->getTechnicianBranchIds();
        
        $query = MaintenanceVisit::where('id', $id)
            ->where(function($q) use ($technician) {
                $q->where('assigned_technician_id', $technician->id)
                  ->orWhereHas('contract', function($cq) use ($technician) {
                      $cq->where('assigned_technician_id', $technician->id);
                  });
            });

        if (!empty($branchIds)) {
            $query->where(function($q) use ($branchIds) {
                $q->whereIn('branch_id', $branchIds)
                  ->orWhereHas('contract', function($cq) use ($branchIds) {
                      $cq->whereIn('branch_id', $branchIds);
                  });
            });
        }

        $visit = $query->with(['contract.customer', 'contract.product', 'items.maintenanceProduct', 'assignedTechnician', 'branch'])
            ->firstOrFail();

        return response()->json($visit);
    }

    /**
     * Start a visit
     */
    public function startVisit($id)
    {
        $technician = Auth::user();
        $branchIds = $this->getTechnicianBranchIds();
        
        $query = MaintenanceVisit::where('id', $id)
            ->where(function($q) use ($technician) {
                $q->where('assigned_technician_id', $technician->id)
                  ->orWhereHas('contract', function($cq) use ($technician) {
                      $cq->where('assigned_technician_id', $technician->id);
                  });
            });

        if (!empty($branchIds)) {
            $query->where(function($q) use ($branchIds) {
                $q->whereIn('branch_id', $branchIds)
                  ->orWhereHas('contract', function($cq) use ($branchIds) {
                      $cq->whereIn('branch_id', $branchIds);
                  });
            });
        }

        $visit = $query->firstOrFail();

        if ($visit->status !== 'scheduled') {
            return response()->json([
                'message' => 'Visit cannot be started. Current status: ' . $visit->status
            ], 400);
        }

        $visit->update([
            'status' => 'in_progress',
            'actual_start_time' => now(),
        ]);

        return response()->json([
            'message' => 'Visit started successfully',
            'visit' => $visit->load(['contract.customer', 'contract.product', 'items.maintenanceProduct', 'branch']),
        ]);
    }

    /**
     * Complete a visit
     */
    public function completeVisit(Request $request, $id)
    {
        $request->validate([
            'completion_notes' => 'required|string|min:10',
            'products' => 'nullable|array',
            'products.*.product_id' => 'required|exists:maintenance_products,id',
            'products.*.quantity' => 'required|integer|min:1',
        ]);

        $technician = Auth::user();
        $branchIds = $this->getTechnicianBranchIds();
        
        $query = MaintenanceVisit::where('id', $id)
            ->where(function($q) use ($technician) {
                $q->where('assigned_technician_id', $technician->id)
                  ->orWhereHas('contract', function($cq) use ($technician) {
                      $cq->where('assigned_technician_id', $technician->id);
                  });
            });

        if (!empty($branchIds)) {
            $query->where(function($q) use ($branchIds) {
                $q->whereIn('branch_id', $branchIds)
                  ->orWhereHas('contract', function($cq) use ($branchIds) {
                      $cq->whereIn('branch_id', $branchIds);
                  });
            });
        }

        $visit = $query->firstOrFail();

        if ($visit->status !== 'in_progress') {
            return response()->json([
                'message' => 'Visit cannot be completed. Current status: ' . $visit->status
            ], 400);
        }

        DB::beginTransaction();
        try {
            $visit->update([
                'status' => 'completed',
                'actual_end_time' => now(),
                'completion_notes' => $request->completion_notes,
            ]);

            if ($request->has('products') && !empty($request->products)) {
                foreach ($request->products as $productData) {
                    $product = MaintenanceProduct::findOrFail($productData['product_id']);
                    $quantity = $productData['quantity'];

                    $visit->items()->create([
                        'tenant_id' => $technician->tenant_id,
                        'maintenance_product_id' => $product->id,
                        'quantity_used' => $quantity,
                        'unit_cost' => $product->cost,
                    ]);
                }

                $visit->update(['total_cost' => $visit->calculateTotalCost()]);
            }

            DB::commit();

            return response()->json([
                'message' => 'Visit completed successfully',
                'visit' => $visit->load(['contract.customer', 'contract.product', 'items.maintenanceProduct', 'branch']),
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to complete visit',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get products/parts inventory - shows spare parts available in technician's branch
     */
    public function getProducts(Request $request)
    {
        $technician = Auth::user();
        $branchIds = $this->getTechnicianBranchIds();
        
        // Get spare parts from Product model that are available in technician's branches
        $query = Product::where('tenant_id', $technician->tenant_id)
            ->where('is_active', true)
            ->where('is_spare_part', true);

        // Filter by branches the technician has access to
        if (!empty($branchIds)) {
            $query->whereHas('branches', function($q) use ($branchIds) {
                $q->whereIn('branches.id', $branchIds)
                  ->where('branch_product.is_active', true)
                  ->where('branch_product.stock_quantity', '>', 0);
            });
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%");
            });
        }

        // Get products with branch-specific stock info
        $products = $query->with(['category', 'branches' => function($q) use ($branchIds) {
            if (!empty($branchIds)) {
                $q->whereIn('branches.id', $branchIds);
            }
        }])->orderBy('name')->get();

        // Transform products to include branch-specific stock
        $transformedProducts = $products->map(function($product) use ($branchIds) {
            $branchStock = 0;
            $minStockLevel = $product->min_stock_level;
            
            // Sum stock from all accessible branches
            foreach ($product->branches as $branch) {
                if (empty($branchIds) || in_array($branch->id, $branchIds)) {
                    $branchStock += $branch->pivot->stock_quantity;
                    // Use branch-specific min stock level if available
                    if ($branch->pivot->min_stock_level) {
                        $minStockLevel = $branch->pivot->min_stock_level;
                    }
                }
            }

            return [
                'id' => $product->id,
                'name' => $product->name,
                'sku' => $product->sku,
                'selling_price' => $product->selling_price,
                'stock_quantity' => $branchStock,
                'min_stock_level' => $minStockLevel,
                'category' => $product->category ? ['name' => $product->category->name] : null,
            ];
        })->filter(function($product) {
            // Only show products with stock > 0
            return $product['stock_quantity'] > 0;
        })->values();

        return response()->json([
            'products' => $transformedProducts,
            'total' => $transformedProducts->count(),
        ]);
    }

    /**
     * Get visit history (completed visits)
     */
    public function getHistory(Request $request)
    {
        $technician = Auth::user();
        $branchIds = $this->getTechnicianBranchIds();
        
        $query = MaintenanceVisit::where(function($q) use ($technician) {
                $q->where('assigned_technician_id', $technician->id)
                  ->orWhereHas('contract', function($cq) use ($technician) {
                      $cq->where('assigned_technician_id', $technician->id);
                  });
            })
            ->where('status', 'completed');

        if (!empty($branchIds)) {
            $query->where(function($q) use ($branchIds) {
                $q->whereIn('branch_id', $branchIds)
                  ->orWhereHas('contract', function($cq) use ($branchIds) {
                      $cq->whereIn('branch_id', $branchIds);
                  });
            });
        }

        if ($request->has('start_date')) {
            $query->whereDate('scheduled_date', '>=', $request->start_date);
        }
        if ($request->has('end_date')) {
            $query->whereDate('scheduled_date', '<=', $request->end_date);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->whereHas('contract.customer', function($cq) use ($search) {
                    $cq->where('name', 'like', "%{$search}%");
                })
                ->orWhereHas('contract', function($cq) use ($search) {
                    $cq->where('customer_name', 'like', "%{$search}%");
                });
            });
        }

        $visits = $query->with(['contract.customer', 'contract.product', 'items.maintenanceProduct', 'branch'])
            ->orderBy('scheduled_date', 'desc')
            ->orderBy('scheduled_time', 'desc')
            ->paginate(20);

        return response()->json($visits);
    }

    /**
     * Get performance metrics
     */
    public function getMetrics(Request $request)
    {
        $technician = Auth::user();
        $branchIds = $this->getTechnicianBranchIds();
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth());
        $endDate = $request->input('end_date', Carbon::now()->endOfMonth());

        $query = MaintenanceVisit::where('assigned_technician_id', $technician->id)
            ->whereBetween('scheduled_date', [$startDate, $endDate]);

        if (!empty($branchIds)) {
            $query->whereIn('branch_id', $branchIds);
        }

        $visits = $query->get();
        $completedVisits = $visits->where('status', 'completed');

        $avgCompletionTime = $completedVisits->filter(function($visit) {
            return $visit->actual_start_time && $visit->actual_end_time;
        })->avg(function($visit) {
            return Carbon::parse($visit->actual_end_time)
                ->diffInMinutes(Carbon::parse($visit->actual_start_time));
        });

        $metrics = [
            'total_visits' => $visits->count(),
            'completed_visits' => $completedVisits->count(),
            'cancelled_visits' => $visits->where('status', 'cancelled')->count(),
            'completion_rate' => $visits->count() > 0 
                ? round(($completedVisits->count() / $visits->count()) * 100, 1) 
                : 0,
            'avg_completion_time_minutes' => round($avgCompletionTime ?? 0),
            'total_parts_used' => $completedVisits->sum(function($visit) {
                return $visit->items->sum('quantity_used');
            }),
            'total_revenue' => $completedVisits->sum('total_cost'),
        ];

        return response()->json($metrics);
    }
}
