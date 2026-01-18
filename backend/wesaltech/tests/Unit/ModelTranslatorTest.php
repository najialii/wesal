<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\Product;
use App\Models\Category;
use App\Models\Worker;
use App\Models\Tenant;
use App\Services\ModelTranslator;
use Illuminate\Foundation\Testing\RefreshDatabase;

class ModelTranslatorTest extends TestCase
{
    use RefreshDatabase;

    private ModelTranslator $translator;
    private Tenant $tenant;

    protected function setUp(): void
    {
        parent::setUp();
        $this->translator = new ModelTranslator();
        
        // Create a test tenant
        $this->tenant = Tenant::factory()->create();
    }

    /**
     * **Feature: comprehensive-i18n-system, Property 4: Model translation field support**
     * **Validates: Requirements 3.1, 3.2, 3.3**
     */
    public function test_product_has_translation_field_support()
    {
        // Test data for multiple products
        $testCases = [
            ['name' => 'Test Product 1', 'description' => 'Test Description 1'],
            ['name' => 'Test Product 2', 'description' => 'Test Description 2'],
            ['name' => 'Test Product 3', 'description' => 'Test Description 3'],
        ];

        foreach ($testCases as $productData) {
            $product = Product::factory()->create([
                'tenant_id' => $this->tenant->id,
                'name' => $productData['name'],
                'description' => $productData['description'],
            ]);

            // Verify translatable fields are defined
            $translatableFields = $product->getTranslatableFields();
            $this->assertContains('name', $translatableFields);
            $this->assertContains('description', $translatableFields);

            // Test Arabic translations
            $arabicName = 'منتج تجريبي ' . rand(1, 1000);
            $arabicDescription = 'وصف تجريبي ' . rand(1, 1000);
            
            $product->setTranslation('name', 'ar', $arabicName);
            $product->setTranslation('description', 'ar', $arabicDescription);

            // Test English translations
            $englishName = 'English Product ' . rand(1, 1000);
            $englishDescription = 'English Description ' . rand(1, 1000);
            
            $product->setTranslation('name', 'en', $englishName);
            $product->setTranslation('description', 'en', $englishDescription);

            // Verify translations are stored correctly
            $this->assertEquals($arabicName, $product->getTranslation('name', 'ar'));
            $this->assertEquals($arabicDescription, $product->getTranslation('description', 'ar'));
            $this->assertEquals($englishName, $product->getTranslation('name', 'en'));
            $this->assertEquals($englishDescription, $product->getTranslation('description', 'en'));

            // Verify translation exists checks
            $this->assertTrue($product->hasTranslation('name', 'ar'));
            $this->assertTrue($product->hasTranslation('description', 'ar'));
            $this->assertTrue($product->hasTranslation('name', 'en'));
            $this->assertTrue($product->hasTranslation('description', 'en'));
        }
    }

    /**
     * **Feature: comprehensive-i18n-system, Property 4: Model translation field support**
     * **Validates: Requirements 3.1, 3.2, 3.3**
     */
    public function test_category_has_translation_field_support()
    {
        // Test data for multiple categories
        $testCases = [
            ['name' => 'Test Category 1', 'description' => 'Test Category Description 1'],
            ['name' => 'Test Category 2', 'description' => 'Test Category Description 2'],
            ['name' => 'Test Category 3', 'description' => 'Test Category Description 3'],
        ];

        foreach ($testCases as $categoryData) {
            $category = Category::factory()->create([
                'tenant_id' => $this->tenant->id,
                'name' => $categoryData['name'],
                'description' => $categoryData['description'],
            ]);

            // Verify translatable fields are defined
            $translatableFields = $category->getTranslatableFields();
            $this->assertContains('name', $translatableFields);
            $this->assertContains('description', $translatableFields);

            // Test Arabic translations
            $arabicName = 'فئة تجريبية ' . rand(1, 1000);
            $arabicDescription = 'وصف فئة تجريبية ' . rand(1, 1000);
            
            $category->setTranslation('name', 'ar', $arabicName);
            $category->setTranslation('description', 'ar', $arabicDescription);

            // Test English translations
            $englishName = 'English Category ' . rand(1, 1000);
            $englishDescription = 'English Category Description ' . rand(1, 1000);
            
            $category->setTranslation('name', 'en', $englishName);
            $category->setTranslation('description', 'en', $englishDescription);

            // Verify translations are stored correctly
            $this->assertEquals($arabicName, $category->getTranslation('name', 'ar'));
            $this->assertEquals($arabicDescription, $category->getTranslation('description', 'ar'));
            $this->assertEquals($englishName, $category->getTranslation('name', 'en'));
            $this->assertEquals($englishDescription, $category->getTranslation('description', 'en'));

            // Verify translation exists checks
            $this->assertTrue($category->hasTranslation('name', 'ar'));
            $this->assertTrue($category->hasTranslation('description', 'ar'));
            $this->assertTrue($category->hasTranslation('name', 'en'));
            $this->assertTrue($category->hasTranslation('description', 'en'));
        }
    }

