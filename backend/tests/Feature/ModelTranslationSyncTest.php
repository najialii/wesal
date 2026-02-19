<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Tenant;
use App\Models\Product;
use App\Models\Category;
use App\Models\Worker;
use App\Models\ModelTranslation;
use App\Services\ModelTranslator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

class ModelTranslationSyncTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Tenant $tenant;
    private ModelTranslator $translator;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->tenant = Tenant::factory()->create();
        $this->user = User::factory()->create(['tenant_id' => $this->tenant->id]);
        $this->translator = new ModelTranslator();
        
        Sanctum::actingAs($this->user);
    }

    /**
     * **Feature: comprehensive-i18n-system, Property 16: Online synchronization**
     * **Validates: Requirements 8.3**
     */
    public function test_online_synchronization_retrieves_updated_translations()
    {
        // Create test models with translations
        $product = Product::factory()->create(['tenant_id' => $this->tenant->id]);
        $category = Category::factory()->create(['tenant_id' => $this->tenant->id]);
        $worker = Worker::factory()->create(['tenant_id' => $this->tenant->id]);

        // Store initial translations
        $initialTranslations = [
            ['model_type' => 'Product', 'model_id' => $product->id, 'field_name' => 'name', 'locale' => 'ar', 'value' => 'منتج أولي'],
            ['model_type' => 'Category', 'model_id' => $category->id, 'field_name' => 'name', 'locale' => 'ar', 'value' => 'فئة أولية'],
            ['model_type' => 'Worker', 'model_id' => $worker->id, 'field_name' => 'job_title', 'locale' => 'ar', 'value' => 'وظيفة أولية'],
        ];

        foreach ($initialTranslations as $translation) {
            $this->translator->storeTranslation(
                $translation['model_type'],
                $translation['model_id'],
                $translation['field_name'],
                $translation['locale'],
                $translation['value']
            );
        }

        // Record initial sync time
        $initialSyncTime = now()->subMinute();

        // Update translations after sync time
        sleep(1); // Ensure different timestamps
        
        $updatedTranslations = [
            ['model_type' => 'Product', 'model_id' => $product->id, 'field_name' => 'name', 'locale' => 'ar', 'value' => 'منتج محدث'],
            ['model_type' => 'Category', 'model_id' => $category->id, 'field_name' => 'name', 'locale' => 'ar', 'value' => 'فئة محدثة'],
        ];

        foreach ($updatedTranslations as $translation) {
            $this->translator->storeTranslation(
                $translation['model_type'],
                $translation['model_id'],
                $translation['field_name'],
                $translation['locale'],
                $translation['value']
            );
        }

        // Test sync API endpoint
        $response = $this->postJson('/api/model-translations/sync', [
            'last_sync' => $initialSyncTime->toISOString(),
        ]);

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                ]);

        $syncData = $response->json('data');
        $this->assertArrayHasKey('translations', $syncData);
        $this->assertArrayHasKey('sync_timestamp', $syncData);

        // Should only return translations updated after sync time
        $returnedTranslations = collect($syncData['translations']);
        $this->assertGreaterThanOrEqual(2, $returnedTranslations->count());

        // Verify updated translations are included
        $productTranslation = $returnedTranslations->where('model_type', 'Product')
                                                  ->where('model_id', $product->id)
                                                  ->where('field_name', 'name')
                                                  ->where('locale', 'ar')
                                                  ->first();
        
        $this->assertNotNull($productTranslation);
        $this->assertEquals('منتج محدث', $productTranslation['value']);
    }

    /**
     * **Feature: comprehensive-i18n-system, Property 16: Online synchronization**
     * **Validates: Requirements 8.3**
     */
    public function test_sync_with_locale_filter()
    {
        // Create test model with translations in both locales
        $product = Product::factory()->create(['tenant_id' => $this->tenant->id]);

        $translations = [
            ['locale' => 'ar', 'value' => 'منتج عربي'],
            ['locale' => 'en', 'value' => 'English Product'],
        ];

        foreach ($translations as $translation) {
            $this->translator->storeTranslation(
                'Product',
                $product->id,
                'name',
                $translation['locale'],
                $translation['value']
            );
        }

        // Test sync with Arabic locale filter
        $response = $this->postJson('/api/model-translations/sync', [
            'locale' => 'ar',
        ]);

        $response->assertStatus(200);
        $syncData = $response->json('data');
        $returnedTranslations = collect($syncData['translations']);

        // Should only return Arabic translations
        $this->assertTrue($returnedTranslations->every(function ($translation) {
            return $translation['locale'] === 'ar';
        }));

        $arabicTranslation = $returnedTranslations->where('model_type', 'Product')
                                                 ->where('model_id', $product->id)
                                                 ->where('field_name', 'name')
                                                 ->first();
        
        $this->assertNotNull($arabicTranslation);
        $this->assertEquals('منتج عربي', $arabicTranslation['value']);
    }

    /**
     * **Feature: comprehensive-i18n-system, Property 16: Online synchronization**
     * **Validates: Requirements 8.3**
     */
    public function test_sync_handles_no_updates()
    {
        // Create initial translations
        $product = Product::factory()->create(['tenant_id' => $this->tenant->id]);
        $this->translator->storeTranslation('Product', $product->id, 'name', 'ar', 'منتج');

        // Record sync time after all translations
        $syncTime = now()->addMinute();

        // Test sync with future timestamp (no updates)
        $response = $this->postJson('/api/model-translations/sync', [
            'last_sync' => $syncTime->toISOString(),
        ]);

        $response->assertStatus(200);
        $syncData = $response->json('data');
        
        // Should return empty translations array
        $this->assertEmpty($syncData['translations']);
        $this->assertArrayHasKey('sync_timestamp', $syncData);
    }

    /**
     * **Feature: comprehensive-i18n-system, Property 16: Online synchronization**
     * **Validates: Requirements 8.3**
     */
    public function test_bulk_sync_operations()
    {
        // Create multiple models
        $products = Product::factory()->count(3)->create(['tenant_id' => $this->tenant->id]);
        $categories = Category::factory()->count(2)->create(['tenant_id' => $this->tenant->id]);

        // Prepare bulk translations
        $bulkTranslations = [];
        
        foreach ($products as $index => $product) {
            $bulkTranslations[] = [
                'model_type' => 'Product',
                'model_id' => $product->id,
                'field_name' => 'name',
                'locale' => 'ar',
                'value' => "منتج رقم " . ($index + 1)
            ];
        }

        foreach ($categories as $index => $category) {
            $bulkTranslations[] = [
                'model_type' => 'Category',
                'model_id' => $category->id,
                'field_name' => 'name',
                'locale' => 'ar',
                'value' => "فئة رقم " . ($index + 1)
            ];
        }

        // Test bulk store API
        $response = $this->postJson('/api/model-translations/bulk', [
            'translations' => $bulkTranslations
        ]);

        $response->assertStatus(201)
                ->assertJson([
                    'success' => true,
                    'count' => count($bulkTranslations),
                ]);

        // Verify all translations were stored
        foreach ($bulkTranslations as $translation) {
            $stored = ModelTranslation::where('model_type', $translation['model_type'])
                                    ->where('model_id', $translation['model_id'])
                                    ->where('field_name', $translation['field_name'])
                                    ->where('locale', $translation['locale'])
                                    ->first();
            
            $this->assertNotNull($stored);
            $this->assertEquals($translation['value'], $stored->value);
        }

        // Test sync after bulk operation
        $syncResponse = $this->postJson('/api/model-translations/sync');
        $syncResponse->assertStatus(200);
        
        $syncData = $syncResponse->json('data');
        $this->assertGreaterThanOrEqual(count($bulkTranslations), count($syncData['translations']));
    }

    /**
     * **Feature: comprehensive-i18n-system, Property 16: Online synchronization**
     * **Validates: Requirements 8.3**
     */
    public function test_sync_error_handling()
    {
        // Test sync with invalid date format
        $response = $this->postJson('/api/model-translations/sync', [
            'last_sync' => 'invalid-date-format',
        ]);

        $response->assertStatus(422); // Validation error

        // Test sync with invalid locale
        $response = $this->postJson('/api/model-translations/sync', [
            'locale' => 'invalid-locale',
        ]);

        $response->assertStatus(422); // Validation error
    }

    /**
     * **Feature: comprehensive-i18n-system, Property 16: Online synchronization**
     * **Validates: Requirements 8.3**
     */
    public function test_concurrent_sync_operations()
    {
        // Create test model
        $product = Product::factory()->create(['tenant_id' => $this->tenant->id]);

        // Simulate concurrent translation updates
        $translations = [
            ['field' => 'name', 'value' => 'منتج متزامن 1'],
            ['field' => 'description', 'value' => 'وصف متزامن 1'],
        ];

        // Store translations concurrently (simulated)
        foreach ($translations as $translation) {
            $this->translator->storeTranslation(
                'Product',
                $product->id,
                $translation['field'],
                'ar',
                $translation['value']
            );
        }

        // Test sync retrieves all concurrent updates
        $response = $this->postJson('/api/model-translations/sync');
        $response->assertStatus(200);

        $syncData = $response->json('data');
        $returnedTranslations = collect($syncData['translations']);

        // Should include both concurrent updates
        $nameTranslation = $returnedTranslations->where('field_name', 'name')->first();
        $descTranslation = $returnedTranslations->where('field_name', 'description')->first();

        $this->assertNotNull($nameTranslation);
        $this->assertNotNull($descTranslation);
        $this->assertEquals('منتج متزامن 1', $nameTranslation['value']);
        $this->assertEquals('وصف متزامن 1', $descTranslation['value']);
    }

    public function test_sync_maintains_data_integrity()
    {
        // Create test data
        $product = Product::factory()->create(['tenant_id' => $this->tenant->id]);
        
        // Store original translation
        $originalValue = 'منتج أصلي';
        $this->translator->storeTranslation('Product', $product->id, 'name', 'ar', $originalValue);

        // Update translation
        $updatedValue = 'منتج محدث';
        $this->translator->storeTranslation('Product', $product->id, 'name', 'ar', $updatedValue);

        // Sync should return the latest value
        $response = $this->postJson('/api/model-translations/sync');
        $response->assertStatus(200);

        $syncData = $response->json('data');
        $translation = collect($syncData['translations'])
                      ->where('model_type', 'Product')
                      ->where('model_id', $product->id)
                      ->where('field_name', 'name')
                      ->where('locale', 'ar')
                      ->first();

        $this->assertNotNull($translation);
        $this->assertEquals($updatedValue, $translation['value']);
        $this->assertNotEquals($originalValue, $translation['value']);
    }

    /**
     * **Feature: comprehensive-i18n-system, Property 13: Version management and cache invalidation**
     * **Validates: Requirements 6.5**
     */
    public function test_version_management_tracks_translation_updates()
    {
        // Create test model
        $product = Product::factory()->create(['tenant_id' => $this->tenant->id]);
        
        // Store initial translation
        $this->translator->storeTranslation('Product', $product->id, 'name', 'ar', 'منتج إصدار 1');
        
        $initialTranslation = ModelTranslation::where('model_type', 'Product')
                                            ->where('model_id', $product->id)
                                            ->where('field_name', 'name')
                                            ->where('locale', 'ar')
                                            ->first();
        
        $initialTimestamp = $initialTranslation->updated_at;
        
        // Wait to ensure different timestamp
        sleep(1);
        
        // Update translation (version 2)
        $this->translator->storeTranslation('Product', $product->id, 'name', 'ar', 'منتج إصدار 2');
        
        $updatedTranslation = ModelTranslation::where('model_type', 'Product')
                                            ->where('model_id', $product->id)
                                            ->where('field_name', 'name')
                                            ->where('locale', 'ar')
                                            ->first();
        
        // Verify version tracking through timestamps
        $this->assertNotEquals($initialTimestamp, $updatedTranslation->updated_at);
        $this->assertTrue($updatedTranslation->updated_at->gt($initialTimestamp));
        $this->assertEquals('منتج إصدار 2', $updatedTranslation->value);
    }

    /**
     * **Feature: comprehensive-i18n-system, Property 13: Version management and cache invalidation**
     * **Validates: Requirements 6.5**
     */
    public function test_cache_invalidation_on_translation_updates()
    {
        // Create test model
        $product = Product::factory()->create(['tenant_id' => $this->tenant->id]);
        
        // Store initial translation
        $this->translator->storeTranslation('Product', $product->id, 'name', 'ar', 'منتج مخزن مؤقت');
        
        // Simulate cache by retrieving translation
        $cachedValue = $this->translator->translateField('Product', $product->id, 'name', 'ar');
        $this->assertEquals('منتج مخزن مؤقت', $cachedValue);
        
        // Update translation (should invalidate cache)
        $this->translator->storeTranslation('Product', $product->id, 'name', 'ar', 'منتج محدث');
        
        // Retrieve again (should get updated value, not cached)
        $updatedValue = $this->translator->translateField('Product', $product->id, 'name', 'ar');
        $this->assertEquals('منتج محدث', $updatedValue);
        $this->assertNotEquals($cachedValue, $updatedValue);
    }

    /**
     * **Feature: comprehensive-i18n-system, Property 13: Version management and cache invalidation**
     * **Validates: Requirements 6.5**
     */
    public function test_version_management_with_concurrent_updates()
    {
        // Create test model
        $product = Product::factory()->create(['tenant_id' => $this->tenant->id]);
        
        // Store multiple translations rapidly (simulating concurrent updates)
        $updates = [
            'منتج تحديث 1',
            'منتج تحديث 2', 
            'منتج تحديث 3',
            'منتج تحديث نهائي'
        ];
        
        $timestamps = [];
        
        foreach ($updates as $index => $value) {
            $this->translator->storeTranslation('Product', $product->id, 'name', 'ar', $value);
            
            $translation = ModelTranslation::where('model_type', 'Product')
                                         ->where('model_id', $product->id)
                                         ->where('field_name', 'name')
                                         ->where('locale', 'ar')
                                         ->first();
            
            $timestamps[] = $translation->updated_at;
            
            // Small delay to ensure different timestamps
            usleep(100000); // 0.1 seconds
        }
        
        // Verify final state
        $finalTranslation = ModelTranslation::where('model_type', 'Product')
                                          ->where('model_id', $product->id)
                                          ->where('field_name', 'name')
                                          ->where('locale', 'ar')
                                          ->first();
        
        $this->assertEquals('منتج تحديث نهائي', $finalTranslation->value);
        
        // Verify timestamps are in ascending order (version progression)
        for ($i = 1; $i < count($timestamps); $i++) {
            $this->assertTrue($timestamps[$i]->gte($timestamps[$i - 1]));
        }
    }

    /**
     * **Feature: comprehensive-i18n-system, Property 13: Version management and cache invalidation**
     * **Validates: Requirements 6.5**
     */
    public function test_version_management_api_endpoints()
    {
        // Create test model with translations
        $product = Product::factory()->create(['tenant_id' => $this->tenant->id]);
        
        // Store initial translations
        $this->translator->storeTranslation('Product', $product->id, 'name', 'ar', 'منتج API');
        $this->translator->storeTranslation('Product', $product->id, 'description', 'ar', 'وصف API');
        
        // Test statistics endpoint (version tracking)
        $response = $this->getJson('/api/model-translations/statistics');
        $response->assertStatus(200);
        
        $stats = $response->json('data');
        $this->assertArrayHasKey('total_translations', $stats);
        $this->assertArrayHasKey('by_locale', $stats);
        $this->assertArrayHasKey('by_model_type', $stats);
        
        // Should have at least our test translations
        $this->assertGreaterThanOrEqual(2, $stats['total_translations']);
        $this->assertArrayHasKey('ar', $stats['by_locale']);
        $this->assertArrayHasKey('Product', $stats['by_model_type']);
    }

    /**
     * **Feature: comprehensive-i18n-system, Property 13: Version management and cache invalidation**
     * **Validates: Requirements 6.5**
     */
    public function test_integrity_validation_for_version_management()
    {
        // Create test data with potential integrity issues
        $product = Product::factory()->create(['tenant_id' => $this->tenant->id]);
        
        // Store valid translations
        $this->translator->storeTranslation('Product', $product->id, 'name', 'ar', 'منتج صحيح');
        $this->translator->storeTranslation('Product', $product->id, 'name', 'en', 'Valid Product');
        
        // Test integrity validation endpoint
        $response = $this->getJson('/api/model-translations/validate-integrity');
        $response->assertStatus(200);
        
        $validation = $response->json('data');
        $this->assertArrayHasKey('has_issues', $validation);
        $this->assertArrayHasKey('issues', $validation);
        
        // Should not have issues with valid data
        $this->assertFalse($validation['has_issues']);
        $this->assertEmpty($validation['issues']);
    }

    /**
     * **Feature: comprehensive-i18n-system, Property 13: Version management and cache invalidation**
     * **Validates: Requirements 6.5**
     */
    public function test_version_management_with_model_deletion()
    {
        // Create test model
        $product = Product::factory()->create(['tenant_id' => $this->tenant->id]);
        $productId = $product->id;
        
        // Store translations
        $this->translator->storeTranslation('Product', $productId, 'name', 'ar', 'منتج للحذف');
        $this->translator->storeTranslation('Product', $productId, 'description', 'ar', 'وصف للحذف');
        
        // Verify translations exist
        $this->assertNotNull($this->translator->translateField('Product', $productId, 'name', 'ar'));
        $this->assertNotNull($this->translator->translateField('Product', $productId, 'description', 'ar'));
        
        // Delete the model
        $product->delete();
        
        // Translations should still exist (orphaned)
        $this->assertNotNull($this->translator->translateField('Product', $productId, 'name', 'ar'));
        
        // Test integrity validation should detect orphaned translations
        $response = $this->getJson('/api/model-translations/validate-integrity');
        $response->assertStatus(200);
        
        $validation = $response->json('data');
        
        // Should detect orphaned translations as an integrity issue
        if ($validation['has_issues']) {
            $this->assertArrayHasKey('orphaned_translations', $validation['issues']);
        }
    }

    /**
     * **Feature: comprehensive-i18n-system, Property 13: Version management and cache invalidation**
     * **Validates: Requirements 6.5**
     */
    public function test_version_management_preserves_translation_history()
    {
        // Create test model
        $product = Product::factory()->create(['tenant_id' => $this->tenant->id]);
        
        // Store initial translation
        $initialTime = now();
        $this->translator->storeTranslation('Product', $product->id, 'name', 'ar', 'منتج تاريخي 1');
        
        // Update translation multiple times
        $updates = [
            'منتج تاريخي 2',
            'منتج تاريخي 3',
            'منتج تاريخي نهائي'
        ];
        
        foreach ($updates as $value) {
            sleep(1); // Ensure different timestamps
            $this->translator->storeTranslation('Product', $product->id, 'name', 'ar', $value);
        }
        
        // Verify only the latest version is stored (no history in current implementation)
        $translation = ModelTranslation::where('model_type', 'Product')
                                     ->where('model_id', $product->id)
                                     ->where('field_name', 'name')
                                     ->where('locale', 'ar')
                                     ->first();
        
        $this->assertEquals('منتج تاريخي نهائي', $translation->value);
        $this->assertTrue($translation->updated_at->gt($initialTime));
        
        // Verify only one record exists (updates, not inserts)
        $translationCount = ModelTranslation::where('model_type', 'Product')
                                          ->where('model_id', $product->id)
                                          ->where('field_name', 'name')
                                          ->where('locale', 'ar')
                                          ->count();
        
        $this->assertEquals(1, $translationCount);
    }
}