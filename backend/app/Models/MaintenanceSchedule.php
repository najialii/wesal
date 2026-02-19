<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MaintenanceSchedule extends Model
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'title',
        'description',
        'equipment_name',
        'maintenance_type', // 'preventive', 'corrective', 'emergency'
        'priority', // 'low', 'medium', 'high', 'critical'
        'assigned_worker_id',
        'scheduled_date',
        'estimated_duration', // in hours
        'status', // 'scheduled', 'in_progress', 'completed', 'cancelled'
        'actual_start_time',  
        'actual_end_time',
        'cost',
        'notes',
        'completion_notes',
    ];

    protected $casts = [
        'scheduled_date' => 'datetime',
        'actual_start_time' => 'datetime',
        'actual_end_time' => 'datetime',
        'estimated_duration' => 'decimal:2',
        'cost' => 'decimal:2',
    ];

    public function assignedWorker(): BelongsTo
    {
        return $this->belongsTo(Worker::class, 'assigned_worker_id');
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
        return $query->where('scheduled_date', '<', now())
                    ->whereIn('status', ['scheduled', 'in_progress']);
    }

    public function scopeUpcoming($query, $days = 7)
    {
        return $query->where('scheduled_date', '>=', now())
                    ->where('scheduled_date', '<=', now()->addDays($days))
                    ->where('status', 'scheduled');
    }

    public function isOverdue(): bool
    {
        return $this->scheduled_date->isPast() && 
               in_array($this->status, ['scheduled', 'in_progress']);
    }

    public function getActualDurationAttribute(): ?float
    {
        if ($this->actual_start_time && $this->actual_end_time) {
            return $this->actual_start_time->diffInHours($this->actual_end_time, true);
        }
        return null;
    }
}