    /**
     * **Feature: comprehensive-i18n-system, Property 4: Model translation field support**
     * **Validates: Requirements 3.1, 3.2, 3.3**
     */
    public function test_worker_has_translation_field_support()
    {
        // Test data for multiple workers
        $testCases = [
            ['name' => 'Test Worker 1', 'job_title' => 'Test Job Title 1'],
            ['name' => 'Test Worker 2', 'job_title' => 'Test Job Title 2'],
            ['name' => 'Test Worker 3', 'job_title' => 'Test Job Title 3'],
        ];

        foreach ($testCases as $workerData) {
            $worker = Worker::factory()->create([
                'tenant_id' => $this->tenant->id,
                'name' => $workerData['name'],
                'job_title' => $workerData['job_title'],
            ]);

            // Verify translatable fields are defined
            $translatableFields = $worker->getTranslatableFields();
            $this->assertContains('job_title', $translatableFields);

            // Test Arabic translations
            $arabicJobTitle = 'مسمى وظيفي تجريبي ' . rand(1, 1000);
            $worker->setTranslation('job_title', 'ar', $arabicJobTitle);

            // Test English translations
            $englishJobTitle = 'English Job Title ' . rand(1, 1000);
            $worker->setTranslation('job_title', 'en', $englishJobTitle);

            // Verify translations are stored correctly
            $this->assertEquals($arabicJobTitle, $worker->getTranslation('job_title', 'ar'));
            $this->assertEquals($englishJobTitle, $worker->getTranslation('job_title', 'en'));

            // Verify translation exists checks
            $this->assertTrue($worker->hasTranslation('job_title', 'ar'));
            $this->assertTrue($worker->hasTranslation('job_title', 'en'));
        }
    }

    public function test_model_translator_service_field_support()
    {
        // Create test models
        $product = Product::factory()->create(['tenant_id' => $this->tenant->id]);
        $category = Category::factory()->create(['tenant_id' => $this->tenant->id]);
        $worker = Worker::factory()->create(['tenant_id' => $this->tenant->id]);

        // Test storing translations through ModelTranslator service
        $this->translator->storeTranslation('Product', $product->id, 'name', 'ar', 'منتج تجريبي');
        $this->translator->storeTranslation('Product', $product->id, 'description', 'ar', 'وصف منتج تجريبي');
        
        $this->translator->storeTranslation('Category', $category->id, 'name', 'ar', 'فئة تجريبية');
        $this->translator->storeTranslation('Category', $category->id, 'description', 'ar', 'وصف فئة تجريبية');
        
        $this->translator->storeTranslation('Worker', $worker->id, 'job_title', 'ar', 'مسمى وظيفي تجريبي');

        // Verify translations can be retrieved through service
        $this->assertEquals('منتج تجريبي', $this->translator->translateField('Product', $product->id, 'name', 'ar'));
        $this->assertEquals('وصف منتج تجريبي', $this->translator->translateField('Product', $product->id, 'description', 'ar'));
        
        $this->assertEquals('فئة تجريبية', $this->translator->translateField('Category', $category->id, 'name', 'ar'));
        $this->assertEquals('وصف فئة تجريبية', $this->translator->translateField('Category', $category->id, 'description', 'ar'));
        
        $this->assertEquals('مسمى وظيفي تجريبي', $this->translator->translateField('Worker', $worker->id, 'job_title', 'ar'));
    }

