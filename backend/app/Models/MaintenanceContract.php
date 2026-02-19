<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use App\Traits\BelongsToBranch;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Carbon\Carbon;

class MaintenanceContract extends Model
{
    use HasFactory, BelongsToTenant, BelongsToBranch;

    protected $fillable = [
        'tenant_id',
        'branch_id',
        'sale_id',
        'product_id',
        'customer_id',
        'customer_name',
        'customer_phone',
        'customer_email',
        'customer_address',
        'assigned_technician_id',
        'frequency',
        'frequency_value',
        'frequency_unit',
        'start_date',
        'end_date',
        'contract_value',
        'maintenance_products',
        'special_instructions',
        'status',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'contract_value' => 'decimal:2',
        'maintenance_products' => 'array',
    ];

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class)->withoutGlobalScope('tenant');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class)->withoutGlobalScope('tenant');
    }

    public function assignedTechnician(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_technician_id');
    }

    public function visits(): HasMany
    {
        return $this->hasMany(MaintenanceVisit::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(MaintenanceContractItem::class)->withoutGlobalScope('tenant');
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeExpiringSoon($query, $days = 30)
    {
        return $query->where('end_date', '<=', now()->addDays($days))
                    ->where('status', 'active');
    }

    public function calculateNextVisitDate($fromDate = null): Carbon
    {
        $baseDate = $fromDate ? Carbon::parse($fromDate)->copy() : Carbon::parse($this->start_date)->copy();
        
        switch ($this->frequency) {
            case 'once':
                return $baseDate; // One-time service, no next visit
            case 'weekly':
                return $baseDate->addWeek();
            case 'monthly':
                return $baseDate->addMonth();
            case 'quarterly':
                return $baseDate->addMonths(3);
            case 'semi_annual':
                return $baseDate->addMonths(6);
            case 'annual':
                return $baseDate->addYear();
            case 'custom':
                return $this->addCustomFrequency($baseDate);
            default:
                return $baseDate->addMonth();
        }
    }

    private function addCustomFrequency(Carbon $date): Carbon
    {
        if (!$this->frequency_value || !$this->frequency_unit) {
            return $date->addMonth();
        }

        switch ($this->frequency_unit) {
            case 'days':
                return $date->addDays($this->frequency_value);
            case 'weeks':
                return $date->addWeeks($this->frequency_value);
            case 'months':
                return $date->addMonths($this->frequency_value);
            case 'years':
                return $date->addYears($this->frequency_value);
            default:
                return $date->addMonth();
        }
    }

    public function isExpired(): bool
    {
        return $this->end_date && $this->end_date->isPast();
    }

    public function getUpcomingVisit()
    {
        return $this->visits()
                   ->where('status', 'scheduled')
                   ->where('scheduled_date', '>=', now()->toDateString())
                   ->orderBy('scheduled_date')
                   ->first();
    }

    public function getLastCompletedVisit()
    {
        return $this->visits()
                   ->where('status', 'completed')
                   ->orderBy('actual_end_time', 'desc')
                   ->first();
    }
}