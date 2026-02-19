<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Plan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Validator;

class PlanCreationValidationPropertyTest extends TestCase
{
    use RefreshDatabase;

    private User $superAdmin;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->superAdmin = User::factory()->create([
            'role' => 'super_admin',
            'email' => 'admin@wesaltech.com'
        ]);
    }

    /**
     * Property 6: Plan creation validation
     * 
     * @test
     */
    public function test_plan_creation_requires_all_mandatory_fields()
    {
        // Property: Plan creation should validate all required fields
        
        $requiredFields = [
            'name' => 'Basic Plan',
            'description' => 'A basic plan for small businesses',
            'price' => 29.99,
            'billing_cycle' => 'monthly',
            'features' => ['feature1', 'feature2'],
            'max_users' => 5,
            'max_storage' => 1024
        ];

        // Test each required field individually
        foreach ($requiredFields as $field => $value) {
            $planData = $requiredFields;
            unset($planData[$field]);

            $response = $this->actingAs($this->superAdmin)
                ->postJson('/api/admin/plans', $planData);

            $response->assertStatus(422)
                ->assertJsonValidationErrors($field);
        }
    }

    /**
     * @test
     */
    public function test_plan_creation_validates_data_types_and_formats()
    {
        $testCases = [
            // Price validation
            [
                'field' => 'price',
                'invalid_values' => [-1, 'invalid', null],
                'valid_value' => 29.99
            ],
            // Billing cycle validation
            [
                'field' => 'billing_cycle',
                'invalid_values' => ['invalid', 'yearly', null],
                'valid_value' => 'monthly'
            ],
            // Max users validation
            [
                'field' => 'max_users',
                'invalid_values' => [-1, 0, 'unlimited'],
                'valid_value' => 10
            ],
            // Max storage validation (in MB)
            [
                'field' => 'max_storage',
                'invalid_values' => [-1, 'unlimited'],
                'valid_value' => 2048
            ],
            // Features validation
            [
                'field' => 'features',
                'invalid_values' => ['not_array', null],
                'valid_value' => ['pos', 'inventory', 'reports']
            ]
        ];

        $basePlanData = [
            'name' => 'Test Plan',
            'description' => 'Test Description',
            'price' => 29.99,
            'billing_cycle' => 'monthly',
            'features' => ['pos', 'inventory'],
            'max_users' => 5,
            'max_storage' => 1024
        ];

        foreach ($testCases as $testCase) {
            foreach ($testCase['invalid_values'] as $invalidValue) {
                $planData = $basePlanData;
                $planData[$testCase['field']] = $invalidValue;

                $response = $this->actingAs($this->superAdmin)
                    ->postJson('/api/admin/plans', $planData);

                $response->assertStatus(422)
                    ->assertJsonValidationErrors($testCase['field']);
            }

            // Test valid value
            $planData = $basePlanData;
            $planData[$testCase['field']] = $testCase['valid_value'];

            $response = $this->actingAs($this->superAdmin)
                ->postJson('/api/admin/plans', $planData);

            $response->assertStatus(201);
            
            // Clean up for next iteration
            Plan::where('name', 'Test Plan')->delete();
        }
    }

    /**
     * @test
     */
    public function test_plan_creation_validates_unique_constraints()
    {
        // Create initial plan
        $planData = [
            'name' => 'Unique Plan',
            'description' => 'A unique plan',
            'price' => 39.99,
            'billing_cycle' => 'monthly',
            'features' => ['pos', 'inventory'],
            'max_users' => 10,
            'max_storage' => 2048
        ];

        $response = $this->actingAs($this->superAdmin)
            ->postJson('/api/admin/plans', $planData);

        $response->assertStatus(201);

        // Property: Should prevent duplicate plan names
        $duplicateResponse = $this->actingAs($this->superAdmin)
            ->postJson('/api/admin/plans', $planData);

        $duplicateResponse->assertStatus(422)
            ->assertJsonValidationErrors('name');
    }

    /**
     * @test
     */
    public function test_plan_creation_validates_business_rules()
    {
        // Property: Business rules should be enforced during plan creation
        
        // Test: Free plan should have price of 0
        $freePlanData = [
            'name' => 'Free Plan',
            'description' => 'Free tier',
            'price' => 10.00, // Invalid: free plan with price
            'billing_cycle' => 'monthly',
            'features' => ['basic'],
            'max_users' => 1,
            'max_storage' => 512,
            'is_free' => true
        ];

        $response = $this->actingAs($this->superAdmin)
            ->postJson('/api/admin/plans', $freePlanData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('price');

        // Test: Premium features require higher tier pricing
        $premiumPlanData = [
            'name' => 'Premium Plan',
            'description' => 'Premium features at basic price',
            'price' => 5.00, // Too low for premium features
            'billing_cycle' => 'monthly',
            'features' => ['pos', 'inventory', 'advanced_reports', 'api_access'],
            'max_users' => 100,
            'max_storage' => 10240
        ];

        $response = $this->actingAs($this->superAdmin)
            ->postJson('/api/admin/plans', $premiumPlanData);

        // Should validate that premium features require appropriate pricing
        $response->assertStatus(422);
    }

    /**
     * @test
     */
    public function test_plan_creation_validates_feature_combinations()
    {
        // Property: Feature combinations should be validated for consistency
        
        $invalidFeatureCombinations = [
            // API access without advanced features
            [
                'features' => ['api_access'],
                'max_users' => 1,
                'expected_error' => 'features'
            ],
            // Advanced reports without inventory
            [
                'features' => ['advanced_reports'],
                'max_users' => 5,
                'expected_error' => 'features'
            ],
            // Multi-location without sufficient user limit
            [
                'features' => ['pos', 'inventory', 'multi_location'],
                'max_users' => 2, // Too few users for multi-location
                'expected_error' => 'max_users'
            ]
        ];

        foreach ($invalidFeatureCombinations as $combination) {
            $planData = [
                'name' => 'Test Plan ' . uniqid(),
                'description' => 'Test plan with invalid feature combination',
                'price' => 49.99,
                'billing_cycle' => 'monthly',
                'features' => $combination['features'],
                'max_users' => $combination['max_users'],
                'max_storage' => 2048
            ];

            $response = $this->actingAs($this->superAdmin)
                ->postJson('/api/admin/plans', $planData);

            $response->assertStatus(422)
                ->assertJsonValidationErrors($combination['expected_error']);
        }
    }

    /**
     * @test
     */
    public function test_successful_plan_creation_with_valid_data()
    {
        // Property: Valid plan data should create plan successfully
        
        $validPlanData = [
            'name' => 'Professional Plan',
            'description' => 'A comprehensive plan for growing businesses',
            'price' => 79.99,
            'billing_cycle' => 'monthly',
            'features' => ['pos', 'inventory', 'reports', 'multi_user'],
            'max_users' => 25,
            'max_storage' => 5120,
            'is_popular' => true,
            'trial_days' => 14
        ];

        $response = $this->actingAs($this->superAdmin)
            ->postJson('/api/admin/plans', $validPlanData);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'name',
                    'description',
                    'price',
                    'billing_cycle',
                    'features',
                    'max_users',
                    'max_storage',
                    'is_popular',
                    'trial_days',
                    'created_at',
                    'updated_at'
                ]
            ]);

        // Verify plan was created in database
        $this->assertDatabaseHas('plans', [
            'name' => 'Professional Plan',
            'price' => 79.99,
            'billing_cycle' => 'monthly',
            'max_users' => 25,
            'max_storage' => 5120
        ]);

        // Verify features were stored correctly
        $plan = Plan::where('name', 'Professional Plan')->first();
        $this->assertEquals(['pos', 'inventory', 'reports', 'multi_user'], $plan->features);
    }

    /**
     * @test
     */
    public function test_plan_creation_authorization()
    {
        // Property: Only super admins should be able to create plans
        
        $regularUser = User::factory()->create(['role' => 'user']);
        $tenantAdmin = User::factory()->create(['role' => 'tenant_admin']);

        $planData = [
            'name' => 'Unauthorized Plan',
            'description' => 'Should not be created',
            'price' => 29.99,
            'billing_cycle' => 'monthly',
            'features' => ['pos'],
            'max_users' => 5,
            'max_storage' => 1024
        ];

        // Test regular user
        $response = $this->actingAs($regularUser)
            ->postJson('/api/admin/plans', $planData);

        $response->assertStatus(403);

        // Test tenant admin
        $response = $this->actingAs($tenantAdmin)
            ->postJson('/api/admin/plans', $planData);

        $response->assertStatus(403);

        // Test super admin (should succeed)
        $response = $this->actingAs($this->superAdmin)
            ->postJson('/api/admin/plans', $planData);

        $response->assertStatus(201);
    }
}