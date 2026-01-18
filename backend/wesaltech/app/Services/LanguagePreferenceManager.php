<?php

namespace App\Services;

use App\Models\User;
use App\Models\Tenant;
use Illuminate\Support\Facades\Config;

class LanguagePreferenceManager
{
    /**
     * Set user's language preference.
     */
    public function setUserLanguage(User $user, string $locale): void
    {
        if (!$this->isValidLocale($locale)) {
            throw new \InvalidArgumentException("Invalid locale: {$locale}");
        }

        $user->update(['language_preference' => $locale]);
    }

    /**
     * Set tenant's default language.
     */
    public function setTenantLanguage(Tenant $tenant, string $locale): void
    {
        if (!$this->isValidLocale($locale)) {
            throw new \InvalidArgumentException("Invalid locale: {$locale}");
        }

        $tenant->update(['default_language' => $locale]);
    }

    /**
     * Get user's language preference.
     */
    public function getUserLanguage(User $user): ?string
    {
        return $user->language_preference;
    }

    /**
     * Get tenant's default language.
     */
    public function getTenantLanguage(Tenant $tenant): ?string
    {
        return $tenant->default_language;
    }

    /**
     * Resolve the effective locale for a user.
     */
    public function resolveUserLocale(User $user): string
    {
        // Priority: User preference > Tenant default > App default
        
        // 1. Check user's personal preference
        if ($user->language_preference && $this->isValidLocale($user->language_preference)) {
            return $user->language_preference;
        }

        // 2. Check tenant's default language
        if ($user->tenant && $user->tenant->default_language && $this->isValidLocale($user->tenant->default_language)) {
            return $user->tenant->default_language;
        }

        // 3. Fall back to application default
        return Config::get('app.locale', 'en');
    }

    /**
     * Get all supported locales.
     */
    public function getSupportedLocales(): array
    {
        return Config::get('app.supported_locales', []);
    }

    /**
     * Get available locales for selection.
     */
    public function getAvailableLocales(): array
    {
        $locales = [];
        foreach ($this->getSupportedLocales() as $code => $config) {
            $locales[] = [
                'code' => $code,
                'name' => $config['name'],
                'native' => $config['native'],
                'direction' => $config['direction'],
                'flag' => $config['flag'],
            ];
        }
        return $locales;
    }

    /**
     * Check if the given locale is supported.
     */
    public function isValidLocale(string $locale): bool
    {
        return array_key_exists($locale, $this->getSupportedLocales());
    }

    /**
     * Remove user's language preference (revert to tenant/app default).
     */
    public function removeUserLanguage(User $user): void
    {
        $user->update(['language_preference' => null]);
    }

    /**
     * Get locale configuration for a specific locale.
     */
    public function getLocaleConfig(string $locale): ?array
    {
        $supportedLocales = $this->getSupportedLocales();
        return $supportedLocales[$locale] ?? null;
    }

    /**
     * Check if a locale is RTL (right-to-left).
     */
    public function isRTL(string $locale): bool
    {
        $config = $this->getLocaleConfig($locale);
        return $config && ($config['direction'] ?? 'ltr') === 'rtl';
    }
}