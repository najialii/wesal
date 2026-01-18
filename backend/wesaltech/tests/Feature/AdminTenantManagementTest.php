<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Tenant;
use App\Models\Plan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

class AdminTenantManagementTest extends TestCase
{
    use RefreshDatabase;

    private User $superAdmin;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->superAdmin = User::factory()->create([
            'is_super_admin' => true,
        ]);
    }

    /**
     * **Feature: super-admin-enhancement, Property 1: Tenant management interface displays complete information**
     * 
     * For any set of tenants with various statuses and subscription details, 
     * the tenant management interface should display all tenants with their current status, 
     * subscription information, and relevant metadata correctly formatted
     */
    public function test_tenant_management_interface_displays_complete_information(): void
    {
        Sanctum::actingAs($this->superAdmin);

        // Create test plans
        $plans = Plan::factory()->count(3)->create();

        // Create tenants with various statuses and configurations
        $tenants = collect();
        
        // Active tenant with plan
        $tenants->push(Tenant::factory()->create([
            'status' => 'active',
            'plan_id' => $plans->first()->id,
            'trial_ends_at' => now()->addDays(14),
        ]));

        // Suspended tenant
        $tenants->push(Tenant::factory()->create([
            'status' => 'suspended',
            'plan_id' => $plans->get(1)->id,
            'trial_ends_at' => null,
        ]));

        // Cancelled tenant
        $tenants->push(Tenant::factory()->create([
            'status' => 'cancelled',
            'plan_id' => $plans->last()->id,
            'trial_ends_at' => now()->subDays(5),
        ]));

        // Test the API endpoint
        $response = $this->getJson('/api/admin/tenants');

        $response->assertStatus(200);
        $responseData = $response->json();

        // Verify response structure
        $this->assertArrayHasKey('data', $responseData);
        $this->assertArrayHasKey('total', $responseData);
        $this->assertArrayHasKey('per_page', $responseData);

        // Verify all tenants are returned
        $this->assertCount(3, $responseData['data']);

        // Verify each tenant has complete information
        foreach ($responseData['data'] as $tenantData) {
            $this->assertArrayHasKey('id', $tenantData);
            $this->assertArrayHasKey('name', $tenantData);
            $this->assertArrayHasKey('domain', $tenantData);
            $this->assertArrayHasKey('status', $tenantData);
            $this->assertArrayHasKey('plan', $tenantData);
            $this->assertArrayHasKey('created_at', $tenantData);
            $this->assertArrayHasKey('trial_ends_at', $tenantData);

            // Verify status is one of the valid values
            $this->assertContains($tenantData['status'], ['active', 'suspended', 'cancelled']);

            // Verify plan information is included
            if ($tenantData['plan']) {
                $this->assertArrayHasKey('id', $tenantData['plan']);
                $this->assertArrayHasKey('name', $tenantData['plan']);
                $this->assertArrayHasKey('price', $tenantData['plan']);
            }
        }

        // Test filtering by status
        $response = $this->getJson('/api/admin/tenants?status=active');
        $response->assertStatus(200);
        $activeTenantsData = $response->json()['data'];
        
        foreach ($activeTenantsData as $tenant) {
            $this->assertEquals('active', $tenant['status']);
        }

        // Test search functionality
        $searchTenant = $tenants->first();
        $response = $this->getJson('/api/admin/tenants?search=' . substr($searchTenant->name, 0, 5));
        $response->assertStatus(200);
        
        $searchResults = $response->json()['data'];
        $this->assertGreaterThan(0, count($searchResults));
        
        // Verify search results contain the expected tenant
        $foundTenant = collect($searchResults)->firstWhere('id', $searchTenant->id);
        $this->assertNotNull($foundTenant);
    }

    /**
     * **Feature: super-admin-enhancement, Property 2: Tenant creation validation and isolation**
     * 
     * For any tenant creation request, the system should validate all required fields 
     * and create tenants with proper data isolation when valid, or reject with 
     * appropriate error messages when invalid
     */
    public function test_tenant_creation_validation_and_isolation(): void
    {
        Sanctum::actingAs($this->superAdmin);

        $plan = Plan::factory()->create();

        // Test valid tenant creation
        $validTenantData = [
            'name' => 'Test Company Ltd',
            'domain' => 'testcompany.example.com',
            'plan_id' => $plan->id,
            'trial_days' => 30,
        ];

        $response = $this->postJson('/api/admin/tenants', $validTenantData);
        $response->assertStatus(201);

        $responseData = $response->json();
        $this->assertArrayHasKey('tenant', $responseData);
        $this->assertEquals($validTenantData['name'], $responseData['tenant']['name']);
        $this->assertEquals($validTenantData['domain'], $responseData['tenant']['domain']);
        $this->assertEquals('active', $responseData['tenant']['status']);
        $this->assertNotNull($responseData['tenant']['trial_ends_at']);

        // Verify tenant was created in database
        $this->assertDatabaseHas('tenants', [
            'name' => $validTenantData['name'],
            'domain' => $validTenantData['domain'],
            'plan_id' => $plan->id,
            'status' => 'active',
        ]);

        // Test validation errors for invalid data
        $invalidDataSets = [
            // Missing required fields
            [
                'data' => ['name' => 'Test'],
                'expectedErrors' => ['domain', 'plan_id']
            ],
            // Invalid domain format
            [
                'data' => [
                    'name' => 'Test Company',
                    'domain' => 'invalid-domain',
                    'plan_id' => $plan->id,
                ],
                'expectedErrors' => ['domain']
            ],
            // Duplicate domain
            [
                'data' => [
                    'name' => 'Another Company',
                    'domain' => $validTenantData['domain'], // Same as created above
                    'plan_id' => $plan->id,
                ],
                'expectedErrors' => ['domain']
            ],
            // Invalid plan ID
            [
                'data' => [
                    'name' => 'Test Company',
                    'domain' => 'unique.example.com',
                    'plan_id' => 99999,
                ],
                'expectedErrors' => ['plan_id']
            ],
            // Invalid trial days
            [
                'data' => [
                    'name' => 'Test Company',
                    'domain' => 'another.example.com',
                    'plan_id' => $plan->id,
                    'trial_days' => 400, // Exceeds maximum
                ],
                'expectedErrors' => ['trial_days']
            ],
        ];

        foreach ($invalidDataSets as $testCase) {
            $response = $this->postJson('/api/admin/tenants', $testCase['data']);
            $response->assertStatus(422);

            $errors = $response->json('errors');
            foreach ($testCase['expectedErrors'] as $expectedError) {
                $this->assertArrayHasKey($expectedError, $errors);
            }
        }
    }

    /**
     * **Feature: super-admin-enhancement, Property 3: Tenant data updates maintain integrity**
     * 
     * For any tenant and any valid update data, updating tenant information should 
     * preserve referential integrity and maintain all existing relationships while 
     * applying the changes correctly
     */
    public function test_tenant_data_updates_maintain_integrity(): void
    {
        Sanctum::actingAs($this->superAdmin);

        $originalPlan = Plan::factory()->create();
        $newPlan = Plan::factory()->create();

        // Create a tenant with relationships
        $tenant = Tenant::factory()->create([
            'plan_id' => $originalPlan->id,
            'status' => 'active',
        ]);

        // Test updating basic information
        $updateData = [
            'name' => 'Updated Company Name',
            'plan_id' => $newPlan->id,
            'status' => 'suspended',
        ];

        $response = $this->putJson("/api/admin/tenants/{$tenant->id}", $updateData);
        $response->assertStatus(200);

        // Debug: Check what was actually sent and received
        $responseData = $response->json();
        
        // Verify the tenant was updated
        $tenant->refresh();
        $this->assertEquals($updateData['name'], $tenant->name);
        $this->assertEquals($updateData['plan_id'], $tenant->plan_id);
        $this->assertEquals($updateData['status'], $tenant->status);

        // Verify relationships are maintained
        $this->assertTrue($tenant->plan->is($newPlan));

        // Test domain update
        $newDomain = 'updated-domain.example.com';
        $response = $this->putJson("/api/admin/tenants/{$tenant->id}", [
            'domain' => $newDomain,
        ]);
        $response->assertStatus(200);

        // Verify domain was updated
        $tenant->refresh();
        $this->assertEquals($newDomain, $tenant->domain);

        // Test partial updates don't affect other fields
        $originalName = $tenant->name;
        $response = $this->putJson("/api/admin/tenants/{$tenant->id}", [
            'status' => 'active',
        ]);
        $response->assertStatus(200);

        $tenant->refresh();
        $this->assertEquals('active', $tenant->status);
        $this->assertEquals($originalName, $tenant->name); // Should remain unchanged

        // Test validation during updates
        $response = $this->putJson("/api/admin/tenants/{$tenant->id}", [
            'domain' => 'invalid-domain-format',
        ]);
        $response->assertStatus(422);

        // Verify tenant wasn't changed after validation failure
        $tenant->refresh();
        $this->assertEquals($newDomain, $tenant->domain);

        // Test updating non-existent tenant
        $response = $this->putJson('/api/admin/tenants/99999', $updateData);
        $response->assertStatus(404);
    }
}