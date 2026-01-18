<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Branch;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ProductBranchService
{
    protected BranchContextService $branchContextService;

    public function __construct(BranchContextService $branchContextService)
    {
        $this->branchContextService = $branchContextService;
    }

    /**
     * Assign a product to multiple branches with initial stock and optional pricing
     *
     * @param Product $product
     * @param array $branchIds
     * @param array $options ['stock' => [...], 'prices' => [...], 'min_stock' => [...]]
     * @return void
     * @throws ValidationException
     */
    public function assignToBranches(Product $product, array $branchIds, array $options = []): void
    {
        if (empty($branchIds)) {
            throw ValidationException::withMessages([
                'branch_ids' => ['At least one branch must be selected']
            ]);
        }

        // Verify all branches belong to the same tenant as the product
        $branches = Branch::whereIn('id', $branchIds)->get();
        
        foreach ($branches as $branch) {
            if ($branch->tenant_id !== $product->tenant_id) {
                throw ValidationException::withMessages([
                    'branch_ids' => ['All branches must belong to your organization']
                ]);
            }
        }

        // Prepare pivot data for each branch
        $pivotData = [];
        foreach ($branchIds as $branchId) {
            $pivotData[$branchId] = [
                'stock_quantity' => $options['stock'][$branchId] ?? $options['default_stock'] ?? 0,
                'min_stock_level' => $options['min_stock'][$branchId] ?? $options['default_min_stock'] ?? $product->min_stock_level ?? 0,
                'selling_price' => $options['prices'][$branchId] ?? null, // null means use product default
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        // Sync branches (this will add new ones and keep existing)
        $product->branches()->syncWithoutDetaching($pivotData);
    }

    /**
     * Remove a product from a branch
     *
     * @param Product $product
     * @param int $branchId
     * @param bool $force Force removal even if stock exists
     * @return bool
     * @throws ValidationException
     */
    public function removeFromBranch(Product $product, int $branchId, bool $force = false): bool
    {
        // Check if this is the last branch
        $branchCount = $product->branches()->count();
        if ($branchCount <= 1) {
            throw ValidationException::withMessages([
                'branch_id' => ['Cannot remove the last branch from a product. Products must be assigned to at least one branch.']
            ]);
        }

        // Check if stock exists in this branch
        $currentStock = $product->getStockForBranch($branchId);
        if ($currentStock > 0 && !$force) {
            throw ValidationException::withMessages([
                'branch_id' => ["This branch has {$currentStock} units in stock. Please transfer or adjust stock before removing."],
                'stock_warning' => true,
                'current_stock' => $currentStock
            ]);
        }

        // Check for sales history
        $hasSales = DB::table('sales')
            ->join('sale_items', 'sales.id', '=', 'sale_items.sale_id')
            ->where('sales.branch_id', $branchId)
            ->where('sale_items.product_id', $product->id)
            ->exists();

        if ($hasSales) {
            // Don't remove, just deactivate to preserve history
            $product->branches()->updateExistingPivot($branchId, [
                'is_active' => false,
                'updated_at' => now(),
            ]);
            return true;
        }

        // Safe to remove
        $product->branches()->detach($branchId);
        return true;
    }

    /**
     * Update stock quantity for a specific branch
     *
     * @param Product $product
     * @param int $branchId
     * @param int $quantity
     * @return void
     */
    public function updateBranchStock(Product $product, int $branchId, int $quantity): void
    {
        $product->branches()->updateExistingPivot($branchId, [
            'stock_quantity' => max(0, $quantity),
            'updated_at' => now(),
        ]);
    }

    /**
     * Update branch-specific selling price
     *
     * @param Product $product
     * @param int $branchId
     * @param float|null $price null to use product default
     * @return void
     */
    public function updateBranchPrice(Product $product, int $branchId, ?float $price): void
    {
        $product->branches()->updateExistingPivot($branchId, [
            'selling_price' => $price,
            'updated_at' => now(),
        ]);
    }

    /**
     * Bulk assign multiple products to a branch
     *
     * @param array $productIds
     * @param int $branchId
     * @param int $tenantId
     * @return array ['assigned' => int, 'skipped' => int, 'skipped_products' => array]
     */
    public function bulkAssignToBranch(array $productIds, int $branchId, int $tenantId): array
    {
        $branch = Branch::findOrFail($branchId);
        
        // Verify branch belongs to tenant
        if ($branch->tenant_id !== $tenantId) {
            throw ValidationException::withMessages([
                'branch_id' => ['Branch does not belong to your organization']
            ]);
        }

        $assigned = 0;
        $skipped = 0;
        $skippedProducts = [];

        foreach ($productIds as $productId) {
            $product = Product::where('id', $productId)
                             ->where('tenant_id', $tenantId)
                             ->first();

            if (!$product) {
                $skipped++;
                $skippedProducts[] = [
                    'id' => $productId,
                    'reason' => 'Product not found'
                ];
                continue;
            }

            // Check if already assigned
            if ($product->branches()->where('branch_id', $branchId)->exists()) {
                $skipped++;
                $skippedProducts[] = [
                    'id' => $productId,
                    'name' => $product->name,
                    'reason' => 'Already assigned to branch'
                ];
                continue;
            }

            // Assign to branch with zero initial stock
            $product->branches()->attach($branchId, [
                'stock_quantity' => 0,
                'min_stock_level' => $product->min_stock_level ?? 0,
                'selling_price' => null, // Use product default
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $assigned++;
        }

        return [
            'assigned' => $assigned,
            'skipped' => $skipped,
            'skipped_products' => $skippedProducts,
        ];
    }

    /**
     * Get effective price for a product in a specific branch
     * Returns branch-specific price if set, otherwise product default
     *
     * @param Product $product
     * @param int $branchId
     * @return float
     */
    public function getEffectivePrice(Product $product, int $branchId): float
    {
        $branchProduct = $product->branches()
            ->where('branch_id', $branchId)
            ->first();

        if ($branchProduct && $branchProduct->pivot->selling_price !== null) {
            return (float) $branchProduct->pivot->selling_price;
        }

        return (float) $product->selling_price;
    }

    /**
     * Check if product has price variance across branches
     *
     * @param Product $product
     * @return bool
     */
    public function hasPriceVariance(Product $product): bool
    {
        $branchPrices = $product->branches()
            ->whereNotNull('branch_product.selling_price')
            ->pluck('branch_product.selling_price')
            ->unique();

        // Has variance if multiple different branch prices exist
        if ($branchPrices->count() > 1) {
            return true;
        }

        // Has variance if branch price differs from product default
        if ($branchPrices->count() === 1 && 
            (float) $branchPrices->first() !== (float) $product->selling_price) {
            return true;
        }

        return false;
    }

    /**
     * Get branches available for a user to assign products to
     *
     * @param User $user
     * @return Collection
     */
    public function getAvailableBranchesForUser(User $user): Collection
    {
        return $this->branchContextService->getUserBranches($user);
    }

    /**
     * Get product with branch details for a specific user
     *
     * @param Product $product
     * @param User $user
     * @return array
     */
    public function getProductBranchDetails(Product $product, User $user): array
    {
        $userBranches = $this->branchContextService->getUserBranches($user);
        $userBranchIds = $userBranches->pluck('id')->toArray();

        $productBranches = $product->branches()
            ->whereIn('branches.id', $userBranchIds)
            ->withPivot('stock_quantity', 'min_stock_level', 'selling_price', 'is_active')
            ->get();

        return [
            'product_id' => $product->id,
            'product_name' => $product->name,
            'default_price' => $product->selling_price,
            'has_price_variance' => $this->hasPriceVariance($product),
            'branches' => $productBranches->map(function ($branch) use ($product) {
                return [
                    'id' => $branch->id,
                    'name' => $branch->name,
                    'code' => $branch->code,
                    'stock_quantity' => $branch->pivot->stock_quantity,
                    'min_stock_level' => $branch->pivot->min_stock_level,
                    'selling_price' => $branch->pivot->selling_price,
                    'effective_price' => $branch->pivot->selling_price ?? $product->selling_price,
                    'is_active' => $branch->pivot->is_active,
                    'is_low_stock' => $branch->pivot->stock_quantity <= $branch->pivot->min_stock_level,
                ];
            }),
            'total_stock' => $productBranches->sum('pivot.stock_quantity'),
        ];
    }

    /**
     * Validate branch selection for product creation/update
     *
     * @param array $branchIds
     * @param int $tenantId
     * @param User $user
     * @return void
     * @throws ValidationException
     */
    public function validateBranchSelection(array $branchIds, int $tenantId, User $user): void
    {
        if (empty($branchIds)) {
            throw ValidationException::withMessages([
                'branch_ids' => ['At least one branch must be selected']
            ]);
        }

        $userBranches = $this->branchContextService->getUserBranches($user);
        $userBranchIds = $userBranches->pluck('id')->toArray();

        foreach ($branchIds as $branchId) {
            // Check if branch exists and belongs to tenant
            $branch = Branch::find($branchId);
            if (!$branch || $branch->tenant_id !== $tenantId) {
                throw ValidationException::withMessages([
                    'branch_ids' => ['Invalid branch selected']
                ]);
            }

            // Check if user has access to this branch
            if (!in_array($branchId, $userBranchIds)) {
                throw ValidationException::withMessages([
                    'branch_ids' => ['You do not have access to one or more selected branches']
                ]);
            }
        }
    }
}
