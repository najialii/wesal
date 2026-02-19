<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use App\Services\SettingsService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class SettingsController extends Controller
{
    protected SettingsService $settingsService;

    public function __construct(SettingsService $settingsService)
    {
        $this->settingsService = $settingsService;
    }

    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'category' => 'nullable|string',
            'search' => 'nullable|string',
        ]);

        $settings = $this->settingsService->getSettings($filters);

        return response()->json($settings);
    }

    public function show(string $key): JsonResponse
    {
        $setting = $this->settingsService->getSetting($key);

        if (!$setting) {
            return response()->json(['message' => 'Setting not found'], 404);
        }

        return response()->json($setting);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'settings' => 'required|array',
            'settings.*.key' => 'required|string',
            'settings.*.value' => 'required',
        ]);

        try {
            $updatedSettings = $this->settingsService->updateSettings(
                $validated['settings'],
                auth()->id()
            );

            return response()->json([
                'message' => 'Settings updated successfully',
                'settings' => $updatedSettings,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update settings',
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    public function create(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'key' => 'required|string|unique:system_settings,key',
            'value' => 'required',
            'category' => 'required|string',
            'type' => 'required|in:string,number,boolean,json,array',
            'description' => 'nullable|string',
            'is_public' => 'boolean',
        ]);

        $setting = $this->settingsService->createSetting($validated, auth()->id());

        return response()->json([
            'message' => 'Setting created successfully',
            'setting' => $setting,
        ], 201);
    }

    public function destroy(string $key): JsonResponse
    {
        $deleted = $this->settingsService->deleteSetting($key, auth()->id());

        if (!$deleted) {
            return response()->json(['message' => 'Setting not found'], 404);
        }

        return response()->json(['message' => 'Setting deleted successfully']);
    }

    public function history(string $key): JsonResponse
    {
        $history = $this->settingsService->getSettingHistory($key);

        return response()->json($history);
    }

    public function rollback(Request $request, string $key): JsonResponse
    {
        $validated = $request->validate([
            'version_id' => 'required|exists:system_setting_histories,id',
        ]);

        try {
            $setting = $this->settingsService->rollbackSetting(
                $key,
                $validated['version_id'],
                auth()->id()
            );

            return response()->json([
                'message' => 'Setting rolled back successfully',
                'setting' => $setting,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to rollback setting',
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    public function categories(): JsonResponse
    {
        $categories = $this->settingsService->getCategories();

        return response()->json($categories);
    }

    public function export(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'categories' => 'nullable|array',
            'format' => 'required|in:json,yaml,env',
        ]);

        $exportData = $this->settingsService->exportSettings(
            $validated['categories'] ?? [],
            $validated['format']
        );

        return response()->json([
            'filename' => $exportData['filename'],
            'content' => $exportData['content'],
            'download_url' => $exportData['url'],
        ]);
    }

    public function import(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'file' => 'required|file|mimes:json,yaml,txt',
            'merge_strategy' => 'required|in:overwrite,merge,skip_existing',
        ]);

        try {
            $result = $this->settingsService->importSettings(
                $validated['file'],
                $validated['merge_strategy'],
                auth()->id()
            );

            return response()->json([
                'message' => 'Settings imported successfully',
                'imported_count' => $result['imported'],
                'skipped_count' => $result['skipped'],
                'errors' => $result['errors'],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to import settings',
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    public function validateSettings(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'settings' => 'required|array',
            'settings.*.key' => 'required|string',
            'settings.*.value' => 'required',
            'settings.*.type' => 'required|in:string,number,boolean,json,array',
        ]);

        $validationResults = $this->settingsService->validateSettings($validated['settings']);

        return response()->json($validationResults);
    }
}