    /**
     * **Feature: comprehensive-i18n-system, Property 5: Model content language retrieval**
     * **Validates: Requirements 3.4**
     */
    public function test_model_content_language_retrieval_arabic_only()
    {
        // Create test models with translations
        $product = Product::factory()->create(['tenant_id' => $this->tenant->id]);
        $category = Category::factory()->create(['tenant_id' => $this->tenant->id]);
        $worker = Worker::factory()->create(['tenant_id' => $this->tenant->id]);

        // Set up Arabic translations
        $product->setTranslation('name', 'ar', 'منتج تجريبي');
        $product->setTranslation('description', 'ar', 'وصف منتج تجريبي');
        
        $category->setTranslation('name', 'ar', 'فئة تجريبية');
        $category->setTranslation('description', 'ar', 'وصف فئة تجريبية');
        
        $worker->setTranslation('job_title', 'ar', 'مسمى وظيفي تجريبي');

        // Test Arabic retrieval through ModelTranslator
        $translatedProduct = $this->translator->translateProduct($product, 'ar');
        $translatedCategory = $this->translator->translateCategory($category, 'ar');
        $translatedWorker = $this->translator->translateWorker($worker, 'ar');

        // Verify Arabic content is returned
        $this->assertEquals('منتج تجريبي', $translatedProduct->name);
        $this->assertEquals('وصف منتج تجريبي', $translatedProduct->description);
        
        $this->assertEquals('فئة تجريبية', $translatedCategory->name);
        $this->assertEquals('وصف فئة تجريبية', $translatedCategory->description);
        
        $this->assertEquals('مسمى وظيفي تجريبي', $translatedWorker->job_title);
    }

    /**
     * **Feature: comprehensive-i18n-system, Property 5: Model content language retrieval**
     * **Validates: Requirements 3.4**
     */
    public function test_model_content_language_retrieval_english_only()
    {
        // Create test models with translations
        $product = Product::factory()->create(['tenant_id' => $this->tenant->id]);
        $category = Category::factory()->create(['tenant_id' => $this->tenant->id]);
        $worker = Worker::factory()->create(['tenant_id' => $this->tenant->id]);

        // Set up English translations
        $product->setTranslation('name', 'en', 'Test Product English');
        $product->setTranslation('description', 'en', 'Test Product Description English');
        
        $category->setTranslation('name', 'en', 'Test Category English');
        $category->setTranslation('description', 'en', 'Test Category Description English');
        
        $worker->setTranslation('job_title', 'en', 'Test Job Title English');

        // Test English retrieval through ModelTranslator
        $translatedProduct = $this->translator->translateProduct($product, 'en');
        $translatedCategory = $this->translator->translateCategory($category, 'en');
        $translatedWorker = $this->translator->translateWorker($worker, 'en');

        // Verify English content is returned
        $this->assertEquals('Test Product English', $translatedProduct->name);
        $this->assertEquals('Test Product Description English', $translatedProduct->description);
        
        $this->assertEquals('Test Category English', $translatedCategory->name);
        $this->assertEquals('Test Category Description English', $translatedCategory->description);
        
        $this->assertEquals('Test Job Title English', $translatedWorker->job_title);
    }

