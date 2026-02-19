<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use App\Traits\BelongsToBranch;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockMovement extends Model
{
    use HasFactory, BelongsToTenant, BelongsToBranch;

    protected $fillable = [
        'tenant_id',
        'branch_id',
        'product_id',
        'type', // 'in', 'out', 'adjustment'
        'quantity',
        'reference_type', // 'sale', 'purchase', 'adjustment', 'return'
        'reference_id',
        'notes',
        'user_id',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Automatically update product stock
    protected static function boot()
    {
        parent::boot();
        
        static::created(function ($movement) {
            $product = $movement->product;
            
            if ($movement->type === 'in') {
                $product->increment('stock_quantity', $movement->quantity);
            } elseif ($movement->type === 'out') {
                $product->decrement('stock_quantity', $movement->quantity);
            } elseif ($movement->type === 'adjustment') {
                $product->stock_quantity = $movement->quantity;
                $product->save();
            }
        });
    }

    public function scopeIn($query)
    {
        return $query->where('type', 'in');
    }

    public function scopeOut($query)
    {
        return $query->where('type', 'out');
    }
}