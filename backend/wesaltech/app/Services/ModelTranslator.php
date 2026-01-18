<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Category;
use App\Models\Worker;
use App\Models\ModelTranslation;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class ModelTranslator
{
    private const CACHE_TTL = 3600; // 1 hour
    private const CACHE_PREFIX = 'model_translation:';

    /**
     * Get cache key for model translations
     */
    private function getCacheKey(string $modelType, int $modelId, string $locale): string
    {
        return self::CACHE_PREFIX . "{$modelType}:{$modelId}:{$locale}";
    }

    /**
     * Get cache key for field translation
     */
    private function getFieldCacheKey(string $modelType, int $modelId, string $field, string $locale): string
    {
        return self::CACHE_PREFIX . "field:{$modelType}:{$modelId}:{$field}:{$locale}";
    }

    /**
     * Clear cache for a model
     */
    private function clearModelCache(string $modelType, int $modelId): void
    {
        foreach (['ar', 'en'] as $locale) {
            Cache::forget($this->getCacheKey($modelType, $modelId, $locale));
            
            // Clear field-specific caches
            $model = $this->getModelInstance($modelType, $modelId);
            if ($model && method_exists($model, 'getTranslatableFields')) {
                foreach ($model->getTranslatableFields() as $field) {
                    Cache::forget($this->getFieldCacheKey($modelType, $modelId, $field, $locale));
                }
            }
        }
    }

    /**
     * Get model instance by type and ID
     */
    private function getModelInstance(string $modelType, int $modelId): ?Model
    {
        $modelClass = "App\\Models\\{$modelType}";
        if (!class_exists($modelClass)) {
            return null;
        }
        return $modelClass::find($modelId);
    }

    /**
     * Translate Product model
     */
    public function translateProduct(Product $product, string $locale): Product
    {
        $cacheKey = $this->getCacheKey('Product', $product->id, $locale);
        
        $translations = Cache::remember($cacheKey, self::CACHE_TTL, function () use ($product, $locale) {
            $product->loadTranslations($locale);
            $translationData = [];
            
            foreach ($product->getTranslatableFields() as $field) {
                $translation = $product->getTranslation($field, $locale);
                if ($translation !== null) {
                    $translationData[$field] = $translation;
                }
            }
            
            return $translationData;
        });

        // Apply cached translations
        foreach ($translations as $field => $value) {
            $product->setAttribute($field, $value);
        }

        return $product;
    }

    /**
     * Translate Category model
     */
    public function translateCategory(Category $category, string $locale): Category
    {
        $cacheKey = $this->getCacheKey('Category', $category->id, $locale);
        
        $translations = Cache::remember($cacheKey, self::CACHE_TTL, function () use ($category, $locale) {
            $category->loadTranslations($locale);
            $translationData = [];
            
            foreach ($category->getTranslatableFields() as $field) {
                $translation = $category->getTranslation($field, $locale);
                if ($translation !== null) {
                    $translationData[$field] = $translation;
                }
            }
            
            return $translationData;
        });

        // Apply cached translations
        foreach ($translations as $field => $value) {
            $category->setAttribute($field, $value);
        }

        return $category;
    }

    /**
     * Translate Worker model
     */
    public function translateWorker(Worker $worker, string $locale): Worker
    {
        $cacheKey = $this->getCacheKey('Worker', $worker->id, $locale);
        
        $translations = Cache::remember($cacheKey, self::CACHE_TTL, function () use ($worker, $locale) {
            $worker->loadTranslations($locale);
            $translationData = [];
            
            foreach ($worker->getTranslatableFields() as $field) {
                $translation = $worker->getTranslation($field, $locale);
                if ($translation !== null) {
                    $translationData[$field] = $translation;
                }
            }
            
            return $translationData;
        });

        // Apply cached translations
        foreach ($translations as $field => $value) {
            $worker->setAttribute($field, $value);
        }

        return $worker;
    }

    /**
     * Translate a specific field for any model
     */
    public function translateField(string $modelType, int $modelId, string $field, string $locale): ?string
    {
        $cacheKey = $this->getFieldCacheKey($modelType, $modelId, $field, $locale);
        
        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($modelType, $modelId, $field, $locale) {
            return ModelTranslation::where('model_type', $modelType)
                ->where('model_id', $modelId)
                ->where('field_name', $field)
                ->where('locale', $locale)
                ->value('value');
        });
    }

    /**
     * Store translation for a specific field
     */
    public function storeTranslation(string $modelType, int $modelId, string $field, string $locale, string $value): void
    {
        // Validate locale
        if (!in_array($locale, ['ar', 'en'])) {
            throw new \InvalidArgumentException("Invalid locale: {$locale}. Only 'ar' and 'en' are supported.");
        }

        // Validate model type
        $allowedModels = ['Product', 'Category', 'Worker'];
        if (!in_array($modelType, $allowedModels)) {
            throw new \InvalidArgumentException("Invalid model type: {$modelType}");
        }

        ModelTranslation::updateOrCreate([
            'model_type' => $modelType,
            'model_id' => $modelId,
            'field_name' => $field,
            'locale' => $locale,
        ], [
            'value' => $value,
        ]);

        // Clear cache for this model
        $this->clearModelCache($modelType, $modelId);
    }

    /**
     * Translate a collection of models
     */
    public function translateCollection($models, string $locale)
    {
        if ($models->isEmpty()) {
            return $models;
        }

        // Get the model class from the first item
        $firstModel = $models->first();
        $modelClass = get_class($firstModel);

        // Bulk load translations for all models in the collection
        $modelIds = $models->pluck('id')->toArray();
        $modelType = class_basename($modelClass);

        // Try to get translations from cache first
        $cachedTranslations = [];
        $uncachedIds = [];

        foreach ($modelIds as $modelId) {
            $cacheKey = $this->getCacheKey($modelType, $modelId, $locale);
            $cached = Cache::get($cacheKey);
            
            if ($cached !== null) {
                $cachedTranslations[$modelId] = $cached;
            } else {
                $uncachedIds[] = $modelId;
            }
        }

        // Load uncached translations from database
        $dbTranslations = [];
        if (!empty($uncachedIds)) {
            $translations = ModelTranslation::where('model_type', $modelType)
                ->whereIn('model_id', $uncachedIds)
                ->where('locale', $locale)
                ->get()
                ->groupBy('model_id');

            foreach ($uncachedIds as $modelId) {
                $modelTranslations = $translations->get($modelId, collect());
                $translationData = [];
                
                foreach ($modelTranslations as $translation) {
                    $translationData[$translation->field_name] = $translation->value;
                }
                
                $dbTranslations[$modelId] = $translationData;
                
                // Cache the translations
                $cacheKey = $this->getCacheKey($modelType, $modelId, $locale);
                Cache::put($cacheKey, $translationData, self::CACHE_TTL);
            }
        }

        // Merge cached and database translations
        $allTranslations = array_merge($cachedTranslations, $dbTranslations);

        // Apply translations to each model
        return $models->map(function ($model) use ($allTranslations, $locale) {
            $modelTranslations = $allTranslations[$model->id] ?? [];
            
            foreach ($model->getTranslatableFields() as $field) {
                if (isset($modelTranslations[$field])) {
                    $model->setAttribute($field, $modelTranslations[$field]);
                }
            }

            return $model;
        });
    }

    /**
     * Get all translations for a model
     */
    public function getAllTranslations(Model $model): array
    {
        $modelType = class_basename(get_class($model));
        $cacheKey = self::CACHE_PREFIX . "all:{$modelType}:{$model->id}";
        
        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($model, $modelType) {
            return ModelTranslation::where('model_type', $modelType)
                ->where('model_id', $model->id)
                ->get()
                ->groupBy('field_name')
                ->map(function ($translations) {
                    return $translations->pluck('value', 'locale')->toArray();
                })
                ->toArray();
        });
    }

    /**
     * Delete all translations for a model
     */
    public function deleteModelTranslations(Model $model): void
    {
        $modelType = class_basename(get_class($model));
        
        ModelTranslation::where('model_type', $modelType)
            ->where('model_id', $model->id)
            ->delete();

        // Clear cache
        $this->clearModelCache($modelType, $model->id);
        Cache::forget(self::CACHE_PREFIX . "all:{$modelType}:{$model->id}");
    }

    /**
     * Copy translations from one model to another
     */
    public function copyTranslations(Model $sourceModel, Model $targetModel): void
    {
        $sourceType = class_basename(get_class($sourceModel));
        $targetType = class_basename(get_class($targetModel));

        $translations = ModelTranslation::where('model_type', $sourceType)
            ->where('model_id', $sourceModel->id)
            ->get();

        foreach ($translations as $translation) {
            ModelTranslation::create([
                'model_type' => $targetType,
                'model_id' => $targetModel->id,
                'field_name' => $translation->field_name,
                'locale' => $translation->locale,
                'value' => $translation->value,
            ]);
        }

        // Clear cache for target model
        $this->clearModelCache($targetType, $targetModel->id);
    }

    /**
     * Bulk store translations for multiple models
     */
    public function bulkStoreTranslations(array $translationsData): void
    {
        DB::transaction(function () use ($translationsData) {
            $modelsToInvalidate = [];
            
            foreach ($translationsData as $data) {
                $this->storeTranslation(
                    $data['model_type'],
                    $data['model_id'],
                    $data['field_name'],
                    $data['locale'],
                    $data['value']
                );
                
                $modelsToInvalidate["{$data['model_type']}:{$data['model_id']}"] = true;
            }

            // Clear cache for all affected models
            foreach (array_keys($modelsToInvalidate) as $modelKey) {
                [$modelType, $modelId] = explode(':', $modelKey);
                $this->clearModelCache($modelType, (int)$modelId);
            }
        });
    }

    /**
     * Clear all translation caches
     */
    public function clearAllCaches(): void
    {
        // This is a simple implementation - in production you might want to use cache tags
        $models = ['Product', 'Category', 'Worker'];
        
        foreach ($models as $modelType) {
            $modelClass = "App\\Models\\{$modelType}";
            if (class_exists($modelClass)) {
                $modelClass::chunk(100, function ($models) use ($modelType) {
                    foreach ($models as $model) {
                        $this->clearModelCache($modelType, $model->id);
                        Cache::forget(self::CACHE_PREFIX . "all:{$modelType}:{$model->id}");
                    }
                });
            }
        }
    }

    /**
     * Get translation statistics
     */
    public function getTranslationStats(): array
    {
        return [
            'total_translations' => ModelTranslation::count(),
            'by_locale' => ModelTranslation::select('locale', DB::raw('count(*) as count'))
                ->groupBy('locale')
                ->pluck('count', 'locale')
                ->toArray(),
            'by_model_type' => ModelTranslation::select('model_type', DB::raw('count(*) as count'))
                ->groupBy('model_type')
                ->pluck('count', 'model_type')
                ->toArray(),
            'by_field' => ModelTranslation::select('field_name', DB::raw('count(*) as count'))
                ->groupBy('field_name')
                ->pluck('count', 'field_name')
                ->toArray(),
        ];
    }

    /**
     * Validate translation data integrity
     */
    public function validateTranslationIntegrity(): array
    {
        $issues = [];

        // Check for orphaned translations (model no longer exists)
        $orphanedTranslations = ModelTranslation::select('model_type', 'model_id')
            ->distinct()
            ->get()
            ->filter(function ($translation) {
                $modelClass = "App\\Models\\{$translation->model_type}";
                if (!class_exists($modelClass)) {
                    return true;
                }
                return !$modelClass::find($translation->model_id);
            });

        if ($orphanedTranslations->isNotEmpty()) {
            $issues['orphaned_translations'] = $orphanedTranslations->toArray();
        }

        // Check for missing translations (models without required translations)
        $modelsWithoutTranslations = [];
        
        foreach (['Product', 'Category', 'Worker'] as $modelType) {
            $modelClass = "App\\Models\\{$modelType}";
            if (class_exists($modelClass)) {
                $models = $modelClass::all();
                foreach ($models as $model) {
                    if (method_exists($model, 'getTranslatableFields')) {
                        foreach ($model->getTranslatableFields() as $field) {
                            foreach (['ar', 'en'] as $locale) {
                                if (!$model->hasTranslation($field, $locale)) {
                                    $modelsWithoutTranslations[] = [
                                        'model_type' => $modelType,
                                        'model_id' => $model->id,
                                        'field' => $field,
                                        'locale' => $locale,
                                    ];
                                }
                            }
                        }
                    }
                }
            }
        }

        if (!empty($modelsWithoutTranslations)) {
            $issues['missing_translations'] = $modelsWithoutTranslations;
        }

        return $issues;
    }
}