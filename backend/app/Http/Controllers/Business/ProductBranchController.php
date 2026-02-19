<?php

namespace App\Http\Controllers\Business;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ProductBranchController extends Controller
{
    /**
     * Get product branch assignments
     * GET /api/business/products/{id}/branches
     */
    public function index(int $productId): JsonResponse
    {
        $product = Product::findOrFail($productId);
        
        // Load branches with pivot data
        $branches = $product->branches()
            ->withPivot('stock_quantity', 'min_stock_level', 'selling_price', 'is_active')
            ->get();
        
        return response()->json([
            'product_id' => $product->id,
            'product_name' => $product->name,
            'branches' => $branches->map(function ($branch) {
                return [
                    'id' => $branch->id,
                    'name' => $branch->name,
                    'code' => $branch->code,
                    'stock_quantity' => $branch->pivot->stock_quantity,
                    'min_stock_level' => $branch->pivot->min_stock_level,
                    'selling_price' => $branch->pivot->selling_price,
                    'is_active' => $branch->pivot->is_active,
                    'is_low_stock' => $branch->pivot->stock_quantity <= $branch->pivot->min_stock_level,
                ];
            })
        ]);
    }

    /**
     * Assign product to branches
     * POST /api/business/products/{id}/branches
     */
    public function store(Request $request, int $productId): JsonResponse
    {
        $product = Product::findOrFail($productId);
        
        $validated = $request->validate([
            'branch_ids' => 'required|array|min:1',
            'branch_ids.*' => 'required|exists:branches,id',
            'stock_quantity' => 'nullable|integer|min:0',
            'min_stock_level' => 'nullable|integer|min:0',
            'selling_price' => 'nullable|numeric|min:0',
        ]);
        
        $branchIds = $validated['branch_ids'];
        
        // Verify all branches belong to the same tenant
        $branches = Branch::whereIn('id', $branchIds)->get();
        $tenantId = auth()->user()->tenant_id;
        
        if ($branches->pluck('tenant_id')->unique()->count() > 1 || 
            $branches->pluck('tenant_id')->first() !== $tenantId) {
            throw ValidationException::withMessages([
                'branch_ids' => ['All branches must belong to your organization']
            ]);
        }
        
        // Prepare pivot data
        $pivotData = [];
        foreach ($branchIds as $branchId) {
            $pivotData[$branchId] = [
                'stock_quantity' => $validated['stock_quantity'] ?? 0,
                'min_stock_level' => $validated['min_stock_level'] ?? 0,
                'selling_price' => $validated['selling_price'] ?? $product->selling_price,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
        
        // Attach branches (will skip if already attached)
        $product->branches()->syncWithoutDetaching($pivotData);
        
        return response()->json([
            'message' => 'Product assigned to branches successfully',
            'product_id' => $product->id,
            'assigned_branches' => count($branchIds)
        ], 201);
    }

    /**
     * Update branch-specific product data (stock, price)
     * PUT /api/business/products/{id}/branches/{branchId}
     */
    public function update(Request $request, int $productId, int $branchId): JsonResponse
    {
        $product = Product::findOrFail($productId);
        $branch = Branch::findOrFail($branchId);
        
        // Verify branch belongs to user's tenant
        if ($branch->tenant_id !== auth()->user()->tenant_id) {
            return response()->json([
                'message' => 'Unauthorized access to branch'
            ], 403);
        }
        
        // Verify product is assigned to this branch
        if (!$product->branches()->where('branch_id', $branchId)->exists()) {
            return response()->json([
                'message' => 'Product is not assigned to this branch'
            ], 404);
        }
        
        $validated = $request->validate([
            'stock_quantity' => 'nullable|integer|min:0',
            'min_stock_level' => 'nullable|integer|min:0',
            'selling_price' => 'nullable|numeric|min:0',
            'is_active' => 'nullable|boolean',
        ]);
        
        // Update pivot data
        $updateData = array_filter($validated, function ($value) {
            return $value !== null;
        });
        
        if (!empty($updateData)) {
            $updateData['updated_at'] = now();
            $product->branches()->updateExistingPivot($branchId, $updateData);
        }
        
        // Get updated data
        $updatedBranch = $product->branches()
            ->where('branch_id', $branchId)
            ->withPivot('stock_quantity', 'min_stock_level', 'selling_price', 'is_active')
            ->first();
        
        return response()->json([
            'message' => 'Branch-specific product data updated successfully',
            'product_id' => $product->id,
            'branch_id' => $branchId,
            'data' => [
                'stock_quantity' => $updatedBranch->pivot->stock_quantity,
                'min_stock_level' => $updatedBranch->pivot->min_stock_level,
                'selling_price' => $updatedBranch->pivot->selling_price,
                'is_active' => $updatedBranch->pivot->is_active,
            ]
        ]);
    }

    /**
     * Remove product from branch
     * DELETE /api/business/products/{id}/branches/{branchId}
     */
    public function destroy(int $productId, int $branchId): JsonResponse
    {
        $product = Product::findOrFail($productId);
        $branch = Branch::findOrFail($branchId);
        
        // Verify branch belongs to user's tenant
        if ($branch->tenant_id !== auth()->user()->tenant_id) {
            return response()->json([
                'message' => 'Unauthorized access to branch'
            ], 403);
        }
        
        // Check if product has sales in this branch
        $hasSales = DB::table('sales')
            ->join('sale_items', 'sales.id', '=', 'sale_items.sale_id')
            ->where('sales.branch_id', $branchId)
            ->where('sale_items.product_id', $productId)
            ->exists();
        
        if ($hasSales) {
            return response()->json([
                'message' => 'Cannot remove product from branch with existing sales history'
            ], 422);
        }
        
        // Detach product from branch
        $product->branches()->detach($branchId);
        
        return response()->json([
            'message' => 'Product removed from branch successfully',
            'product_id' => $product->id,
            'branch_id' => $branchId
        ]);
    }
}
