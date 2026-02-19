<?php

namespace App\Traits;

use App\Models\ModelTranslation;
use Illuminate\Database\Eloquent\Relations\MorphMany;

trait HasTranslations
{
    /**
     * Get all translations for this model
     */
    public function translations(): MorphMany
    {
        return $this->morphMany(ModelTranslation::class, 'model', 'model_type', 'model_id');
    }

    /**
     * Get translation for a specific field and locale
     */
    public function getTranslation(string $field, string $locale): ?string
    {
        return $this->translations()
            ->where('field_name', $field)
            ->where('locale', $locale)
            ->value('value');
    }

    /**
     * Set translation for a specific field and locale
     */
    public function setTranslation(string $field, string $locale, string $value): void
    {
        $this->translations()->updateOrCreate([
            'field_name' => $field,
            'locale' => $locale,
        ], [
            'value' => $value,
        ]);
    }

    /**
     * Get all translations for a specific field
     */
    public function getTranslationsForField(string $field): array
    {
        return $this->translations()
            ->where('field_name', $field)
            ->pluck('value', 'locale')
            ->toArray();
    }

    /**
     * Get translated value for field in current locale or fallback
     */
    public function getTranslatedAttribute(string $field, string $locale = 'en'): string
    {
        $translation = $this->getTranslation($field, $locale);
        
        if ($translation !== null) {
            return $translation;
        }

        // Return original field value if no translation exists
        return $this->getAttribute($field) ?? '';
    }

    /**
     * Set multiple translations for a field
     */
    public function setTranslationsForField(string $field, array $translations): void
    {
        foreach ($translations as $locale => $value) {
            if (in_array($locale, ['ar', 'en']) && !empty($value)) {
                $this->setTranslation($field, $locale, $value);
            }
        }
    }

    /**
     * Delete all translations for a specific field
     */
    public function deleteTranslationsForField(string $field): void
    {
        $this->translations()
            ->where('field_name', $field)
            ->delete();
    }

    /**
     * Check if translation exists for field and locale
     */
    public function hasTranslation(string $field, string $locale): bool
    {
        return $this->translations()
            ->where('field_name', $field)
            ->where('locale', $locale)
            ->exists();
    }

    /**
     * Get all translatable fields for this model
     */
    public function getTranslatableFields(): array
    {
        return property_exists($this, 'translatable') ? $this->translatable : [];
    }

    /**
     * Automatically load translations when model is loaded
     */
    public function loadTranslations(string $locale = 'en'): self
    {
        $this->load(['translations' => function ($query) use ($locale) {
            $query->where('locale', $locale);
        }]);

        return $this;
    }
}