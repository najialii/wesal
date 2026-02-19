<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use App\Traits\BelongsToBranch;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MaintenanceVisit extends Model
{
    use HasFactory, BelongsToTenant, BelongsToBranch;

    protected $fillable = [
        'tenant_id',
        'branch_id',
        'maintenance_contract_id',
        'assigned_technician_id',
        'scheduled_date',
        'scheduled_time',
        'actual_start_time',
        'actual_end_time',
        'status',
        'priority',
        'work_description',
        'completion_notes',
        'customer_feedback',
        'customer_rating',
        'total_cost',
        'photos',
        'next_visit_date',
    ];

    protected $casts = [
        'scheduled_date' => 'date',
        'scheduled_time' => 'datetime:H:i',
        'actual_start_time' => 'datetime',
        'actual_end_time' => 'datetime',
        'total_cost' => 'decimal:2',
        'photos' => 'array',
        'next_visit_date' => 'date',
    ];

    public function contract(): BelongsTo
    {
        return $this->belongsTo(MaintenanceContract::class, 'maintenance_contract_id');
    }

    public function assignedWorker(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_technician_id');
    }

    public function assignedTechnician(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_technician_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(MaintenanceVisitItem::class);
    }

    public function customer()
    {
        return $this->contract ? $this->contract->customer : null;
    }

    public function scopeScheduled($query)
    {
        return $query->where('status', 'scheduled');
    }

    public function scopeInProgress($query)
    {
        return $query->where('status', 'in_progress');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeOverdue($query)
    {
        return $query->where('scheduled_date', '<', now()->toDateString())
                    ->whereIn('status', ['scheduled']);
    }

    public function scopeUpcoming($query, $days = 7)
    {
        return $query->where('scheduled_date', '>=', now()->toDateString())
                    ->where('scheduled_date', '<=', now()->addDays($days)->toDateString())
                    ->where('status', 'scheduled');
    }

    public function scopeToday($query)
    {
        return $query->where('scheduled_date', now()->toDateString());
    }

    public function scopeByWorker($query, $workerId)
    {
        return $query->where('assigned_technician_id', $workerId);
    }

    public function scopeByTechnician($query, $technicianId)
    {
        return $query->where('assigned_technician_id', $technicianId);
    }

    public function scopeByPriority($query, $priority)
    {
        return $query->where('priority', $priority);
    }

    public function isOverdue(): bool
    {
        return $this->scheduled_date->isPast() && $this->status === 'scheduled';
    }

    public function getActualDurationAttribute(): ?float
    {
        if ($this->actual_start_time && $this->actual_end_time) {
            return $this->actual_start_time->diffInHours($this->actual_end_time, true);
        }
        return null;
    }

    public function calculateTotalCost(): float
    {
        return $this->items->sum('total_cost');
    }

    public function markAsCompleted($completionNotes = null, $photos = null)
    {
        $this->update([
            'status' => 'completed',
            'actual_end_time' => now(),
            'completion_notes' => $completionNotes,
            'photos' => $photos,
            'total_cost' => $this->calculateTotalCost(),
        ]);

        // Calculate and create next visit
        $this->createNextVisit();
    }

    public function createNextVisit()
    {
        $contract = $this->contract;
        
        if ($contract->status !== 'active' || $contract->isExpired()) {
            return null;
        }

        $nextDate = $contract->calculateNextVisitDate($this->actual_end_time ?? $this->scheduled_date);
        
        // Don't create if beyond contract end date
        if ($contract->end_date && $nextDate->gt($contract->end_date)) {
            return null;
        }

        return self::create([
            'tenant_id' => $this->tenant_id,
            'branch_id' => $this->branch_id,
            'maintenance_contract_id' => $this->maintenance_contract_id,
            'scheduled_date' => $nextDate,
            'status' => 'scheduled',
            'priority' => 'medium',
        ]);
    }
}