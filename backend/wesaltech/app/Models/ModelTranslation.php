<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ModelTranslation extends Model
{
    protected $fillable = [
        'model_type',
        'model_id',
        'field_name',
        'locale',
        'value',
    ];

    protected $casts = [
        'locale' => 'string',
    ];

    /**
     * Get the owning translatable model.
     */
    public function model(): MorphTo
    {
        return $this->morphTo('model', 'model_type', 'model_id');
    }

    /**
     * Scope to filter by locale
     */
    public function scopeForLocale($query, string $locale)
    {
        return $query->where('locale', $locale);
    }

    /**
     * Scope to filter by field name
     */
    public function scopeForField($query, string $fieldName)
    {
        return $query->where('field_name', $fieldName);
    }

    /**
     * Scope to filter by model type and ID
     */
    public function scopeForModel($query, string $modelType, int $modelId)
    {
        return $query->where('model_type', $modelType)
                    ->where('model_id', $modelId);
    }
}
