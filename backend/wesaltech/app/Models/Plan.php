<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Plan extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'price',
        'billing_cycle',
        'features',
        'limits',
        'is_active',
        'trial_days',
        'sort_order',
    ];

    protected $casts = [
        'features' => 'array',
        'limits' => 'array',
        'is_active' => 'boolean',
        'price' => 'decimal:2',
    ];

    public function tenants(): HasMany
    {
        return $this->hasMany(Tenant::class);
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    public function getFormattedPriceAttribute(): string
    {
        return '$' . number_format($this->price, 2);
    }

    public function hasFeature(string $feature): bool
    {
        return in_array($feature, $this->features ?? []);
    }

    public function getLimit(string $key, int $default = 0): int
    {
        return $this->limits[$key] ?? $default;
    }
}