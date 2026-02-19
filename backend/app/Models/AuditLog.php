<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'user_email',
        'user_name',
        'is_super_admin',
        'tenant_id',
        'action',
        'resource_type',
        'resource_id',
        'method',
        'url',
        'ip_address',
        'user_agent',
        'request_data',
        'request_headers',
        'response_status',
        'response_data',
        'execution_time',
        'session_id',
        'session_data',
        'performed_at',
    ];

    protected $casts = [
        'request_data' => 'array',
        'request_headers' => 'array',
        'response_data' => 'array',
        'session_data' => 'array',
        'performed_at' => 'datetime',
        'is_super_admin' => 'boolean',
        'execution_time' => 'float',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function scopeByUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeByAction($query, string $action)
    {
        return $query->where('action', $action);
    }

    public function scopeByResource($query, string $resourceType, ?string $resourceId = null)
    {
        $query->where('resource_type', $resourceType);
        
        if ($resourceId) {
            $query->where('resource_id', $resourceId);
        }

        return $query;
    }

    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('performed_at', [$startDate, $endDate]);
    }

    public function scopeErrors($query)
    {
        return $query->where('response_status', '>=', 400);
    }

    public function scopeCriticalActions($query)
    {
        $criticalActions = [
            'delete', 'suspend', 'activate', 'rollback', 'bulk_delete',
            'assign-plan', 'unassign-plan', 'import'
        ];

        return $query->whereIn('action', $criticalActions);
    }

    public function scopeSuperAdminActions($query)
    {
        return $query->where('is_super_admin', true);
    }

    public function scopeSlowRequests($query, float $threshold = 1000.0)
    {
        return $query->where('execution_time', '>', $threshold);
    }

    public function scopeByIpAddress($query, string $ipAddress)
    {
        return $query->where('ip_address', $ipAddress);
    }

    public function scopeBySessionId($query, string $sessionId)
    {
        return $query->where('session_id', $sessionId);
    }

    public function getFormattedActionAttribute(): string
    {
        return ucfirst(str_replace('_', ' ', $this->action));
    }

    public function getResourceDisplayNameAttribute(): string
    {
        if ($this->resource_type && $this->resource_id) {
            return ucfirst($this->resource_type) . " #{$this->resource_id}";
        }

        return ucfirst($this->resource_type ?? 'Unknown');
    }

    public function getExecutionTimeFormattedAttribute(): string
    {
        if (!$this->execution_time) {
            return 'N/A';
        }

        if ($this->execution_time < 1000) {
            return round($this->execution_time, 2) . 'ms';
        }

        return round($this->execution_time / 1000, 2) . 's';
    }

    public function getIsCriticalAttribute(): bool
    {
        $criticalActions = [
            'delete', 'suspend', 'activate', 'rollback', 'bulk_delete',
            'assign-plan', 'unassign-plan', 'import'
        ];

        return in_array($this->action, $criticalActions) || $this->response_status >= 400;
    }

    public function getRiskLevelAttribute(): string
    {
        if ($this->response_status >= 500) {
            return 'high';
        }

        if ($this->response_status >= 400 || $this->is_critical) {
            return 'medium';
        }

        if ($this->execution_time > 5000) { // > 5 seconds
            return 'medium';
        }

        return 'low';
    }
}