<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use App\Traits\HasTranslations;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Product extends Model
{
    use HasFactory, BelongsToTenant, HasTranslations;

    protected $fillable = [
        'tenant_id',
        'category_id',
        'name',
        'sku',
        'barcode',
        'description',
        'cost_price',
        'selling_price',
        'stock_quantity',
        'min_stock_level',
        'unit',
        'tax_rate', // Saudi VAT rate (15%)
        'is_active',
        'is_spare_part',
        'image',
    ];

    protected $casts = [
        'cost_price' => 'decimal:2',
        'selling_price' => 'decimal:2',
        'tax_rate' => 'decimal:2',
        'is_active' => 'boolean',
        'is_spare_part' => 'boolean',
    ];

    /**
     * Fields that can be translated
     */
    protected $translatable = ['name', 'description'];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function saleItems(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }

    /**
     * Get the branches this product is assigned to
     */
    public function branches(): BelongsToMany
    {
        return $this->belongsToMany(Branch::class, 'branch_product')
                    ->withPivot('stock_quantity', 'min_stock_level', 'selling_price', 'is_active')
                    ->withTimestamps();
    }

    /**
     * Get stock quantity for a specific branch
     */
    public function getStockForBranch(int $branchId): int
    {
        $branchProduct = $this->branches()->where('branches.id', $branchId)->first();
        return $branchProduct ? $branchProduct->pivot->stock_quantity : 0;
    }

    /**
     * Update stock quantity for a specific branch
     */
    public function updateStockForBranch(int $branchId, int $quantity): void
    {
        $this->branches()->updateExistingPivot($branchId, [
            'stock_quantity' => $quantity,
            'updated_at' => now(),
        ]);
    }

    /**
     * Increment stock for a specific branch
     */
    public function incrementStockForBranch(int $branchId, int $quantity): void
    {
        $currentStock = $this->getStockForBranch($branchId);
        $this->updateStockForBranch($branchId, $currentStock + $quantity);
    }

    /**
     * Decrement stock for a specific branch
     */
    public function decrementStockForBranch(int $branchId, int $quantity): void
    {
        $currentStock = $this->getStockForBranch($branchId);
        $newStock = max(0, $currentStock - $quantity);
        $this->updateStockForBranch($branchId, $newStock);
    }

    /**
     * Transfer stock from one branch to another
     */
    public function transferStock(int $fromBranchId, int $toBranchId, int $quantity): bool
    {
        $fromStock = $this->getStockForBranch($fromBranchId);
        
        if ($fromStock < $quantity) {
            return false;
        }

        $this->decrementStockForBranch($fromBranchId, $quantity);
        $this->incrementStockForBranch($toBranchId, $quantity);
        
        return true;
    }

    /**
     * Check if product is low stock in a specific branch
     */
    public function isLowStockInBranch(int $branchId): bool
    {
        $branchProduct = $this->branches()->where('branches.id', $branchId)->first();
        
        if (!$branchProduct) {
            return false;
        }

        return $branchProduct->pivot->stock_quantity <= $branchProduct->pivot->min_stock_level;
    }

    /**
     * Get total stock across all branches
     */
    public function getTotalStockAttribute(): int
    {
        return $this->branches()->sum('branch_product.stock_quantity');
    }

    // Calculate price with Saudi VAT
    public function getPriceWithTaxAttribute(): float
    {
        return $this->selling_price * (1 + ($this->tax_rate / 100));
    }

    public function isLowStock(): bool
    {
        return $this->stock_quantity <= $this->min_stock_level;
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeLowStock($query)
    {
        return $query->whereColumn('stock_quantity', '<=', 'min_stock_level');
    }

    public function scopeSpareParts($query)
    {
        return $query->where('is_spare_part', true);
    }

    public function scopeRegularProducts($query)
    {
        return $query->where('is_spare_part', false);
    }
}