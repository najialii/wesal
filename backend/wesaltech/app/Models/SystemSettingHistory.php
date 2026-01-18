<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SystemSettingHistory extends Model
{
    use HasFactory;

    protected $fillable = [
        'setting_key',
        'old_value',
        'new_value',
        'changed_by',
        'change_reason',
    ];

    protected $casts = [
        'old_value' => 'json',
        'new_value' => 'json',
    ];

    public function setting(): BelongsTo
    {
        return $this->belongsTo(SystemSetting::class, 'setting_key', 'key');
    }

    public function changedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}