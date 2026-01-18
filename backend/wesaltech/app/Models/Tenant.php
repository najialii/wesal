<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Tenant extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'domain',
        'logo',
        'address',
        'phone',
        'email',
        'tax_number',
        'cr_number',
        'plan_id',
        'admin_user_id',
        'status',
        'settings',
        'trial_ends_at',
        'subscription_ends_at',
        'created_by',
    ];

    protected $casts = [
        'settings' => 'array',
        'trial_ends_at' => 'datetime',
        'subscription_ends_at' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($tenant) {
            if (empty($tenant->slug)) {
                $tenant->slug = Str::slug($tenant->name);
            }
        });
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_user_id');
    }

    public function getAdminUser()
    {
        // If we have a specific admin_user_id, use that
        if ($this->admin_user_id) {
            return $this->admin;
        }
        
        // Otherwise, find the first user with admin role for this tenant
        return $this->users()->whereHas('roles', function($query) {
            $query->where('name', 'admin');
        })->first() ?: $this->users()->first();
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    // Tenant-specific data models (business operations)
    public function categories(): HasMany
    {
        return $this->hasMany(Category::class);
    }

    public function branches(): HasMany
    {
        return $this->hasMany(Branch::class);
    }

    public function workers(): HasMany
    {
        return $this->hasMany(Worker::class);
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }

    public function maintenanceSchedules(): HasMany
    {
        return $this->hasMany(MaintenanceSchedule::class);
    }

    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }

    // Legacy examples (can be removed later)
    public function posts(): HasMany
    {
        return $this->hasMany(Post::class);
    }

    public function projects(): HasMany
    {
        return $this->hasMany(Project::class);
    }

    // Helper methods
    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function isOnTrial(): bool
    {
        return $this->trial_ends_at && $this->trial_ends_at->isFuture();
    }

    public function hasExpired(): bool
    {
        return $this->subscription_ends_at && $this->subscription_ends_at->isPast();
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function getLogoUrlAttribute(): string
    {
        if ($this->logo) {
            return asset('storage/' . $this->logo);
        }
        
        // Generate a default logo using the organization name
        return 'https://ui-avatars.com/api/?name=' . urlencode($this->name) . '&color=7F9CF5&background=EBF4FF&size=200';
    }
}