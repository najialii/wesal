<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use App\Traits\HasTranslations;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Worker extends Model
{
    use HasFactory, BelongsToTenant, HasTranslations;

    protected $fillable = [
        'tenant_id',
        'name',
        'phone',
        'email',
        'national_id',
        'job_title',
        'salary',
        'hire_date',
        'is_active',
        'skills',
        'notes',
    ];

    protected $casts = [
        'hire_date' => 'date',
        'is_active' => 'boolean',
        'skills' => 'array',
        'salary' => 'decimal:2',
    ];

    /**
     * Fields that can be translated
     */
    protected $translatable = ['job_title'];

    public function maintenanceAssignments(): HasMany
    {
        return $this->hasMany(MaintenanceSchedule::class, 'assigned_worker_id');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeBySkill($query, $skill)
    {
        return $query->whereJsonContains('skills', $skill);
    }
}