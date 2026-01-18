<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Customer extends Model
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'name',
        'phone',
        'secondary_phone',
        'address',
        'email',
        'type',
        'tax_number',
        'credit_limit',
        'current_balance',
        'is_active',
        'notes',
    ];

    protected $casts = [
        'credit_limit' => 'decimal:2',
        'current_balance' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }

    /**
     * Get sales for a specific branch
     */
    public function salesByBranch(int $branchId): HasMany
    {
        return $this->sales()->where('branch_id', $branchId);
    }

    /**
     * Get branches where customer has made purchases
     */
    public function visitedBranches()
    {
        return Branch::whereIn('id', function($query) {
            $query->select('branch_id')
                  ->from('sales')
                  ->where('customer_id', $this->id)
                  ->distinct();
        })->get();
    }

    /**
     * Get customer transaction history grouped by branch
     */
    public function getTransactionsByBranch()
    {
        return $this->sales()
                    ->with('branch')
                    ->get()
                    ->groupBy('branch_id');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeIndividual($query)
    {
        return $query->where('type', 'individual');
    }

    public function scopeBusiness($query)
    {
        return $query->where('type', 'business');
    }

    public function getDisplayNameAttribute(): string
    {
        $name = $this->name;
        if ($this->phone) {
            $name .= " ({$this->phone})";
        }
        return $name;
    }

    public function getTotalPurchasesAttribute(): float
    {
        return $this->sales()->sum('total_amount');
    }

    public function getLastPurchaseDateAttribute(): ?string
    {
        $lastSale = $this->sales()->latest()->first();
        return $lastSale ? $lastSale->created_at->format('Y-m-d') : null;
    }

    public function hasCredit(): bool
    {
        return $this->credit_limit > 0;
    }

    public function getAvailableCreditAttribute(): float
    {
        return max(0, $this->credit_limit - $this->current_balance);
    }

    public function canPurchase(float $amount): bool
    {
        if (!$this->hasCredit()) {
            return true; // No credit limit means cash only
        }
        
        return $this->getAvailableCreditAttribute() >= $amount;
    }
}