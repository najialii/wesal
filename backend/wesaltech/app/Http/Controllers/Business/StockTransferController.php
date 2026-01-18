<?php

namespace App\Http\Controllers\Business;

use App\Http\Controllers\Controller;
use App\Models\StockTransfer;
use App\Models\Product;
use App\Models\Branch;
use App\Services\StockTransferService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class StockTransferController extends Controller
{
    protected StockTransferService $stockTransferService;

    public function __construct(StockTransferService $stockTransferService)
    {
        $this->stockTransferService = $stockTransferService;
    }

    /**
     * List stock transfers
     * GET /api/business/stock-transfers
     */
    public function index(Request $request): JsonResponse
    {
        $user = auth()->user();
        $tenantId = $user->tenant_id;
        
        $query = StockTransfer::where('tenant_id', $tenantId)
            ->with(['product', 'fromBranch', 'toBranch', 'initiatedBy', 'completedBy']);
        
        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->get('status'));
        }
        
        // Filter by branch (if user is not owner)
        if (!$user->hasRole('owner')) {
            $userBranchIds = $user->branches()->pluck('branches.id');
            $query->where(function ($q) use ($userBranchIds) {
                $q->whereIn('from_branch_id', $userBranchIds)
                  ->orWhereIn('to_branch_id', $userBranchIds);
            });
        }
        
        // Filter by product
        if ($request->has('product_id')) {
            $query->where('product_id', $request->get('product_id'));
        }
        
        // Filter by date range
        if ($request->has('start_date')) {
            $query->whereDate('created_at', '>=', $request->get('start_date'));
        }
        if ($request->has('end_date')) {
            $query->whereDate('created_at', '<=', $request->get('end_date'));
        }
        
        $transfers = $query->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 15));
        
        return response()->json($transfers);
    }

    /**
     * Initiate stock transfer
     * POST /api/business/stock-transfers
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'from_branch_id' => 'required|exists:branches,id',
            'to_branch_id' => 'required|exists:branches,id|different:from_branch_id',
            'quantity' => 'required|integer|min:1',
            'notes' => 'nullable|string|max:1000',
        ]);
        
        $user = auth()->user();
        $tenantId = $user->tenant_id;
        
        // Verify branches belong to user's tenant
        $fromBranch = Branch::findOrFail($validated['from_branch_id']);
        $toBranch = Branch::findOrFail($validated['to_branch_id']);
        
        if ($fromBranch->tenant_id !== $tenantId || $toBranch->tenant_id !== $tenantId) {
            throw ValidationException::withMessages([
                'branches' => ['Both branches must belong to your organization']
            ]);
        }
        
        // Verify both branches are active
        if (!$fromBranch->is_active || !$toBranch->is_active) {
            throw ValidationException::withMessages([
                'branches' => ['Cannot transfer to/from inactive branches']
            ]);
        }
        
        // Verify user has access to source branch (unless owner)
        if (!$user->hasRole('owner') && !$user->canAccessBranch($validated['from_branch_id'])) {
            return response()->json([
                'message' => 'You do not have access to the source branch'
            ], 403);
        }
        
        try {
            $transfer = $this->stockTransferService->initiateTransfer(
                $validated['product_id'],
                $validated['from_branch_id'],
                $validated['to_branch_id'],
                $validated['quantity'],
                $validated['notes'] ?? null
            );
            
            return response()->json([
                'message' => 'Stock transfer initiated successfully',
                'transfer' => $transfer->load(['product', 'fromBranch', 'toBranch', 'initiatedBy'])
            ], 201);
            
        } catch (\Exception $e) {
            throw ValidationException::withMessages([
                'transfer' => [$e->getMessage()]
            ]);
        }
    }

    /**
     * Get transfer details
     * GET /api/business/stock-transfers/{id}
     */
    public function show(int $id): JsonResponse
    {
        $user = auth()->user();
        $transfer = StockTransfer::where('tenant_id', $user->tenant_id)
            ->with(['product', 'fromBranch', 'toBranch', 'initiatedBy', 'completedBy'])
            ->findOrFail($id);
        
        // Verify user has access to at least one of the branches (unless owner)
        if (!$user->hasRole('owner')) {
            $hasAccess = $user->canAccessBranch($transfer->from_branch_id) || 
                         $user->canAccessBranch($transfer->to_branch_id);
            
            if (!$hasAccess) {
                return response()->json([
                    'message' => 'You do not have access to this transfer'
                ], 403);
            }
        }
        
        return response()->json($transfer);
    }

    /**
     * Complete transfer
     * POST /api/business/stock-transfers/{id}/complete
     */
    public function complete(int $id): JsonResponse
    {
        $user = auth()->user();
        $transfer = StockTransfer::where('tenant_id', $user->tenant_id)
            ->findOrFail($id);
        
        // Verify user has access to destination branch (unless owner)
        if (!$user->hasRole('owner') && !$user->canAccessBranch($transfer->to_branch_id)) {
            return response()->json([
                'message' => 'You do not have access to complete this transfer'
            ], 403);
        }
        
        try {
            $this->stockTransferService->completeTransfer($id);
            
            return response()->json([
                'message' => 'Stock transfer completed successfully',
                'transfer' => $transfer->fresh(['product', 'fromBranch', 'toBranch', 'initiatedBy', 'completedBy'])
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage()
            ], 422);
        }
    }

    /**
     * Cancel transfer
     * POST /api/business/stock-transfers/{id}/cancel
     */
    public function cancel(int $id): JsonResponse
    {
        $user = auth()->user();
        $transfer = StockTransfer::where('tenant_id', $user->tenant_id)
            ->findOrFail($id);
        
        // Verify user has access to source branch (unless owner)
        if (!$user->hasRole('owner') && !$user->canAccessBranch($transfer->from_branch_id)) {
            return response()->json([
                'message' => 'You do not have access to cancel this transfer'
            ], 403);
        }
        
        try {
            $this->stockTransferService->cancelTransfer($id);
            
            return response()->json([
                'message' => 'Stock transfer cancelled successfully',
                'transfer' => $transfer->fresh(['product', 'fromBranch', 'toBranch', 'initiatedBy', 'completedBy'])
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage()
            ], 422);
        }
    }
}
