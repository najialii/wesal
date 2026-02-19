<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\LanguagePreferenceManager;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class LanguageController extends Controller
{
    public function __construct(
        private LanguagePreferenceManager $languageManager
    ) {}

    /**
     * Get available languages.
     */
    public function getAvailableLanguages(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->languageManager->getAvailableLocales(),
        ]);
    }

    /**
     * Get user's current language preference.
     */
    public function getUserLanguage(): JsonResponse
    {
        $user = Auth::user();
        $currentLanguage = $this->languageManager->resolveUserLocale($user);
        $userPreference = $this->languageManager->getUserLanguage($user);
        $tenantDefault = $user->tenant ? $this->languageManager->getTenantLanguage($user->tenant) : null;

        return response()->json([
            'success' => true,
            'data' => [
                'current_language' => $currentLanguage,
                'user_preference' => $userPreference,
                'tenant_default' => $tenantDefault,
                'app_default' => config('app.locale'),
            ],
        ]);
    }

    /**
     * Update user's language preference.
     */
    public function updateUserLanguage(Request $request): JsonResponse
    {
        $supportedLocales = array_keys($this->languageManager->getSupportedLocales());
        
        $request->validate([
            'language' => ['required', 'string', Rule::in($supportedLocales)],
        ]);

        try {
            $user = Auth::user();
            $this->languageManager->setUserLanguage($user, $request->language);

            return response()->json([
                'success' => true,
                'message' => __('messages.language_updated'),
                'data' => [
                    'language' => $request->language,
                    'current_language' => $this->languageManager->resolveUserLocale($user),
                ],
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'message' => __('messages.language_invalid'),
            ], 400);
        }
    }

    /**
     * Remove user's language preference (revert to tenant/app default).
     */
    public function removeUserLanguage(): JsonResponse
    {
        $user = Auth::user();
        $this->languageManager->removeUserLanguage($user);

        return response()->json([
            'success' => true,
            'message' => __('messages.language_updated'),
            'data' => [
                'current_language' => $this->languageManager->resolveUserLocale($user),
            ],
        ]);
    }

    /**
     * Get tenant's default language (admin only).
     */
    public function getTenantLanguage(): JsonResponse
    {
        $user = Auth::user();
        
        if (!$user->hasRole('tenant_admin')) {
            return response()->json([
                'success' => false,
                'message' => __('messages.unauthorized'),
            ], 403);
        }

        $tenant = $user->tenant;
        if (!$tenant) {
            return response()->json([
                'success' => false,
                'message' => __('messages.not_found'),
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'tenant_language' => $this->languageManager->getTenantLanguage($tenant),
                'app_default' => config('app.locale'),
            ],
        ]);
    }

    /**
     * Update tenant's default language (admin only).
     */
    public function updateTenantLanguage(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        if (!$user->hasRole('tenant_admin')) {
            return response()->json([
                'success' => false,
                'message' => __('messages.unauthorized'),
            ], 403);
        }

        $tenant = $user->tenant;
        if (!$tenant) {
            return response()->json([
                'success' => false,
                'message' => __('messages.not_found'),
            ], 404);
        }

        $supportedLocales = array_keys($this->languageManager->getSupportedLocales());
        
        $request->validate([
            'language' => ['required', 'string', Rule::in($supportedLocales)],
        ]);

        try {
            $this->languageManager->setTenantLanguage($tenant, $request->language);

            return response()->json([
                'success' => true,
                'message' => __('messages.language_updated'),
                'data' => [
                    'tenant_language' => $request->language,
                ],
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'message' => __('messages.language_invalid'),
            ], 400);
        }
    }
}