    /**
     * **Feature: comprehensive-i18n-system, Property 5: Model content language retrieval**
     * **Validates: Requirements 3.4**
     */
    public function test_collection_translation_retrieval()
    {
        // Create multiple models
        $products = collect();
        $categories = collect();
        $workers = collect();

        for ($i = 1; $i <= 5; $i++) {
            $product = Product::factory()->create(['tenant_id' => $this->tenant->id]);
            $product->setTranslation('name', 'ar', "منتج رقم {$i}");
            $product->setTranslation('description', 'ar', "وصف منتج رقم {$i}");
            $products->push($product);

            $category = Category::factory()->create(['tenant_id' => $this->tenant->id]);
            $category->setTranslation('name', 'ar', "فئة رقم {$i}");
            $category->setTranslation('description', 'ar', "وصف فئة رقم {$i}");
            $categories->push($category);

            $worker = Worker::factory()->create(['tenant_id' => $this->tenant->id]);
            $worker->setTranslation('job_title', 'ar', "وظيفة رقم {$i}");
            $workers->push($worker);
        }

        // Test collection translation
        $translatedProducts = $this->translator->translateCollection($products, 'ar');
        $translatedCategories = $this->translator->translateCollection($categories, 'ar');
        $translatedWorkers = $this->translator->translateCollection($workers, 'ar');

        // Verify all items in collections are translated
        foreach ($translatedProducts as $index => $product) {
            $expectedIndex = $index + 1;
            $this->assertEquals("منتج رقم {$expectedIndex}", $product->name);
            $this->assertEquals("وصف منتج رقم {$expectedIndex}", $product->description);
        }

        foreach ($translatedCategories as $index => $category) {
            $expectedIndex = $index + 1;
            $this->assertEquals("فئة رقم {$expectedIndex}", $category->name);
            $this->assertEquals("وصف فئة رقم {$expectedIndex}", $category->description);
        }

        foreach ($translatedWorkers as $index => $worker) {
            $expectedIndex = $index + 1;
            $this->assertEquals("وظيفة رقم {$expectedIndex}", $worker->job_title);
        }
    }

