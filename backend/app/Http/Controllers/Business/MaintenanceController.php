<?php

namespace App\Http\Controllers\Business;

use App\Http\Controllers\Controller;
use App\Services\Maintenance\ContractService;
use App\Services\Maintenance\VisitSchedulingService;
use App\Services\Maintenance\VisitExecutionService;
use App\Services\Maintenance\MaintenanceAnalyticsService;
use App\Models\MaintenanceContract;
use App\Models\MaintenanceVisit;
use App\Models\MaintenanceProduct;
use App\Models\Worker;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class MaintenanceController extends Controller
{
    public function __construct(
        private ContractService $contractService,
        private VisitSchedulingService $visitSchedulingService,
        private VisitExecutionService $visitExecutionService,
        private MaintenanceAnalyticsService $analyticsService
    ) {}

    /**
     * Handle contract expiration
     */
    public function handleExpiration(Request $request, $contractId)
    {
        try {
            $results = $this->contractService->handleContractExpiration($contractId);
            
            return response()->json([
                'message' => 'Contract expiration handled successfully',
                'results' => $results
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to handle contract expiration',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create contract renewal
     */
    public function createRenewal(Request $request, $contractId)
    {
        $request->validate([
            'start_date' => 'required|date|after:today',
            'end_date' => 'nullable|date|after:start_date',
            'frequency' => 'nullable|string|in:daily,weekly,bi_weekly,monthly,quarterly,semi_annual,annual',
            'contract_value' => 'nullable|numeric|min:0',
            'special_instructions' => 'nullable|string|max:1000',
        ]);

        try {
            $renewalData = $request->only([
                'start_date', 'end_date', 'frequency', 'frequency_value', 
                'frequency_unit', 'contract_value', 'special_instructions'
            ]);

            $newContract = $this->contractService->createRenewalWorkflow($contractId, $renewalData);
            
            return response()->json([
                'message' => 'Contract renewal created successfully',
                'contract' => $newContract
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create contract renewal',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get expiring contracts
     */
    public function getExpiringContracts(Request $request)
    {
        try {
            $days = $request->input('days', 30);
            $contracts = $this->contractService->getExpiringContracts($days);
            
            return response()->json([
                'contracts' => $contracts,
                'total' => $contracts->count()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch expiring contracts',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function index(Request $request)
    {
        $user = auth()->user();
        $query = MaintenanceVisit::with(['contract.product', 'contract.customer', 'assignedTechnician'])
                                ->orderBy('scheduled_date', 'asc');

        // Filter by branch for technicians
        if ($user->hasRole('technician')) {
            $userBranchIds = $user->branches()->pluck('branches.id');
            $query->whereIn('branch_id', $userBranchIds);
        } elseif (!$user->hasRole('owner')) {
            // For non-owners (managers, staff), filter by active branch
            $branchId = session('active_branch_id');
            if ($branchId) {
                $query->where('branch_id', $branchId);
            }
        }

        // Apply filters
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->has('worker_id') && $request->worker_id) {
            $query->where('assigned_technician_id', $request->worker_id);
        }

        if ($request->has('priority') && $request->priority !== 'all') {
            $query->where('priority', $request->priority);
        }

        if ($request->has('date_from') && $request->date_from) {
            $query->where('scheduled_date', '>=', $request->date_from);
        }

        if ($request->has('date_to') && $request->date_to) {
            $query->where('scheduled_date', '<=', $request->date_to);
        }

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->whereHas('contract', function ($q) use ($search) {
                $q->where('customer_name', 'like', "%{$search}%")
                  ->orWhereHas('product', function ($pq) use ($search) {
                      $pq->where('name', 'like', "%{$search}%");
                  });
            });
        }

        $visits = $query->paginate(20);

        // Use analytics service for stats
        $stats = $this->analyticsService->getBranchMetrics();

        return response()->json([
            'visits' => $visits,
            'stats' => $stats,
        ]);
    }

    public function dashboard()
    {
        // Use analytics service for comprehensive dashboard data
        $stats = $this->analyticsService->getBranchMetrics();
        
        // Use scheduling service for upcoming visits
        $upcomingVisits = $this->visitSchedulingService->getUpcomingVisits(7);
        $overdueVisits = $this->visitSchedulingService->getOverdueVisits();

        $todayVisits = MaintenanceVisit::with(['contract.product', 'assignedTechnician'])
                                      ->today()
                                      ->get();

        return response()->json([
            'stats' => $stats,
            'upcoming_visits' => $upcomingVisits,
            'overdue_visits' => $overdueVisits,
            'today_visits' => $todayVisits,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'maintenance_contract_id' => 'required|exists:maintenance_contracts,id',
            'scheduled_date' => 'required|date',
            'scheduled_time' => 'nullable|date_format:H:i',
            'assigned_technician_id' => 'nullable|exists:users,id',
            'priority' => 'required|in:low,medium,high,urgent',
            'work_description' => 'nullable|string',
            'branch_id' => 'nullable|exists:branches,id',
        ]);

        // Get branch_id - use provided branch_id or get from contract or user's default branch
        $branchId = $request->branch_id;
        
        if (!$branchId) {
            // Try to get branch from the maintenance contract
            $contract = \App\Models\MaintenanceContract::find($request->maintenance_contract_id);
            $branchId = $contract?->branch_id;
            
            // If still no branch, get user's default branch
            if (!$branchId) {
                $user = auth()->user();
                $defaultBranch = $user->getDefaultBranch();
                $branchId = $defaultBranch?->id;
                
                // If still no branch, get the first branch for this tenant
                if (!$branchId) {
                    $firstBranch = \App\Models\Branch::where('tenant_id', $user->tenant_id)->first();
                    $branchId = $firstBranch?->id;
                }
            }
        }

        $visit = MaintenanceVisit::create([
            'tenant_id' => auth()->user()->tenant_id,
            'maintenance_contract_id' => $request->maintenance_contract_id,
            'scheduled_date' => $request->scheduled_date,
            'scheduled_time' => $request->scheduled_time,
            'assigned_technician_id' => $request->assigned_technician_id,
            'priority' => $request->priority,
            'work_description' => $request->work_description,
            'branch_id' => $branchId,
            'status' => 'scheduled',
        ]);

        return response()->json([
            'message' => 'Maintenance visit scheduled successfully',
            'visit' => $visit->load(['contract.product', 'assignedTechnician']),
        ]);
    }

    public function show($id)
    {
        \Log::info('Fetching visit details', [
            'visit_id' => $id,
            'user_id' => auth()->id(),
            'user_tenant_id' => auth()->user()->tenant_id,
        ]);
        
        // Try to find the visit with explicit tenant check
        $maintenanceVisit = MaintenanceVisit::with([
            'contract.product', 
            'contract.customer',
            'contract.assignedTechnician',
            'assignedTechnician',
            'items.maintenanceProduct'
        ])->find($id);
        
        if (!$maintenanceVisit) {
            \Log::warning('Visit not found', [
                'visit_id' => $id,
                'user_tenant_id' => auth()->user()->tenant_id,
            ]);
            
            return response()->json([
                'error' => 'Visit not found or you do not have permission to view it',
                'visit_id' => $id,
            ], 404);
        }
        
        \Log::info('Visit found', [
            'visit_id' => $maintenanceVisit->id,
            'visit_tenant_id' => $maintenanceVisit->tenant_id,
            'has_contract' => !!$maintenanceVisit->contract,
            'contract_id' => $maintenanceVisit->maintenance_contract_id,
            'has_product' => !!$maintenanceVisit->contract?->product,
        ]);
        
        // Check if contract exists and has required data
        if (!$maintenanceVisit->contract) {
            \Log::error('Visit contract not found', [
                'visit_id' => $maintenanceVisit->id,
                'contract_id' => $maintenanceVisit->maintenance_contract_id,
            ]);
            
            return response()->json([
                'error' => 'Visit contract not found',
                'visit' => $maintenanceVisit,
                'debug' => [
                    'visit_id' => $maintenanceVisit->id,
                    'contract_id' => $maintenanceVisit->maintenance_contract_id,
                    'tenant_id' => $maintenanceVisit->tenant_id,
                ]
            ], 404);
        }
        
        return response()->json(['visit' => $maintenanceVisit]);
    }

    public function update(Request $request, $id)
    {
        $visit = MaintenanceVisit::findOrFail($id);
        
        $request->validate([
            'scheduled_date' => 'sometimes|date',
            'scheduled_time' => 'nullable|date_format:H:i',
            'assigned_technician_id' => 'nullable|exists:users,id',
            'priority' => 'sometimes|in:low,medium,high,urgent',
            'work_description' => 'nullable|string',
            'status' => 'sometimes|in:scheduled,in_progress,completed,cancelled,missed',
        ]);

        $visit->update($request->only([
            'scheduled_date',
            'scheduled_time',
            'assigned_technician_id',
            'priority',
            'work_description',
            'status',
        ]));

        return response()->json([
            'message' => 'Maintenance visit updated successfully',
            'visit' => $visit->load(['contract.product', 'assignedTechnician']),
        ]);
    }

    public function startVisit($id)
    {
        try {
            $visit = $this->visitExecutionService->startVisit($id, auth()->id());
            
            return response()->json([
                'message' => 'Visit started successfully',
                'visit' => $visit->load(['contract.product', 'assignedTechnician']),
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function completeVisit(Request $request, $id)
    {
        $request->validate([
            'completion_notes' => 'nullable|string',
            'customer_feedback' => 'nullable|string',
            'customer_rating' => 'nullable|integer|min:1|max:5',
            'photos' => 'nullable|array',
            'photos.*' => 'string',
            'parts_used' => 'nullable|array',
            'parts_used.*.product_id' => 'required|exists:products,id',
            'parts_used.*.quantity' => 'required|integer|min:1',
            'parts_used.*.unit_price' => 'required|numeric|min:0',
            'parts_used.*.notes' => 'nullable|string',
        ]);

        try {
            $visit = $this->visitExecutionService->completeVisit($id, $request->all());

            return response()->json([
                'message' => 'Visit completed successfully',
                'visit' => $visit->load(['contract.product', 'assignedTechnician', 'items.product']),
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function reschedule(Request $request, $id)
    {
        $request->validate([
            'scheduled_date' => 'required|date|after:today',
            'reason' => 'nullable|string',
        ]);

        try {
            $visit = $this->visitSchedulingService->rescheduleVisit($id, Carbon::parse($request->scheduled_date));

            return response()->json([
                'message' => 'Visit rescheduled successfully',
                'visit' => $visit->load(['contract.product', 'assignedTechnician']),
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }
    public function cancel(Request $request, $id)
    {
        $request->validate([
            'reason' => 'nullable|string',
        ]);

        try {
            $visit = $this->visitExecutionService->updateVisitStatus($id, 'cancelled');

            return response()->json([
                'message' => 'Visit cancelled successfully',
                'visit' => $visit->load(['contract.product', 'assignedTechnician']),
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function getWorkers()
    {
        $workers = Worker::where('is_active', true)
                        ->select('id', 'name', 'job_title', 'phone')
                        ->get();

        return response()->json(['workers' => $workers]);
    }

    public function getMaintenanceProducts()
    {
        $products = MaintenanceProduct::select('id', 'name', 'sku', 'cost_price', 'stock_quantity', 'unit', 'type')
                                    ->where('is_active', true)
                                    ->get();

        return response()->json(['data' => $products]);
    }

    public function getContracts(Request $request)
    {
        $query = MaintenanceContract::with(['product', 'customer', 'assignedTechnician'])
                                  ->when($request->status, function ($q) use ($request) {
                                      if ($request->status === 'active') {
                                          $q->active();
                                      } else {
                                          $q->where('status', $request->status);
                                      }
                                  })
                                  ->when($request->search, function ($q) use ($request) {
                                      $search = $request->search;
                                      $q->where(function ($query) use ($search) {
                                          $query->where('customer_name', 'like', "%{$search}%")
                                                ->orWhereHas('customer', function ($cq) use ($search) {
                                                    $cq->where('name', 'like', "%{$search}%");
                                                })
                                                ->orWhereHas('product', function ($pq) use ($search) {
                                                    $pq->where('name', 'like', "%{$search}%");
                                                });
                                      });
                                  });

        $perPage = $request->get('per_page', 20);
        $contracts = $query->latest()->paginate($perPage);

        return response()->json(['data' => $contracts]);
    }

    public function storeContract(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'customer_id' => 'required|exists:customers,id',
            'assigned_technician_id' => 'required|exists:users,id',
            'frequency' => 'required|in:once,weekly,monthly,quarterly,semi_annual,annual,custom',
            'frequency_value' => 'required_if:frequency,custom|nullable|integer|min:1',
            'frequency_unit' => 'required_if:frequency,custom|nullable|in:days,weeks,months,years',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after:start_date',
            'contract_value' => 'nullable|numeric|min:0',
            'maintenance_products' => 'nullable|array',
            'maintenance_products.*.id' => 'required|exists:products,id',
            'maintenance_products.*.quantity' => 'required|numeric|min:0',
            'maintenance_products.*.unit_cost' => 'required|numeric|min:0',
            'special_instructions' => 'nullable|string',
            'status' => 'sometimes|in:active,paused,completed,cancelled',
            'branch_id' => 'nullable|exists:branches,id',
        ]);

        try {
            $contract = $this->contractService->createContract($request->all());

            return response()->json([
                'message' => 'Maintenance contract created successfully',
                'data' => $contract->load(['product', 'customer', 'assignedTechnician', 'items.product']),
            ], 201);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function showContract($contractId)
    {
        \Log::info('ShowContract called with ID: ' . $contractId);
        
        // Find the contract without tenant scoping first
        $contract = \App\Models\MaintenanceContract::withoutGlobalScope('tenant')->find($contractId);
        
        \Log::info('Contract found: ' . ($contract ? 'Yes' : 'No'));
        
        if (!$contract) {
            \Log::info('Contract not found, returning 404');
            return response()->json(['error' => 'Contract not found'], 404);
        }

        // Check if the current user has access to this contract's tenant
        $currentUser = auth()->user();
        \Log::info('Current user tenant: ' . $currentUser->tenant_id . ', Contract tenant: ' . $contract->tenant_id);
        
        if (!$currentUser->isSuperAdmin() && $currentUser->tenant_id !== $contract->tenant_id) {
            \Log::info('User unauthorized for this contract');
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Load the contract with all relationships bypassing tenant scope
        $contractData = \App\Models\MaintenanceContract::withoutGlobalScope('tenant')
            ->with([
                'product' => function($query) {
                    $query->withoutGlobalScope('tenant');
                },
                'customer' => function($query) {
                    $query->withoutGlobalScope('tenant');
                },
                'assignedTechnician',
                'visits',
                'items' => function($query) {
                    $query->withoutGlobalScope('tenant')->with(['product' => function($q) {
                        $q->withoutGlobalScope('tenant');
                    }]);
                }
            ])
            ->find($contractId);
        
        \Log::info('Contract loaded with relationships');
        return response()->json(['data' => $contractData]);
    }

    public function updateContract(Request $request, $contractId)
    {
        $request->validate([
            'product_id' => 'sometimes|exists:products,id',
            'customer_id' => 'sometimes|exists:customers,id',
            'assigned_technician_id' => 'sometimes|exists:users,id',
            'frequency' => 'sometimes|in:once,weekly,monthly,quarterly,semi_annual,annual,custom',
            'frequency_value' => 'required_if:frequency,custom|nullable|integer|min:1',
            'frequency_unit' => 'required_if:frequency,custom|nullable|in:days,weeks,months,years',
            'start_date' => 'sometimes|date',
            'end_date' => 'nullable|date|after:start_date',
            'contract_value' => 'nullable|numeric|min:0',
            'maintenance_products' => 'nullable|array',
            'maintenance_products.*.id' => 'required|exists:products,id',
            'maintenance_products.*.quantity' => 'required|numeric|min:0',
            'maintenance_products.*.unit_cost' => 'required|numeric|min:0',
            'special_instructions' => 'nullable|string',
            'status' => 'sometimes|in:active,paused,completed,cancelled',
        ]);

        try {
            $contract = $this->contractService->updateContract($contractId, $request->all());

            return response()->json([
                'message' => 'Maintenance contract updated successfully',
                'data' => $contract->load(['product', 'customer', 'assignedTechnician', 'items.product']),
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function destroyContract($contractId)
    {
        // Find the contract without tenant scoping
        $contract = \App\Models\MaintenanceContract::withoutGlobalScope('tenant')->find($contractId);
        
        if (!$contract) {
            return response()->json(['error' => 'Contract not found'], 404);
        }

        // Check if the current user has access to this contract's tenant
        $currentUser = auth()->user();
        if (!$currentUser->isSuperAdmin() && $currentUser->tenant_id !== $contract->tenant_id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $contract->delete();

        return response()->json([
            'message' => 'Maintenance contract deleted successfully',
        ]);
    }

    // Legacy method kept for backward compatibility
    private function getStats()
    {
        return [
            'total_visits' => MaintenanceVisit::count(),
            'scheduled' => MaintenanceVisit::scheduled()->count(),
            'in_progress' => MaintenanceVisit::inProgress()->count(),
            'completed_today' => MaintenanceVisit::completed()
                                               ->whereDate('actual_end_time', today())
                                               ->count(),
            'overdue' => MaintenanceVisit::overdue()->count(),
            'upcoming_week' => MaintenanceVisit::upcoming(7)->count(),
            'active_contracts' => MaintenanceContract::active()->count(),
            'total_revenue_month' => MaintenanceVisit::completed()
                                                   ->whereMonth('actual_end_time', now()->month)
                                                   ->sum('total_cost'),
        ];
    }

    /**
     * Get calendar events for maintenance visits.
     * 
     * Best Practice: Only scheduled visits appear on the calendar.
     * Maintenance contracts define the schedule/frequency, but the actual
     * calendar shows only visits that have been explicitly scheduled.
     * 
     * This separation ensures:
     * - Clear distinction between "contract exists" vs "visit is scheduled"
     * - Users must actively schedule visits (better accountability)
     * - Calendar shows actionable items only
     */
    public function calendar(Request $request)
    {
        $start = Carbon::parse($request->get('start', now()->startOfMonth()->toDateString()));
        $end = Carbon::parse($request->get('end', now()->endOfMonth()->toDateString()));

        \Log::info('Calendar request', [
            'start' => $start->toDateString(),
            'end' => $end->toDateString(),
            'tenant_id' => auth()->user()->tenant_id
        ]);

        // Get all scheduled visits in the date range
        // Only actual visits appear on the calendar - contracts define frequency but don't auto-populate
        $visits = MaintenanceVisit::with(['contract.product', 'contract.customer', 'assignedTechnician'])
                                ->whereBetween('scheduled_date', [$start, $end])
                                ->get();

        \Log::info('Found visits', ['count' => $visits->count()]);

        $events = collect();

        // Add existing visits - these are the only events that appear on calendar
        foreach ($visits as $visit) {
            if (!$visit->contract || !$visit->contract->product) {
                \Log::warning('Visit missing contract/product', ['visit_id' => $visit->id]);
                continue;
            }
            
            $events->push([
                'id' => $visit->id,
                'title' => $visit->contract->customer_name . ' - ' . $visit->contract->product->name,
                'date' => $visit->scheduled_date->toDateString(),
                'status' => $visit->status,
                'priority' => $visit->priority,
                'worker' => $visit->assignedTechnician?->name,
                'customer' => $visit->contract->customer_name,
                'product' => $visit->contract->product->name,
                'type' => 'visit',
                'contract_id' => $visit->maintenance_contract_id,
            ]);
        }

        \Log::info('Calendar events generated', ['count' => $events->count()]);

        return response()->json(['events' => $events->values()]);
    }

    private function getStatusColor($status)
    {
        return match ($status) {
            'scheduled' => '#6b7280',
            'in_progress' => '#3b82f6',
            'completed' => '#10b981',
            'cancelled' => '#ef4444',
            'missed' => '#f59e0b',
            default => '#6b7280',
        };
    }
}