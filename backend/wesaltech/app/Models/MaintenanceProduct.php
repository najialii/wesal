<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MaintenanceProduct extends Model
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'name',
        'sku',
        'description',
        'cost_price',
        'stock_quantity',
        'unit',
        'type',
        'compatible_products',
        'is_active',
    ];

    protected $casts = [
        'cost_price' => 'decimal:2',
        'compatible_products' => 'array',
        'is_active' => 'boolean',
    ];

    public function visitItems(): HasMany
    {
        return $this->hasMany(MaintenanceVisitItem::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    public function scopeLowStock($query, $threshold = 10)
    {
        return $query->where('stock_quantity', '<=', $threshold);
    }

    public function isCompatibleWith($productId): bool
    {
        if (!$this->compatible_products) {
            return true; // Compatible with all if not specified
        }
        
        return in_array($productId, $this->compatible_products);
    }

    public function updateStock($quantity, $operation = 'subtract')
    {
        if ($operation === 'subtract') {
            $this->decrement('stock_quantity', $quantity);
        } else {
            $this->increment('stock_quantity', $quantity);
        }
    }
}