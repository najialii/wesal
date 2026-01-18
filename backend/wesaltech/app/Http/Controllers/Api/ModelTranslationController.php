<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ModelTranslator;
use App\Models\ModelTranslation;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

class ModelTranslationController extends Controller
{
    private ModelTranslator $translator;

    public function __construct(ModelTranslator $translator)
    {
        $this->translator = $translator;
    }

    /**
     * Store a new model translation
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'model_type' => ['required', 'string', Rule::in(['Product', 'Category', 'Worker'])],
            'model_id' => 'required|integer|min:1',
            'field_name' => 'required|string|max:255',
            'locale' => ['required', 'string', Rule::in(['ar', 'en'])],
            'value' => 'required|string|max:65535',
        ]);

        try {
            $this->translator->storeTranslation(
                $validated['model_type'],
                $validated['model_id'],
                $validated['field_name'],
                $validated['locale'],
                $validated['value']
            );

            return response()->json([
                'success' => true,
                'message' => 'Translation stored successfully',
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to store translation: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get all translations for a specific model
     */
    public function show(string $modelType, int $modelId): JsonResponse
    {
        // Validate model type
        if (!in_array($modelType, ['Product', 'Category', 'Worker'])) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid model type',
            ], 400);
        }

        try {
            $translations = ModelTranslation::where('model_type', $modelType)
                ->where('model_id', $modelId)
                ->get()
                ->groupBy('field_name')
                ->map(function ($translations) {
                    return $translations->pluck('value', 'locale')->toArray();
                });

            return response()->json([
                'success' => true,
                'data' => $translations,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve translations: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update a model translation
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'value' => 'required|string|max:65535',
        ]);

        try {
            $translation = ModelTranslation::findOrFail($id);
            $translation->update(['value' => $validated['value']]);

            return response()->json([
                'success' => true,
                'message' => 'Translation updated successfully',
                'data' => $translation,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update translation: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete a model translation
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $translation = ModelTranslation::findOrFail($id);
            $translation->delete();

            return response()->json([
                'success' => true,
                'message' => 'Translation deleted successfully',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete translation: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Bulk store translations
     */
    public function bulkStore(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'translations' => 'required|array|min:1',
            'translations.*.model_type' => ['required', 'string', Rule::in(['Product', 'Category', 'Worker'])],
            'translations.*.model_id' => 'required|integer|min:1',
            'translations.*.field_name' => 'required|string|max:255',
            'translations.*.locale' => ['required', 'string', Rule::in(['ar', 'en'])],
            'translations.*.value' => 'required|string|max:65535',
        ]);

        try {
            $this->translator->bulkStoreTranslations($validated['translations']);

            return response()->json([
                'success' => true,
                'message' => 'Bulk translations stored successfully',
                'count' => count($validated['translations']),
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to store bulk translations: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get translation statistics
     */
    public function statistics(): JsonResponse
    {
        try {
            $stats = $this->translator->getTranslationStats();

            return response()->json([
                'success' => true,
                'data' => $stats,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve statistics: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Validate translation integrity
     */
    public function validateIntegrity(): JsonResponse
    {
        try {
            $issues = $this->translator->validateTranslationIntegrity();

            return response()->json([
                'success' => true,
                'data' => [
                    'has_issues' => !empty($issues),
                    'issues' => $issues,
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to validate integrity: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Sync translations (for future implementation)
     */
    public function sync(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'last_sync' => 'nullable|date',
            'locale' => ['nullable', 'string', Rule::in(['ar', 'en'])],
        ]);

        try {
            // For now, just return current translations
            // In a full implementation, this would handle incremental sync
            
            $query = ModelTranslation::query();
            
            if (isset($validated['last_sync'])) {
                $query->where('updated_at', '>', $validated['last_sync']);
            }
            
            if (isset($validated['locale'])) {
                $query->where('locale', $validated['locale']);
            }
            
            $translations = $query->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'translations' => $translations,
                    'sync_timestamp' => now()->toISOString(),
                    'has_more' => false, // For pagination in future
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to sync translations: ' . $e->getMessage(),
            ], 500);
        }
    }
}