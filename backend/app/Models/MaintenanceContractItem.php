<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MaintenanceContractItem extends Model
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'maintenance_contract_id',
        'maintenance_product_id',
        'quantity',
        'unit_cost',
        'is_included',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'unit_cost' => 'decimal:2',
        'is_included' => 'boolean',
    ];

    public function contract(): BelongsTo
    {
        return $this->belongsTo(MaintenanceContract::class, 'maintenance_contract_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'maintenance_product_id')->withoutGlobalScope('tenant');
    }

    // Keep the old method name for backward compatibility
    public function maintenanceProduct(): BelongsTo
    {
        return $this->product();
    }

    public function getTotalCostAttribute(): float
    {
        return $this->quantity * $this->unit_cost;
    }
}
