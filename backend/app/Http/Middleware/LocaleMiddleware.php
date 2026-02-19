<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class LocaleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $locale = $this->resolveLocale($request);
        App::setLocale($locale);
        
        return $next($request);
    }

    /**
     * Resolve the locale for the current request.
     */
    private function resolveLocale(Request $request): string
    {
        // Priority: User preference > Tenant default > Accept-Language > App default
        
        // 1. Check authenticated user's language preference
        if (Auth::check() && Auth::user()->language_preference) {
            $userLocale = Auth::user()->language_preference;
            if ($this->isValidLocale($userLocale)) {
                return $userLocale;
            }
        }

        // 2. Check tenant's default language
        if (Auth::check() && Auth::user()->tenant && Auth::user()->tenant->default_language) {
            $tenantLocale = Auth::user()->tenant->default_language;
            if ($this->isValidLocale($tenantLocale)) {
                return $tenantLocale;
            }
        }

        // 3. Check Accept-Language header
        $acceptLanguage = $request->header('Accept-Language');
        if ($acceptLanguage) {
            $preferredLocale = $this->parseAcceptLanguage($acceptLanguage);
            if ($preferredLocale && $this->isValidLocale($preferredLocale)) {
                return $preferredLocale;
            }
        }

        // 4. Fall back to application default
        return config('app.locale', 'en');
    }

    /**
     * Check if the given locale is supported.
     */
    private function isValidLocale(string $locale): bool
    {
        return array_key_exists($locale, config('app.supported_locales', []));
    }

    /**
     * Parse Accept-Language header and return the best matching locale.
     */
    private function parseAcceptLanguage(string $acceptLanguage): ?string
    {
        $supportedLocales = array_keys(config('app.supported_locales', []));
        
        // Parse Accept-Language header
        $languages = [];
        foreach (explode(',', $acceptLanguage) as $lang) {
            $parts = explode(';q=', trim($lang));
            $code = trim($parts[0]);
            $quality = isset($parts[1]) ? (float) $parts[1] : 1.0;
            
            // Extract language code (e.g., 'en' from 'en-US')
            $langCode = explode('-', $code)[0];
            
            if (in_array($langCode, $supportedLocales)) {
                $languages[$langCode] = $quality;
            }
        }

        if (empty($languages)) {
            return null;
        }

        // Sort by quality and return the best match
        arsort($languages);
        return array_key_first($languages);
    }
}