    /**
     * **Feature: comprehensive-i18n-system, Property 5: Model content language retrieval**
     * **Validates: Requirements 3.4**
     */
    public function test_missing_translation_fallback_behavior()
    {
        // Create models without translations
        $product = Product::factory()->create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Original Product Name',
            'description' => 'Original Product Description'
        ]);

        // Test retrieval when no translation exists
        $translatedProduct = $this->translator->translateProduct($product, 'ar');
        
        // Should return original values when no translation exists
        $this->assertEquals('Original Product Name', $translatedProduct->name);
        $this->assertEquals('Original Product Description', $translatedProduct->description);

        // Test with partial translations
        $product->setTranslation('name', 'ar', 'اسم المنتج المترجم');
        // description remains untranslated

        $translatedProduct = $this->translator->translateProduct($product, 'ar');
        
        // Should return translated name and original description
        $this->assertEquals('اسم المنتج المترجم', $translatedProduct->name);
        $this->assertEquals('Original Product Description', $translatedProduct->description);
    }

    /**
     * **Feature: comprehensive-i18n-system, Property 5: Model content language retrieval**
     * **Validates: Requirements 3.4**
     */
    public function test_strict_language_retrieval_no_fallback()
    {
        // Create model with only Arabic translations
        $product = Product::factory()->create(['tenant_id' => $this->tenant->id]);
        $product->setTranslation('name', 'ar', 'منتج عربي فقط');
        
        // Request English translation (should return null, not Arabic)
        $englishTranslation = $this->translator->translateField('Product', $product->id, 'name', 'en');
        $this->assertNull($englishTranslation);
        
        // Request Arabic translation (should return the value)
        $arabicTranslation = $this->translator->translateField('Product', $product->id, 'name', 'ar');
        $this->assertEquals('منتج عربي فقط', $arabicTranslation);
    }    /**
  
   * **Feature: comprehensive-i18n-system, Property 6: Translation data integrity**
     * **Validates: Requirements 3.5**
     */
    public function test_translation_data_integrity_during_storage()
    {
        $product = Product::factory()->create(['tenant_id' => $this->tenant->id]);
        
        // Test various types of content that should maintain integrity
        $testData = [
            'simple_text' => 'Simple Arabic Text العربية',
            'with_numbers' => 'Product 123 منتج ١٢٣',
            'with_special_chars' => 'Product@#$% منتج@#$%',
            'with_html_entities' => 'Product &amp; منتج &amp;',
            'with_unicode' => 'Product 🚀 منتج 🚀',
            'long_text' => str_repeat('Long Arabic Text النص العربي الطويل ', 50),
            'empty_string' => '',
            'whitespace_only' => '   ',
            'mixed_scripts' => 'English العربية 中文 русский',
        ];

        foreach ($testData as $key => $originalValue) {
            // Store translation
            $this->translator->storeTranslation('Product', $product->id, 'name', 'ar', $originalValue);
            
            // Retrieve and verify integrity
            $retrievedValue = $this->translator->translateField('Product', $product->id, 'name', 'ar');
            $this->assertEquals($originalValue, $retrievedValue, "Data integrity failed for: {$key}");
            
            // Verify through model method as well
            $this->assertEquals($originalValue, $product->getTranslation('name', 'ar'), "Model method integrity failed for: {$key}");
        }
    }

    /**
     * **Feature: comprehensive-i18n-system, Property 6: Translation data integrity**
     * **Validates: Requirements 3.5**
     */
    public function test_translation_data_integrity_during_updates()
    {
        $product = Product::factory()->create(['tenant_id' => $this->tenant->id]);
        
        // Initial translation
        $initialValue = 'منتج أولي';
        $this->translator->storeTranslation('Product', $product->id, 'name', 'ar', $initialValue);
        $this->assertEquals($initialValue, $this->translator->translateField('Product', $product->id, 'name', 'ar'));
        
        // Update translation multiple times
        for ($i = 1; $i <= 10; $i++) {
            $updatedValue = "منتج محدث رقم {$i}";
            $this->translator->storeTranslation('Product', $product->id, 'name', 'ar', $updatedValue);
            
            // Verify update integrity
            $retrievedValue = $this->translator->translateField('Product', $product->id, 'name', 'ar');
            $this->assertEquals($updatedValue, $retrievedValue, "Update integrity failed at iteration {$i}");
            
            // Ensure no duplicate records are created
            $translationCount = $product->translations()
                ->where('field_name', 'name')
                ->where('locale', 'ar')
                ->count();
            $this->assertEquals(1, $translationCount, "Duplicate translations created at iteration {$i}");
        }
    }

    /**
     * **Feature: comprehensive-i18n-system, Property 6: Translation data integrity**
     * **Validates: Requirements 3.5**
     */
    public function test_translation_data_integrity_with_concurrent_operations()
    {
        $product = Product::factory()->create(['tenant_id' => $this->tenant->id]);
        
        // Simulate concurrent operations by setting multiple translations rapidly
        $translations = [
            ['field' => 'name', 'locale' => 'ar', 'value' => 'اسم المنتج'],
            ['field' => 'name', 'locale' => 'en', 'value' => 'Product Name'],
            ['field' => 'description', 'locale' => 'ar', 'value' => 'وصف المنتج'],
            ['field' => 'description', 'locale' => 'en', 'value' => 'Product Description'],
        ];

        // Store all translations
        foreach ($translations as $translation) {
            $this->translator->storeTranslation(
                'Product',
                $product->id,
                $translation['field'],
                $translation['locale'],
                $translation['value']
            );
        }

        // Verify all translations are stored correctly
        foreach ($translations as $translation) {
            $retrievedValue = $this->translator->translateField(
                'Product',
                $product->id,
                $translation['field'],
                $translation['locale']
            );
            $this->assertEquals($translation['value'], $retrievedValue);
        }

        // Verify no cross-contamination between fields or locales
        $this->assertNotEquals(
            $this->translator->translateField('Product', $product->id, 'name', 'ar'),
            $this->translator->translateField('Product', $product->id, 'description', 'ar')
        );
        
        $this->assertNotEquals(
            $this->translator->translateField('Product', $product->id, 'name', 'ar'),
            $this->translator->translateField('Product', $product->id, 'name', 'en')
        );
    }

    /**
     * **Feature: comprehensive-i18n-system, Property 6: Translation data integrity**
     * **Validates: Requirements 3.5**
     */
    public function test_translation_data_integrity_with_model_deletion()
    {
        $product = Product::factory()->create(['tenant_id' => $this->tenant->id]);
        $productId = $product->id;
        
        // Add translations
        $this->translator->storeTranslation('Product', $productId, 'name', 'ar', 'منتج للحذف');
        $this->translator->storeTranslation('Product', $productId, 'description', 'ar', 'وصف منتج للحذف');
        
        // Verify translations exist
        $this->assertNotNull($this->translator->translateField('Product', $productId, 'name', 'ar'));
        $this->assertNotNull($this->translator->translateField('Product', $productId, 'description', 'ar'));
        
        // Delete the model
        $product->delete();
        
        // Verify translations still exist in database (orphaned but intact)
        $this->assertNotNull($this->translator->translateField('Product', $productId, 'name', 'ar'));
        $this->assertNotNull($this->translator->translateField('Product', $productId, 'description', 'ar'));
        
        // Clean up orphaned translations
        $this->translator->deleteModelTranslations($product);
        
        // Verify translations are now removed
        $this->assertNull($this->translator->translateField('Product', $productId, 'name', 'ar'));
        $this->assertNull($this->translator->translateField('Product', $productId, 'description', 'ar'));
    }

    /**
     * **Feature: comprehensive-i18n-system, Property 6: Translation data integrity**
     * **Validates: Requirements 3.5**
     */
    public function test_bulk_translation_operations_integrity()
    {
        // Create multiple models
        $products = Product::factory()->count(5)->create(['tenant_id' => $this->tenant->id]);
        
        // Prepare bulk translation data
        $bulkData = [];
        foreach ($products as $index => $product) {
            $bulkData[] = [
                'model_type' => 'Product',
                'model_id' => $product->id,
                'field_name' => 'name',
                'locale' => 'ar',
                'value' => "منتج رقم " . ($index + 1)
            ];
            $bulkData[] = [
                'model_type' => 'Product',
                'model_id' => $product->id,
                'field_name' => 'description',
                'locale' => 'ar',
                'value' => "وصف منتج رقم " . ($index + 1)
            ];
        }
        
        // Perform bulk operation
        $this->translator->bulkStoreTranslations($bulkData);
        
        // Verify all translations were stored correctly
        foreach ($products as $index => $product) {
            $expectedName = "منتج رقم " . ($index + 1);
            $expectedDescription = "وصف منتج رقم " . ($index + 1);
            
            $this->assertEquals($expectedName, $product->getTranslation('name', 'ar'));
            $this->assertEquals($expectedDescription, $product->getTranslation('description', 'ar'));
        }
        
        // Verify translation count is correct
        $totalTranslations = $products->count() * 2; // 2 fields per product
        $actualCount = \App\Models\ModelTranslation::where('model_type', 'Product')
            ->whereIn('model_id', $products->pluck('id'))
            ->count();
        $this->assertEquals($totalTranslations, $actualCount);
    }

    /**
     * **Feature: comprehensive-i18n-system, Property 6: Translation data integrity**
     * **Validates: Requirements 3.5**
     */
    public function test_translation_validation_prevents_invalid_data()
    {
        $product = Product::factory()->create(['tenant_id' => $this->tenant->id]);
        
        // Test invalid locale validation
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Invalid locale: fr. Only 'ar' and 'en' are supported.");
        $this->translator->storeTranslation('Product', $product->id, 'name', 'fr', 'French Name');
    }

    public function test_translation_validation_prevents_invalid_model_type()
    {
        // Test invalid model type validation
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Invalid model type: InvalidModel");
        $this->translator->storeTranslation('InvalidModel', 1, 'name', 'ar', 'Arabic Name');
    }
}