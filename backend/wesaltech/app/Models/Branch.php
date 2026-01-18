<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Branch extends Model
{
    use HasFactory, BelongsToTenant, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'name',
        'code',
        'address',
        'city',
        'phone',
        'email',
        'is_default',
        'is_active',
        'settings',
    ];

    protected $casts = [
        'is_default' => 'boolean',
        'is_active' => 'boolean',
        'settings' => 'array',
    ];

    /**
     * Get the tenant that owns the branch
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Get the users assigned to this branch
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'branch_user')
                    ->withPivot('is_manager')
                    ->withTimestamps();
    }

    /**
     * Get the products assigned to this branch
     */
    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'branch_product')
                    ->withPivot('stock_quantity', 'min_stock_level', 'selling_price', 'is_active')
                    ->withTimestamps();
    }

    /**
     * Get the sales for this branch
     */
    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }

    /**
     * Get the maintenance contracts for this branch
     */
    public function maintenanceContracts(): HasMany
    {
        return $this->hasMany(MaintenanceContract::class);
    }

    /**
     * Get the stock movements for this branch
     */
    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }

    /**
     * Scope to get only active branches
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to get the default branch
     */
    public function scopeDefault($query)
    {
        return $query->where('is_default', true);
    }

    /**
     * Check if branch is active
     */
    public function isActive(): bool
    {
        return $this->is_active === true;
    }

    /**
     * Check if branch is default
     */
    public function isDefault(): bool
    {
        return $this->is_default === true;
    }
}
