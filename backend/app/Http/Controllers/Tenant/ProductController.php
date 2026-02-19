<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Category;
use App\Models\Branch;
use App\Services\ProductBranchService;
use App\Services\BranchContextService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class ProductController extends Controller
{
    use AuthorizesRequests;
    
    protected ProductBranchService $productBranchService;
    protected BranchContextService $branchContextService;

    public function __construct(ProductBranchService $productBranchService, BranchContextService $branchContextService)
    {
        $this->productBranchService = $productBranchService;
        $this->branchContextService = $branchContextService;
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Product::class);

        $user = auth()->user();
        
        // Get current branch from multiple sources (request param, session, or service)
        $currentBranchId = $request->get('branch_id') 
            ?: session('active_branch_id') 
            ?: $this->branchContextService->getCurrentBranchId($user);
        
        $query = Product::with(['category', 'branches']);
        
        // Always filter by current branch context (unless owner explicitly requests all)
        if ($currentBranchId === 'all' && $user->hasRole('owner')) {
            // Owner viewing all branches - no branch filter, but include branch info
            $query->with(['branches' => function ($q) use ($user) {
                $q->where('tenant_id', $user->tenant_id);
            }]);
        } elseif ($currentBranchId && $currentBranchId !== 'all') {
            // Filter by specific branch
            $query->whereHas('branches', function ($q) use ($currentBranchId) {
                $q->where('branch_id', $currentBranchId)
                  ->where('branch_product.is_active', true);
            });
        }
        // If no branch context at all, show all products for the tenant (fallback)
        
        $products = $query
            ->when($request->get('search'), function ($query, $search) {
                return $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('sku', 'like', "%{$search}%")
                      ->orWhere('barcode', 'like', "%{$search}%");
                });
            })
            ->when($request->get('category_id'), function ($query, $categoryId) {
                return $query->where('category_id', $categoryId);
            })
            ->when($request->has('low_stock'), function ($query) {
                return $query->lowStock();
            })
            ->when($request->has('is_spare_part'), function ($query) use ($request) {
                return $query->where('is_spare_part', $request->boolean('is_spare_part'));
            })
            ->orderBy('name')
            ->paginate($request->get('per_page', 15));

        // Add branch stock info to each product
        $products->getCollection()->transform(function ($product) use ($currentBranchId) {
            if ($currentBranchId && $currentBranchId !== 'all') {
                $product->branch_stock = $product->getStockForBranch($currentBranchId);
                $product->is_low_stock_in_branch = $product->isLowStockInBranch($currentBranchId);
            }
            
            $product->total_stock = $product->total_stock;
            $product->branch_count = $product->branches->count();
            $product->has_price_variance = $this->productBranchService->hasPriceVariance($product);
            
            return $product;
        });

        return response()->json($products);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Product::class);

        $user = auth()->user();

        // Debug logging
        \Log::info('Store request data:', $request->all());
        \Log::info('is_spare_part value:', [
            'raw' => $request->get('is_spare_part'),
            'boolean' => $request->boolean('is_spare_part')
        ]);

        $validated = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'name' => 'required|string|max:255',
            'sku' => 'required|string|unique:products,sku',
            'barcode' => 'nullable|string',
            'description' => 'nullable|string',
            'cost_price' => 'required|numeric|min:0',
            'selling_price' => 'required|numeric|min:0',
            'stock_quantity' => 'required|numeric|min:0',
            'min_stock_level' => 'required|numeric|min:0',
            'unit' => 'required|string|max:50',
            'tax_rate' => 'nullable|numeric|min:0|max:100',
            'is_active' => 'boolean',
            'is_spare_part' => 'boolean',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            // Branch assignment fields
            'branch_ids' => 'nullable|array',
            'branch_ids.*' => 'exists:branches,id',
            'branch_stock' => 'nullable|array',
            'branch_stock.*' => 'integer|min:0',
            'branch_prices' => 'nullable|array',
            'branch_prices.*' => 'nullable|numeric|min:0',
        ]);

        $validated['tax_rate'] = $validated['tax_rate'] ?? 15.00; // Default Saudi VAT
        $validated['is_spare_part'] = $request->boolean('is_spare_part'); // Ensure boolean conversion
        $validated['is_active'] = $request->boolean('is_active', true); // Default to true if not provided

        // Handle image upload
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('products', 'public');
            $validated['image'] = '/storage/' . $path;
        }

        // Get branch IDs - use current active branch automatically
        $branchIds = $request->get('branch_ids', []);
        if (empty($branchIds)) {
            // Auto-assign to current active branch
            $activeBranchId = session('active_branch_id');
            if ($activeBranchId) {
                $branchIds = [$activeBranchId];
            } else {
                // Fallback: get user's first available branch
                $userBranches = $this->branchContextService->getUserBranches($user);
                if ($userBranches->isNotEmpty()) {
                    $branchIds = [$userBranches->first()->id];
                }
            }
        }

        // Validate branch selection
        if (empty($branchIds)) {
            return response()->json([
                'message' => 'At least one branch must be selected',
                'errors' => ['branch_ids' => ['At least one branch must be selected']]
            ], 422);
        }

        // Validate user has access to selected branches
        $this->productBranchService->validateBranchSelection($branchIds, $user->tenant_id, $user);

        // Remove branch-related fields from product data
        $productData = collect($validated)->except(['branch_ids', 'branch_stock', 'branch_prices'])->toArray();

        DB::beginTransaction();
        try {
            // Create the product
            $product = Product::create($productData);

            // Assign to branches with stock and prices
            $branchOptions = [
                'stock' => $request->get('branch_stock', []),
                'prices' => $request->get('branch_prices', []),
                'default_stock' => $validated['stock_quantity'],
                'default_min_stock' => $validated['min_stock_level'],
            ];

            $this->productBranchService->assignToBranches($product, $branchIds, $branchOptions);

            DB::commit();

            return response()->json([
                'message' => 'Product created successfully',
                'product' => $product->load(['category', 'branches'])
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Product creation failed:', ['error' => $e->getMessage()]);
            return response()->json([
                'message' => 'Failed to create product',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show($productId): JsonResponse
    {
        $product = Product::findOrFail($productId);
        $this->authorize('view', $product);
        
        return response()->json($product->load('category'));
    }

    public function update(Request $request, $productId): JsonResponse
    {
        $product = Product::findOrFail($productId);
        $this->authorize('update', $product);

        $user = auth()->user();

        // Debug logging
        \Log::info('Update request data:', $request->all());
        \Log::info('is_spare_part value:', [
            'raw' => $request->get('is_spare_part'),
            'boolean' => $request->boolean('is_spare_part')
        ]);
        \Log::info('Has image file:', ['has_image' => $request->hasFile('image')]);
        if ($request->hasFile('image')) {
            \Log::info('Image file info:', [
                'name' => $request->file('image')->getClientOriginalName(),
                'size' => $request->file('image')->getSize(),
                'mime' => $request->file('image')->getMimeType()
            ]);
        }

        $validated = $request->validate([
            'category_id' => 'sometimes|exists:categories,id',
            'name' => 'sometimes|string|max:255',
            'sku' => 'sometimes|string|unique:products,sku,' . $product->id,
            'barcode' => 'nullable|string',
            'description' => 'nullable|string',
            'cost_price' => 'sometimes|numeric|min:0',
            'selling_price' => 'sometimes|numeric|min:0',
            'stock_quantity' => 'sometimes|numeric|min:0',
            'min_stock_level' => 'sometimes|numeric|min:0',
            'unit' => 'sometimes|string|max:50',
            'tax_rate' => 'nullable|numeric|min:0|max:100',
            'is_active' => 'boolean',
            'is_spare_part' => 'boolean',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            'remove_image' => 'nullable|boolean',
            // Branch assignment fields
            'branch_ids' => 'nullable|array',
            'branch_ids.*' => 'exists:branches,id',
            'branch_stock' => 'nullable|array',
            'branch_stock.*' => 'integer|min:0',
            'branch_prices' => 'nullable|array',
            'branch_prices.*' => 'nullable|numeric|min:0',
            'add_branches' => 'nullable|array',
            'add_branches.*' => 'exists:branches,id',
            'remove_branches' => 'nullable|array',
            'remove_branches.*' => 'exists:branches,id',
            'force_remove' => 'nullable|boolean',
        ]);

        // Ensure boolean conversion for checkboxes
        if ($request->has('is_spare_part')) {
            $validated['is_spare_part'] = $request->boolean('is_spare_part');
        }
        if ($request->has('is_active')) {
            $validated['is_active'] = $request->boolean('is_active');
        }

        // Handle image removal
        if ($request->has('remove_image') && $request->remove_image) {
            \Log::info('Removing image');
            if ($product->image) {
                // Delete old image file
                $oldImagePath = str_replace('/storage/', '', $product->image);
                Storage::disk('public')->delete($oldImagePath);
            }
            $validated['image'] = null;
        }
        // Handle new image upload
        elseif ($request->hasFile('image')) {
            \Log::info('Uploading new image');
            // Delete old image if exists
            if ($product->image) {
                $oldImagePath = str_replace('/storage/', '', $product->image);
                Storage::disk('public')->delete($oldImagePath);
            }
            
            $path = $request->file('image')->store('products', 'public');
            $validated['image'] = '/storage/' . $path;
            \Log::info('New image path:', ['path' => $validated['image']]);
        }

        DB::beginTransaction();
        try {
            // Remove branch-related fields from product data
            $productData = collect($validated)->except([
                'branch_ids', 'branch_stock', 'branch_prices', 
                'add_branches', 'remove_branches', 'force_remove'
            ])->toArray();

            $product->update($productData);
            \Log::info('Product updated:', $product->toArray());

            // Handle branch assignments
            if ($request->has('branch_ids')) {
                // Full replacement of branch assignments
                $branchIds = $request->get('branch_ids', []);
                
                if (empty($branchIds)) {
                    return response()->json([
                        'message' => 'At least one branch must be selected',
                        'errors' => ['branch_ids' => ['At least one branch must be selected']]
                    ], 422);
                }

                $this->productBranchService->validateBranchSelection($branchIds, $user->tenant_id, $user);

                // Get current branches
                $currentBranchIds = $product->branches()->pluck('branches.id')->toArray();
                
                // Branches to add
                $branchesToAdd = array_diff($branchIds, $currentBranchIds);
                // Branches to remove
                $branchesToRemove = array_diff($currentBranchIds, $branchIds);

                // Add new branches
                if (!empty($branchesToAdd)) {
                    $branchOptions = [
                        'stock' => $request->get('branch_stock', []),
                        'prices' => $request->get('branch_prices', []),
                        'default_stock' => 0,
                        'default_min_stock' => $product->min_stock_level ?? 0,
                    ];
                    $this->productBranchService->assignToBranches($product, $branchesToAdd, $branchOptions);
                }

                // Remove branches
                $forceRemove = $request->boolean('force_remove', false);
                foreach ($branchesToRemove as $branchId) {
                    try {
                        $this->productBranchService->removeFromBranch($product, $branchId, $forceRemove);
                    } catch (\Illuminate\Validation\ValidationException $e) {
                        DB::rollBack();
                        return response()->json([
                            'message' => $e->getMessage(),
                            'errors' => $e->errors()
                        ], 422);
                    }
                }

                // Update stock and prices for existing branches
                $branchStock = $request->get('branch_stock', []);
                $branchPrices = $request->get('branch_prices', []);
                
                foreach ($branchIds as $branchId) {
                    if (isset($branchStock[$branchId])) {
                        $this->productBranchService->updateBranchStock($product, $branchId, $branchStock[$branchId]);
                    }
                    if (array_key_exists($branchId, $branchPrices)) {
                        $this->productBranchService->updateBranchPrice($product, $branchId, $branchPrices[$branchId]);
                    }
                }
            }

            // Handle incremental branch additions
            if ($request->has('add_branches')) {
                $branchesToAdd = $request->get('add_branches', []);
                if (!empty($branchesToAdd)) {
                    $this->productBranchService->validateBranchSelection($branchesToAdd, $user->tenant_id, $user);
                    $branchOptions = [
                        'stock' => $request->get('branch_stock', []),
                        'prices' => $request->get('branch_prices', []),
                        'default_stock' => 0,
                        'default_min_stock' => $product->min_stock_level ?? 0,
                    ];
                    $this->productBranchService->assignToBranches($product, $branchesToAdd, $branchOptions);
                }
            }

            // Handle incremental branch removals
            if ($request->has('remove_branches')) {
                $branchesToRemove = $request->get('remove_branches', []);
                $forceRemove = $request->boolean('force_remove', false);
                
                foreach ($branchesToRemove as $branchId) {
                    try {
                        $this->productBranchService->removeFromBranch($product, $branchId, $forceRemove);
                    } catch (\Illuminate\Validation\ValidationException $e) {
                        DB::rollBack();
                        return response()->json([
                            'message' => $e->getMessage(),
                            'errors' => $e->errors()
                        ], 422);
                    }
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Product updated successfully',
                'product' => $product->fresh(['category', 'branches'])
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Product update failed:', ['error' => $e->getMessage()]);
            return response()->json([
                'message' => 'Failed to update product',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy($productId): JsonResponse
    {
        $product = Product::findOrFail($productId);
        $this->authorize('delete', $product);

        if ($product->saleItems()->exists()) {
            return response()->json([
                'message' => 'Cannot delete product with existing sales'
            ], 422);
        }

        $product->delete();

        return response()->json([
            'message' => 'Product deleted successfully'
        ]);
    }

    public function lowStock(): JsonResponse
    {
        $this->authorize('viewAny', Product::class);

        $products = Product::lowStock()
            ->with('category')
            ->orderBy('stock_quantity')
            ->get();

        return response()->json($products);
    }

    /**
     * Bulk assign products to a branch
     * POST /api/tenant/products/bulk-assign-branch
     */
    public function bulkAssignBranch(Request $request): JsonResponse
    {
        $this->authorize('create', Product::class);

        $user = auth()->user();

        $validated = $request->validate([
            'product_ids' => 'required|array|min:1',
            'product_ids.*' => 'required|integer|exists:products,id',
            'branch_id' => 'required|integer|exists:branches,id',
        ]);

        // Verify user has access to the target branch
        if (!$this->branchContextService->canAccessBranch($user, $validated['branch_id'])) {
            return response()->json([
                'message' => 'You do not have access to this branch',
                'errors' => ['branch_id' => ['You do not have access to this branch']]
            ], 403);
        }

        try {
            $result = $this->productBranchService->bulkAssignToBranch(
                $validated['product_ids'],
                $validated['branch_id'],
                $user->tenant_id
            );

            return response()->json([
                'success' => true,
                'message' => 'Products assigned to branch successfully',
                'data' => [
                    'assigned' => $result['assigned'],
                    'skipped' => $result['skipped'],
                    'details' => [
                        'skipped_products' => $result['skipped_products']
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('Bulk branch assignment failed:', ['error' => $e->getMessage()]);
            return response()->json([
                'message' => 'Failed to assign products to branch',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get product with branch details
     * GET /api/tenant/products/{id}/branch-details
     */
    public function branchDetails($productId): JsonResponse
    {
        $product = Product::findOrFail($productId);
        $this->authorize('view', $product);

        $user = auth()->user();
        $details = $this->productBranchService->getProductBranchDetails($product, $user);

        return response()->json($details);
    }

    /**
     * Get available branches for product assignment
     * GET /api/tenant/products/available-branches
     */
    public function availableBranches(): JsonResponse
    {
        $this->authorize('viewAny', Product::class);

        $user = auth()->user();
        $branches = $this->productBranchService->getAvailableBranchesForUser($user);

        return response()->json([
            'branches' => $branches->map(function ($branch) {
                return [
                    'id' => $branch->id,
                    'name' => $branch->name,
                    'code' => $branch->code,
                    'is_active' => $branch->is_active,
                ];
            })
        ]);
    }
}