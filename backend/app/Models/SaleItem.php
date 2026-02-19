<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SaleItem extends Model
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'sale_id',
        'product_id',
        'quantity',
        'unit_price',
        'tax_rate',
        'discount_amount',
        'total_amount',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'unit_price' => 'decimal:2',
        'tax_rate' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
    ];

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    // Calculate totals automatically
    protected static function boot()
    {
        parent::boot();
        
        static::saving(function ($item) {
            $subtotal = $item->quantity * $item->unit_price;
            $taxAmount = $subtotal * ($item->tax_rate / 100);
            $item->total_amount = $subtotal + $taxAmount - $item->discount_amount;
        });
    }
}