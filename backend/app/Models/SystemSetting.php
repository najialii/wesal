<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SystemSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'value',
        'category',
        'type',
        'description',
        'is_public',
        'updated_by',
    ];

    protected $casts = [
        'value' => 'json',
        'is_public' => 'boolean',
    ];

    public function histories(): HasMany
    {
        return $this->hasMany(SystemSettingHistory::class, 'setting_key', 'key');
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function getFormattedValueAttribute()
    {
        return match ($this->type) {
            'boolean' => (bool) $this->value,
            'number' => is_numeric($this->value) ? (float) $this->value : $this->value,
            'json', 'array' => is_string($this->value) ? json_decode($this->value, true) : $this->value,
            default => (string) $this->value,
        };
    }

    public function scopeByCategory($query, string $category)
    {
        return $query->where('category', $category);
    }

    public function scopePublic($query)
    {
        return $query->where('is_public', true);
    }

    public function scopeSearch($query, string $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('key', 'like', "%{$search}%")
              ->orWhere('description', 'like', "%{$search}%")
              ->orWhere('category', 'like', "%{$search}%");
        });
    }
}