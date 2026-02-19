<?php

namespace App\Services;

use Illuminate\Support\Facades\Lang;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class TranslationService
{
    /**
     * Translate a key with parameters.
     */
    public function translate(string $key, array $parameters = [], ?string $locale = null): string
    {
        $locale = $locale ?: app()->getLocale();
        
        if (Lang::has($key, $locale)) {
            return Lang::get($key, $parameters, $locale);
        }

        // Log missing translation
        $this->logMissingTranslation($key, $locale);

        // Return fallback translation
        return $this->translateWithFallback($key, $parameters);
    }

    /**
     * Translate with fallback to default locale.
     */
    public function translateWithFallback(string $key, array $parameters = []): string
    {
        $fallbackLocale = config('app.fallback_locale', 'en');
        
        if (Lang::has($key, $fallbackLocale)) {
            return Lang::get($key, $parameters, $fallbackLocale);
        }

        // If even fallback doesn't exist, return the key itself
        return $key;
    }

    /**
     * Log missing translation key.
     */
    public function logMissingTranslation(string $key, string $locale): void
    {
        try {
            $user = Auth::user();
            $context = [
                'key' => $key,
                'locale' => $locale,
                'user_id' => $user?->id,
                'tenant_id' => $user?->tenant_id,
                'url' => request()->url(),
                'user_agent' => request()->userAgent(),
            ];

            // Log to database
            DB::table('translation_logs')->insert([
                'translation_key' => $key,
                'locale' => $locale,
                'context' => json_encode($context),
                'user_id' => $user?->id,
                'tenant_id' => $user?->tenant_id,
                'created_at' => now(),
            ]);

            // Log to application log in development
            if (app()->environment('local', 'development')) {
                Log::warning("Missing translation key: {$key} for locale: {$locale}", $context);
            }
        } catch (\Exception $e) {
            // Don't let translation logging break the application
            Log::error("Failed to log missing translation: " . $e->getMessage());
        }
    }

    /**
     * Get available locales.
     */
    public function getAvailableLocales(): array
    {
        return array_keys(config('app.supported_locales', []));
    }

    /**
     * Check if a translation key exists.
     */
    public function hasTranslation(string $key, ?string $locale = null): bool
    {
        $locale = $locale ?: app()->getLocale();
        return Lang::has($key, $locale);
    }

    /**
     * Get all translations for a namespace.
     */
    public function getNamespaceTranslations(string $namespace, ?string $locale = null): array
    {
        $locale = $locale ?: app()->getLocale();
        
        try {
            return Lang::get($namespace, [], $locale);
        } catch (\Exception $e) {
            $this->logMissingTranslation($namespace, $locale);
            return [];
        }
    }

    /**
     * Translate with pluralization support.
     */
    public function translateChoice(string $key, int $number, array $parameters = [], ?string $locale = null): string
    {
        $locale = $locale ?: app()->getLocale();
        
        if (Lang::has($key, $locale)) {
            return Lang::choice($key, $number, $parameters, $locale);
        }

        // Log missing translation
        $this->logMissingTranslation($key, $locale);

        // Try fallback
        $fallbackLocale = config('app.fallback_locale', 'en');
        if (Lang::has($key, $fallbackLocale)) {
            return Lang::choice($key, $number, $parameters, $fallbackLocale);
        }

        return $key;
    }

    /**
     * Get translation statistics for a locale.
     */
    public function getTranslationStats(string $locale): array
    {
        $supportedLocales = config('app.supported_locales', []);
        if (!array_key_exists($locale, $supportedLocales)) {
            return [];
        }

        // Count missing translations in the last 30 days
        $missingCount = DB::table('translation_logs')
            ->where('locale', $locale)
            ->where('created_at', '>=', now()->subDays(30))
            ->distinct('translation_key')
            ->count();

        return [
            'locale' => $locale,
            'missing_translations_30d' => $missingCount,
            'is_rtl' => ($supportedLocales[$locale]['direction'] ?? 'ltr') === 'rtl',
        ];
    }

    /**
     * Clear old translation logs.
     */
    public function clearOldLogs(int $days = 90): int
    {
        return DB::table('translation_logs')
            ->where('created_at', '<', now()->subDays($days))
            ->delete();
    }
}