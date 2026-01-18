<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class BusinessOperationsTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected $tenant;
    protected $tenantAdmin;
    protected $manager;
    protected $salesman;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create tenant
        $this->tenant = Tenant::factory()->create();
        
        // Create roles
        Role::create(['name' => 'tenant_admin']);
        Role::create(['name' => 'manager']);
        Role::create(['name' => 'salesman']);
        
        // Create users with different roles
        $this->tenantAdmin = User::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);
        $this->tenantAdmin->assignRole('tenant_admin');
        
        $this->manager = User::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);
        $this->manager->assignRole('manager');
        
        $this->salesman = User::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);
        $this->salesman->assignRole('salesman');
        
        // Seed permissions
        $this->artisan('db:seed', ['--class' => 'RolePermissionSeeder']);
    }

    /** @test */
    public function tenant_admin_can_manage_categories()
    {
        Sanctum::actingAs($this->tenantAdmin);

        // Create category
        $response = $this->postJson('/api/tenant/categories', [
            'name' => 'Electronics',
            'description' => 'Electronic products',
            'is_active' => true,
        ]);

        $response->assertStatus(201)
                ->assertJsonStructure([
                    'message',
                    'category' => ['id', 'name', 'description', 'is_active']
                ]);

        $categoryId = $response->json('category.id');

        // Update category
        $response = $this->putJson("/api/tenant/categories/{$categoryId}", [
            'name' => 'Updated Electronics',
            'description' => 'Updated description',
        ]);

        $response->assertStatus(200);

        // Delete category
        $response = $this->deleteJson("/api/tenant/categories/{$categoryId}");
        $response->assertStatus(200);
    }

    /** @test */
    public function tenant_admin_can_manage_products()
    {
        Sanctum::actingAs($this->tenantAdmin);

        // Create category first
        $category = Category::factory()->create(['tenant_id' => $this->tenant->id]);

        // Create product
        $response = $this->postJson('/api/tenant/products', [
            'category_id' => $category->id,
            'name' => 'iPhone 15',
            'sku' => 'IP15-001',
            'description' => 'Latest iPhone model',
            'cost_price' => 800.00,
            'selling_price' => 1200.00,
            'stock_quantity' => 50,
            'min_stock_level' => 10,
            'unit' => 'piece',
            'tax_rate' => 15.00,
            'is_active' => true,
        ]);

        $response->assertStatus(201)
                ->assertJsonStructure([
                    'message',
                    'product' => ['id', 'name', 'sku', 'selling_price']
                ]);

        $productId = $response->json('product.id');

        // Update product
        $response = $this->putJson("/api/tenant/products/{$productId}", [
            'name' => 'iPhone 15 Pro',
            'selling_price' => 1400.00,
        ]);

        $response->assertStatus(200);

        // Delete product
        $response = $this->deleteJson("/api/tenant/products/{$productId}");
        $response->assertStatus(200);
    }

    /** @test */
    public function tenant_admin_can_manage_staff()
    {
        Sanctum::actingAs($this->tenantAdmin);

        // Create staff member
        $response = $this->postJson('/api/tenant/staff', [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => 'password123',
            'phone' => '+1234567890',
            'role' => 'salesman',
        ]);

        $response->assertStatus(201)
                ->assertJsonStructure([
                    'message',
                    'user' => ['id', 'name', 'email', 'roles']
                ]);

        $staffId = $response->json('user.id');

        // Update staff member
        $response = $this->putJson("/api/tenant/staff/{$staffId}", [
            'name' => 'John Smith',
            'role' => 'manager',
        ]);

        $response->assertStatus(200);

        // Delete staff member
        $response = $this->deleteJson("/api/tenant/staff/{$staffId}");
        $response->assertStatus(200);
    }

    /** @test */
    public function manager_can_manage_products_and_categories()
    {
        Sanctum::actingAs($this->manager);

        // Create category
        $response = $this->postJson('/api/tenant/categories', [
            'name' => 'Clothing',
            'is_active' => true,
        ]);

        $response->assertStatus(201);
        $categoryId = $response->json('category.id');

        // Create product
        $response = $this->postJson('/api/tenant/products', [
            'category_id' => $categoryId,
            'name' => 'T-Shirt',
            'sku' => 'TS-001',
            'cost_price' => 10.00,
            'selling_price' => 25.00,
            'stock_quantity' => 100,
            'min_stock_level' => 20,
            'unit' => 'piece',
            'is_active' => true,
        ]);

        $response->assertStatus(201);
    }

    /** @test */
    public function salesman_can_view_but_not_create_products()
    {
        Sanctum::actingAs($this->salesman);

        // Can view products
        $response = $this->getJson('/api/tenant/products');
        $response->assertStatus(200);

        // Cannot create products
        $response = $this->postJson('/api/tenant/products', [
            'name' => 'Test Product',
            'sku' => 'TEST-001',
            'cost_price' => 10.00,
            'selling_price' => 20.00,
            'stock_quantity' => 10,
            'min_stock_level' => 5,
            'unit' => 'piece',
        ]);

        $response->assertStatus(403);
    }

    /** @test */
    public function users_cannot_access_other_tenant_data()
    {
        // Create another tenant with data
        $otherTenant = Tenant::factory()->create();
        $otherCategory = Category::factory()->create(['tenant_id' => $otherTenant->id]);
        $otherProduct = Product::factory()->create([
            'tenant_id' => $otherTenant->id,
            'category_id' => $otherCategory->id,
        ]);

        Sanctum::actingAs($this->tenantAdmin);

        // Try to access other tenant's product (should return 404 due to tenant scoping)
        $response = $this->getJson("/api/tenant/products/{$otherProduct->id}");
        $response->assertStatus(404); // Should be 404 because tenant scoping filters it out

        // Try to access other tenant's category (should return 404 due to tenant scoping)
        $response = $this->getJson("/api/tenant/categories/{$otherCategory->id}");
        $response->assertStatus(404); // Should be 404 because tenant scoping filters it out
    }
}