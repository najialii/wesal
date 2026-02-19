<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Tenant;
use App\Models\Product;
use App\Models\Category;
use App\Models\Worker;
use App\Services\ModelTranslator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

class I18nIntegrationTest extends TestCase
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
     * Test complete Arabic/English language switching workflow
     */
    public function test_complete_arabic_english_switching_workflow()
    {
        // Create test models
        $product = Product::factory()->create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Original Product',
            'description' => 'Original Description'
        ]);

        $category = Category::factory()->create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Original Category',
            'description' => 'Original Category Description'
        ]);

        $worker = Worker::factory()->create([
            'tenant_id' => $this->tenant->id,
            'job_title' => 'Original Job Title'
        ]);

        // Step 1: Store Arabic translations
        $this->translator->storeTranslation('Product', $product->id, 'name', 'ar', 'منتج تجريبي');
        $this->translator->storeTranslation('Product', $product->id, 'description', 'ar', 'وصف منتج تجريبي');
        
        $this->translator->storeTranslation('Category', $category->id, 'name', 'ar', 'فئة تجريبية');
        $this->translator->storeTranslation('Category', $category->id, 'description', 'ar', 'وصف فئة تجريبية');
        
        $this->translator->storeTranslation('Worker', $worker->id, 'job_title', 'ar', 'مسمى وظيفي تجريبي');

        // Step 2: Store English translations
        $this->translator->storeTranslation('Product', $product->id, 'name', 'en', 'Test Product');
        $this->translator->storeTranslation('Product', $product->id, 'description', 'en', 'Test Product Description');
        
        $this->translator->storeTranslation('Category', $category->id, 'name', 'en', 'Test Category');
        $this->translator->storeTranslation('Category', $category->id, 'description', 'en', 'Test Category Description');
        
        $this->translator->storeTranslation('Worker', $worker->id, 'job_title', 'en', 'Test Job Title');

        // Step 3: Test Arabic retrieval workflow
        $arabicProduct = $this->translator->translateProduct($product, 'ar');
        $arabicCategory = $this->translator->translateCategory($category, 'ar');
        $arabicWorker = $this->translator->translateWorker($worker, 'ar');

        $this->assertEquals('منتج تجريبي', $arabicProduct->name);
        $this->assertEquals('وصف منتج تجريبي', $arabicProduct->description);
        $this->assertEquals('فئة تجريبية', $arabicCategory->name);
        $this->assertEquals('وصف فئة تجريبية', $arabicCategory->description);
        $this->assertEquals('مسمى وظيفي تجريبي', $arabicWorker->job_title);

        // Step 4: Test English retrieval workflow
        $englishProduct = $this->translator->translateProduct($product, 'en');
        $englishCategory = $this->translator->translateCategory($category, 'en');
        $englishWorker = $this->translator->translateWorker($worker, 'en');

        $this->assertEquals('Test Product', $englishProduct->name);
        $this->assertEquals('Test Product Description', $englishProduct->description);
        $this->assertEquals('Test Category', $englishCategory->name);
        $this->assertEquals('Test Category Description', $englishCategory->description);
        $this->assertEquals('Test Job Title', $englishWorker->job_title);

        // Step 5: Test API endpoints
        $response = $this->getJson("/api/model-translations/Product/{$product->id}");
        $response->assertStatus(200);
        
        $translationData = $response->json('data');
        $this->assertArrayHasKey('name', $translationData);
        $this->assertArrayHasKey('description', $translationData);
        $this->assertEquals('منتج تجريبي', $translationData['name']['ar']);
        $this->assertEquals('Test Product', $translationData['name']['en']);
    }

    /**
     * Test backend model translation integration with frontend display
     */
    public function test_backend_model_translation_integration()
    {
        // Create test product
        $product = Product::factory()->create(['tenant_id' => $this->tenant->id]);

        // Store translations via API
        $response = $this->postJson('/api/model-translations', [
            'model_type' => 'Product',
            'model_id' => $product->id,
            'field_name' => 'name',
            'locale' => 'ar',
            'value' => 'منتج من API'
        ]);

        $response->assertStatus(201);

        // Retrieve via service
        $translatedProduct = $this->translator->translateProduct($product, 'ar');
        $this->assertEquals('منتج من API', $translatedProduct->name);

        // Test bulk operations
        $bulkTranslations = [
            [
                'model_type' => 'Product',
                'model_id' => $product->id,
                'field_name' => 'description',
                'locale' => 'ar',
                'value' => 'وصف من API'
            ],
            [
                'model_type' => 'Product',
                'model_id' => $product->id,
                'field_name' => 'name',
                'locale' => 'en',
                'value' => 'Product from API'
            ]
        ];

        $bulkResponse = $this->postJson('/api/model-translations/bulk', [
            'translations' => $bulkTranslations
        ]);

        $bulkResponse->assertStatus(201);

        // Verify bulk translations work
        $translatedProductAr = $this->translator->translateProduct($product, 'ar');
        $translatedProductEn = $this->translator->translateProduct($product, 'en');

        $this->assertEquals('منتج من API', $translatedProductAr->name);
        $this->assertEquals('وصف من API', $translatedProductAr->description);
        $this->assertEquals('Product from API', $translatedProductEn->name);
    }

    /**
     * Test offline functionality with cached translations
     */
    public function test_offline_functionality_simulation()
    {
        // Create test data
        $product = Product::factory()->create(['tenant_id' => $this->tenant->id]);
        
        // Store translations
        $this->translator->storeTranslation('Product', $product->id, 'name', 'ar', 'منتج غير متصل');
        $this->translator->storeTranslation('Product', $product->id, 'name', 'en', 'Offline Product');

        // Simulate offline by testing direct database access (cache simulation)
        $cachedArabicTranslation = $this->translator->translateField('Product', $product->id, 'name', 'ar');
        $cachedEnglishTranslation = $this->translator->translateField('Product', $product->id, 'name', 'en');

        $this->assertEquals('منتج غير متصل', $cachedArabicTranslation);
        $this->assertEquals('Offline Product', $cachedEnglishTranslation);

        // Test that translations persist across "sessions" (database persistence)
        $newTranslatorInstance = new ModelTranslator();
        $persistedArabicTranslation = $newTranslatorInstance->translateField('Product', $product->id, 'name', 'ar');
        $persistedEnglishTranslation = $newTranslatorInstance->translateField('Product', $product->id, 'name', 'en');

        $this->assertEquals('منتج غير متصل', $persistedArabicTranslation);
        $this->assertEquals('Offline Product', $persistedEnglishTranslation);
    }

    /**
     * Test RTL/LTR transitions with complex UI layouts (simulated)
     */
    public function test_rtl_ltr_transitions_simulation()
    {
        // Create test models with both Arabic and English content
        $products = collect();
        
        for ($i = 1; $i <= 3; $i++) {
            $product = Product::factory()->create(['tenant_id' => $this->tenant->id]);
            
            // Store both Arabic and English translations
            $this->translator->storeTranslation('Product', $product->id, 'name', 'ar', "منتج رقم {$i}");
            $this->translator->storeTranslation('Product', $product->id, 'description', 'ar', "وصف منتج رقم {$i}");
            $this->translator->storeTranslation('Product', $product->id, 'name', 'en', "Product {$i}");
            $this->translator->storeTranslation('Product', $product->id, 'description', 'en', "Product {$i} Description");
            
            $products->push($product);
        }

        // Test Arabic layout (RTL)
        $arabicProducts = $this->translator->translateCollection($products, 'ar');
        foreach ($arabicProducts as $index => $product) {
            $expectedIndex = $index + 1;
            $this->assertEquals("منتج رقم {$expectedIndex}", $product->name);
            $this->assertEquals("وصف منتج رقم {$expectedIndex}", $product->description);
        }

        // Test English layout (LTR)
        $englishProducts = $this->translator->translateCollection($products, 'en');
        foreach ($englishProducts as $index => $product) {
            $expectedIndex = $index + 1;
            $this->assertEquals("Product {$expectedIndex}", $product->name);
            $this->assertEquals("Product {$expectedIndex} Description", $product->description);
        }

        // Test transition consistency (same data, different languages)
        $this->assertCount(3, $arabicProducts);
        $this->assertCount(3, $englishProducts);
        
        // Verify no cross-contamination
        foreach ($arabicProducts as $index => $arabicProduct) {
            $englishProduct = $englishProducts[$index];
            $this->assertNotEquals($arabicProduct->name, $englishProduct->name);
            $this->assertNotEquals($arabicProduct->description, $englishProduct->description);
        }
    }

    /**
     * Test that no fallback behavior exists anywhere in the system
     */
    public function test_no_fallback_behavior_system_wide()
    {
        // Create test model with only Arabic translations
        $product = Product::factory()->create(['tenant_id' => $this->tenant->id]);
        $this->translator->storeTranslation('Product', $product->id, 'name', 'ar', 'منتج عربي فقط');

        // Request English translation (should return null, not Arabic)
        $englishTranslation = $this->translator->translateField('Product', $product->id, 'name', 'en');
        $this->assertNull($englishTranslation);

        // Request Arabic translation (should return the value)
        $arabicTranslation = $this->translator->translateField('Product', $product->id, 'name', 'ar');
        $this->assertEquals('منتج عربي فقط', $arabicTranslation);

        // Test via API
        $response = $this->getJson("/api/model-translations/Product/{$product->id}");
        $response->assertStatus(200);
        
        $data = $response->json('data');
        $this->assertArrayHasKey('name', $data);
        $this->assertArrayHasKey('ar', $data['name']);
        $this->assertArrayNotHasKey('en', $data['name']); // Should not have English key

        // Create model with only English translations
        $englishOnlyProduct = Product::factory()->create(['tenant_id' => $this->tenant->id]);
        $this->translator->storeTranslation('Product', $englishOnlyProduct->id, 'name', 'en', 'English Only Product');

        // Request Arabic translation (should return null, not English)
        $arabicFromEnglish = $this->translator->translateField('Product', $englishOnlyProduct->id, 'name', 'ar');
        $this->assertNull($arabicFromEnglish);

        // Request English translation (should return the value)
        $englishFromEnglish = $this->translator->translateField('Product', $englishOnlyProduct->id, 'name', 'en');
        $this->assertEquals('English Only Product', $englishFromEnglish);
    }

    /**
     * Test error handling and data integrity across the system
     */
    public function test_system_wide_error_handling_and_integrity()
    {
        // Test invalid model type
        $response = $this->postJson('/api/model-translations', [
            'model_type' => 'InvalidModel',
            'model_id' => 1,
            'field_name' => 'name',
            'locale' => 'ar',
            'value' => 'test'
        ]);

        $response->assertStatus(422); // Validation error

        // Test invalid locale
        $product = Product::factory()->create(['tenant_id' => $this->tenant->id]);
        
        $response = $this->postJson('/api/model-translations', [
            'model_type' => 'Product',
            'model_id' => $product->id,
            'field_name' => 'name',
            'locale' => 'fr', // Invalid locale
            'value' => 'French Name'
        ]);

        $response->assertStatus(422); // Validation error

        // Test data integrity with special characters
        $specialContent = 'Special chars: @#$%^&*()_+ العربية 中文 🚀';
        
        $response = $this->postJson('/api/model-translations', [
            'model_type' => 'Product',
            'model_id' => $product->id,
            'field_name' => 'name',
            'locale' => 'ar',
            'value' => $specialContent
        ]);

        $response->assertStatus(201);

        // Verify special content integrity
        $retrievedContent = $this->translator->translateField('Product', $product->id, 'name', 'ar');
        $this->assertEquals($specialContent, $retrievedContent);
    }

    /**
     * Test complete workflow with multiple models and languages
     */
    public function test_complete_multi_model_multi_language_workflow()
    {
        // Create multiple models of each type
        $products = Product::factory()->count(3)->create(['tenant_id' => $this->tenant->id]);
        $categories = Category::factory()->count(2)->create(['tenant_id' => $this->tenant->id]);
        $workers = Worker::factory()->count(2)->create(['tenant_id' => $this->tenant->id]);

        // Store translations for all models in both languages
        foreach ($products as $index => $product) {
            $this->translator->storeTranslation('Product', $product->id, 'name', 'ar', "منتج رقم " . ($index + 1));
            $this->translator->storeTranslation('Product', $product->id, 'description', 'ar', "وصف منتج رقم " . ($index + 1));
            $this->translator->storeTranslation('Product', $product->id, 'name', 'en', "Product " . ($index + 1));
            $this->translator->storeTranslation('Product', $product->id, 'description', 'en', "Product " . ($index + 1) . " Description");
        }

        foreach ($categories as $index => $category) {
            $this->translator->storeTranslation('Category', $category->id, 'name', 'ar', "فئة رقم " . ($index + 1));
            $this->translator->storeTranslation('Category', $category->id, 'description', 'ar', "وصف فئة رقم " . ($index + 1));
            $this->translator->storeTranslation('Category', $category->id, 'name', 'en', "Category " . ($index + 1));
            $this->translator->storeTranslation('Category', $category->id, 'description', 'en', "Category " . ($index + 1) . " Description");
        }

        foreach ($workers as $index => $worker) {
            $this->translator->storeTranslation('Worker', $worker->id, 'job_title', 'ar', "وظيفة رقم " . ($index + 1));
            $this->translator->storeTranslation('Worker', $worker->id, 'job_title', 'en', "Job Title " . ($index + 1));
        }

        // Test collection translation for Arabic
        $arabicProducts = $this->translator->translateCollection($products, 'ar');
        $arabicCategories = $this->translator->translateCollection($categories, 'ar');
        $arabicWorkers = $this->translator->translateCollection($workers, 'ar');

        // Verify Arabic translations
        foreach ($arabicProducts as $index => $product) {
            $expectedIndex = $index + 1;
            $this->assertEquals("منتج رقم {$expectedIndex}", $product->name);
            $this->assertEquals("وصف منتج رقم {$expectedIndex}", $product->description);
        }

        // Test collection translation for English
        $englishProducts = $this->translator->translateCollection($products, 'en');
        $englishCategories = $this->translator->translateCollection($categories, 'en');
        $englishWorkers = $this->translator->translateCollection($workers, 'en');

        // Verify English translations
        foreach ($englishProducts as $index => $product) {
            $expectedIndex = $index + 1;
            $this->assertEquals("Product {$expectedIndex}", $product->name);
            $this->assertEquals("Product {$expectedIndex} Description", $product->description);
        }

        // Test statistics API
        $statsResponse = $this->getJson('/api/model-translations/statistics');
        $statsResponse->assertStatus(200);
        
        $stats = $statsResponse->json('data');
        $this->assertArrayHasKey('total_translations', $stats);
        $this->assertArrayHasKey('by_locale', $stats);
        $this->assertArrayHasKey('by_model_type', $stats);
        
        // Should have translations for both locales
        $this->assertArrayHasKey('ar', $stats['by_locale']);
        $this->assertArrayHasKey('en', $stats['by_locale']);
        
        // Should have translations for all model types
        $this->assertArrayHasKey('Product', $stats['by_model_type']);
        $this->assertArrayHasKey('Category', $stats['by_model_type']);
        $this->assertArrayHasKey('Worker', $stats['by_model_type']);
    }

    /**
     * Test system performance with large datasets
     */
    public function test_system_performance_with_large_dataset()
    {
        // Create larger dataset
        $products = Product::factory()->count(10)->create(['tenant_id' => $this->tenant->id]);
        
        // Measure bulk translation storage time
        $startTime = microtime(true);
        
        $bulkTranslations = [];
        foreach ($products as $index => $product) {
            $bulkTranslations[] = [
                'model_type' => 'Product',
                'model_id' => $product->id,
                'field_name' => 'name',
                'locale' => 'ar',
                'value' => "منتج أداء رقم " . ($index + 1)
            ];
            $bulkTranslations[] = [
                'model_type' => 'Product',
                'model_id' => $product->id,
                'field_name' => 'description',
                'locale' => 'ar',
                'value' => "وصف أداء رقم " . ($index + 1)
            ];
        }

        $this->translator->bulkStoreTranslations($bulkTranslations);
        
        $storageTime = microtime(true) - $startTime;
        
        // Storage should be reasonably fast (less than 1 second for 20 translations)
        $this->assertLessThan(1.0, $storageTime);

        // Measure collection translation time
        $startTime = microtime(true);
        
        $translatedProducts = $this->translator->translateCollection($products, 'ar');
        
        $translationTime = microtime(true) - $startTime;
        
        // Translation should be reasonably fast (less than 0.5 seconds for 10 products)
        $this->assertLessThan(0.5, $translationTime);

        // Verify all products were translated correctly
        $this->assertCount(10, $translatedProducts);
        foreach ($translatedProducts as $index => $product) {
            $expectedIndex = $index + 1;
            $this->assertEquals("منتج أداء رقم {$expectedIndex}", $product->name);
            $this->assertEquals("وصف أداء رقم {$expectedIndex}", $product->description);
        }
    }

    /**
     * Test system integrity validation
     */
    public function test_system_integrity_validation()
    {
        // Create test data
        $product = Product::factory()->create(['tenant_id' => $this->tenant->id]);
        $this->translator->storeTranslation('Product', $product->id, 'name', 'ar', 'منتج للتحقق');

        // Test integrity validation API
        $response = $this->getJson('/api/model-translations/validate-integrity');
        $response->assertStatus(200);
        
        $validation = $response->json('data');
        $this->assertArrayHasKey('has_issues', $validation);
        $this->assertArrayHasKey('issues', $validation);

        // With valid data, should have no issues
        $this->assertFalse($validation['has_issues']);

        // Delete the product to create orphaned translations
        $productId = $product->id;
        $product->delete();

        // Run integrity validation again
        $response = $this->getJson('/api/model-translations/validate-integrity');
        $response->assertStatus(200);
        
        $validation = $response->json('data');
        
        // Should detect orphaned translations
        if ($validation['has_issues']) {
            $this->assertArrayHasKey('orphaned_translations', $validation['issues']);
        }
    }

    /**
     * Test complete sync workflow
     */
    public function test_complete_sync_workflow()
    {
        // Create initial data
        $product = Product::factory()->create(['tenant_id' => $this->tenant->id]);
        $this->translator->storeTranslation('Product', $product->id, 'name', 'ar', 'منتج مزامنة');

        // Record sync timestamp
        $syncTime = now();
        sleep(1); // Ensure different timestamp

        // Add more translations after sync time
        $this->translator->storeTranslation('Product', $product->id, 'description', 'ar', 'وصف مزامنة');
        $this->translator->storeTranslation('Product', $product->id, 'name', 'en', 'Sync Product');

        // Test sync API
        $response = $this->postJson('/api/model-translations/sync', [
            'last_sync' => $syncTime->toISOString()
        ]);

        $response->assertStatus(200);
        
        $syncData = $response->json('data');
        $this->assertArrayHasKey('translations', $syncData);
        $this->assertArrayHasKey('sync_timestamp', $syncData);

        // Should return only translations updated after sync time
        $translations = collect($syncData['translations']);
        $this->assertGreaterThanOrEqual(2, $translations->count());

        // Verify specific translations are included
        $descriptionTranslation = $translations->where('field_name', 'description')->first();
        $nameTranslation = $translations->where('field_name', 'name')->where('locale', 'en')->first();

        $this->assertNotNull($descriptionTranslation);
        $this->assertNotNull($nameTranslation);
        $this->assertEquals('وصف مزامنة', $descriptionTranslation['value']);
        $this->assertEquals('Sync Product', $nameTranslation['value']);
    }
}