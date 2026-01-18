<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MaintenanceVisitItem extends Model
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'maintenance_visit_id',
        'maintenance_product_id',
        'quantity_used',
        'unit_cost',
        'total_cost',
        'notes',
    ];

    protected $casts = [
        'unit_cost' => 'decimal:2',
        'total_cost' => 'decimal:2',
    ];

    public function visit(): BelongsTo
    {
        return $this->belongsTo(MaintenanceVisit::class, 'maintenance_visit_id');
    }

    public function maintenanceProduct(): BelongsTo
    {
        return $this->belongsTo(MaintenanceProduct::class);
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($item) {
            // Auto-calculate total cost
            $item->total_cost = $item->quantity_used * $item->unit_cost;
        });

        static::updating(function ($item) {
            // Auto-calculate total cost
            $item->total_cost = $item->quantity_used * $item->unit_cost;
        });

        static::created(function ($item) {
            // Deduct from maintenance product stock
            $item->maintenanceProduct->updateStock($item->quantity_used, 'subtract');
        });

        static::deleted(function ($item) {
            // Add back to maintenance product stock
            $item->maintenanceProduct->updateStock($item->quantity_used, 'add');
        });
    }
}