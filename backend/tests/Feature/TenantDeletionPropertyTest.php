<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Tenant;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Customer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;

class TenantDeletionPropertyTest extends TestCase
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
     * Property 4: Tenant deletion archives and revokes access
     * 
     * @test
     */
    public function test_tenant_deletion_archives_data_and_revokes_access()
    {
        // Create tenant with associated data
        $tenant = Tenant::factory()->create([
            'name' => 'Test Tenant',
            'email' => 'tenant@example.com',
            'status' => 'active'
        ]);

        // Create tenant users
        $tenantAdmin = User::factory()->create([
            'tenant_id' => $tenant->id,
            'role' => 'tenant_admin',
            'email' => 'admin@tenant.com'
        ]);

        $tenantUser = User::factory()->create([
            'tenant_id' => $tenant->id,
            'role' => 'user',
            'email' => 'user@tenant.com'
        ]);

        // Create tenant data
        $product = Product::factory()->create(['tenant_id' => $tenant->id]);
        $customer = Customer::factory()->create(['tenant_id' => $tenant->id]);
        $sale = Sale::factory()->create(['tenant_id' => $tenant->id]);

        // Verify initial state
        $this->assertEquals('active', $tenant->status);
        $this->assertDatabaseHas('users', ['id' => $tenantAdmin->id, 'tenant_id' => $tenant->id]);
        $this->assertDatabaseHas('products', ['id' => $product->id, 'tenant_id' => $tenant->id]);

        // Property: Tenant deletion should archive data and revoke access
        $response = $this->actingAs($this->superAdmin)
            ->deleteJson("/api/admin/tenants/{$tenant->id}");

        $response->assertStatus(200);

        // Verify tenant is soft deleted (archived)
        $tenant->refresh();
        $this->assertNotNull($tenant->deleted_at);
        $this->assertEquals('archived', $tenant->status);

        // Verify tenant users are deactivated
        $tenantAdmin->refresh();
        $tenantUser->refresh();
        $this->assertFalse($tenantAdmin->is_active);
        $this->assertFalse($tenantUser->is_active);

        // Verify tenant data is preserved but marked as archived
        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'tenant_id' => $tenant->id
        ]);
        $this->assertDatabaseHas('customers', [
            'id' => $customer->id,
            'tenant_id' => $tenant->id
        ]);
        $this->assertDatabaseHas('sales', [
            'id' => $sale->id,
            'tenant_id' => $tenant->id
        ]);
    }

    /**
     * @test
     */
    public function test_tenant_deletion_prevents_future_access()
    {
        $tenant = Tenant::factory()->create(['status' => 'active']);
        $tenantUser = User::factory()->create([
            'tenant_id' => $tenant->id,
            'role' => 'tenant_admin'
        ]);

        // User should initially have access
        $this->assertTrue($tenantUser->is_active);

        // Delete tenant
        $response = $this->actingAs($this->superAdmin)
            ->deleteJson("/api/admin/tenants/{$tenant->id}");

        $response->assertStatus(200);

        // Property: Deleted tenant users should not be able to authenticate
        $tenantUser->refresh();
        $this->assertFalse($tenantUser->is_active);

        // Attempt to authenticate as tenant user should fail
        $loginResponse = $this->postJson('/api/auth/login', [
            'email' => $tenantUser->email,
            'password' => 'password'
        ]);

        $loginResponse->assertStatus(401);
    }

    /**
     * @test
     */
    public function test_tenant_deletion_handles_active_subscriptions()
    {
        $tenant = Tenant::factory()->create([
            'status' => 'active',
            'subscription_status' => 'active'
        ]);

        // Property: Should handle active subscriptions during deletion
        $response = $this->actingAs($this->superAdmin)
            ->deleteJson("/api/admin/tenants/{$tenant->id}");

        $response->assertStatus(200);

        $tenant->refresh();
        $this->assertEquals('cancelled', $tenant->subscription_status);
        $this->assertEquals('archived', $tenant->status);
    }

    /**
     * @test
     */
    public function test_tenant_deletion_creates_audit_trail()
    {
        $tenant = Tenant::factory()->create(['name' => 'Audit Test Tenant']);

        // Delete tenant
        $response = $this->actingAs($this->superAdmin)
            ->deleteJson("/api/admin/tenants/{$tenant->id}");

        $response->assertStatus(200);

        // Property: Should create audit log entry for tenant deletion
        $this->assertDatabaseHas('audit_logs', [
            'user_id' => $this->superAdmin->id,
            'action' => 'tenant_deleted',
            'resource_type' => 'tenant',
            'resource_id' => $tenant->id
        ]);
    }

    /**
     * @test
     */
    public function test_tenant_deletion_validates_permissions()
    {
        $tenant = Tenant::factory()->create();
        $regularUser = User::factory()->create(['role' => 'user']);
        $tenantAdmin = User::factory()->create(['role' => 'tenant_admin']);

        // Property: Only super admins should be able to delete tenants
        
        // Regular user should not be able to delete
        $response = $this->actingAs($regularUser)
            ->deleteJson("/api/admin/tenants/{$tenant->id}");
        $response->assertStatus(403);

        // Tenant admin should not be able to delete
        $response = $this->actingAs($tenantAdmin)
            ->deleteJson("/api/admin/tenants/{$tenant->id}");
        $response->assertStatus(403);

        // Super admin should be able to delete
        $response = $this->actingAs($this->superAdmin)
            ->deleteJson("/api/admin/tenants/{$tenant->id}");
        $response->assertStatus(200);
    }

    /**
     * @test
     */
    public function test_tenant_deletion_handles_data_dependencies()
    {
        $tenant = Tenant::factory()->create();
        
        // Create complex data relationships
        $product = Product::factory()->create(['tenant_id' => $tenant->id]);
        $customer = Customer::factory()->create(['tenant_id' => $tenant->id]);
        $sale = Sale::factory()->create([
            'tenant_id' => $tenant->id,
            'customer_id' => $customer->id
        ]);

        // Property: Should handle data dependencies gracefully
        $response = $this->actingAs($this->superAdmin)
            ->deleteJson("/api/admin/tenants/{$tenant->id}");

        $response->assertStatus(200);

        // All related data should still exist but be associated with archived tenant
        $this->assertDatabaseHas('products', ['id' => $product->id, 'tenant_id' => $tenant->id]);
        $this->assertDatabaseHas('customers', ['id' => $customer->id, 'tenant_id' => $tenant->id]);
        $this->assertDatabaseHas('sales', ['id' => $sale->id, 'tenant_id' => $tenant->id]);

        // Tenant should be soft deleted
        $tenant->refresh();
        $this->assertNotNull($tenant->deleted_at);
    }

    /**
     * @test
     */
    public function test_tenant_deletion_prevents_new_operations()
    {
        $tenant = Tenant::factory()->create(['status' => 'active']);
        $tenantUser = User::factory()->create([
            'tenant_id' => $tenant->id,
            'role' => 'tenant_admin'
        ]);

        // Delete tenant
        $response = $this->actingAs($this->superAdmin)
            ->deleteJson("/api/admin/tenants/{$tenant->id}");

        $response->assertStatus(200);

        // Property: Should prevent new operations on deleted tenant data
        
        // Attempt to create new product for deleted tenant should fail
        $productResponse = $this->actingAs($tenantUser)
            ->postJson('/api/tenant/products', [
                'name' => 'New Product',
                'price' => 10.00,
                'tenant_id' => $tenant->id
            ]);

        $productResponse->assertStatus(403);

        // Attempt to create new sale should fail
        $saleResponse = $this->actingAs($tenantUser)
            ->postJson('/api/tenant/sales', [
                'total_amount' => 100.00,
                'tenant_id' => $tenant->id
            ]);

        $saleResponse->assertStatus(403);
    }

    /**
     * @test
     */
    public function test_tenant_deletion_can_be_restored()
    {
        $tenant = Tenant::factory()->create(['status' => 'active']);
        $tenantUser = User::factory()->create([
            'tenant_id' => $tenant->id,
            'role' => 'tenant_admin'
        ]);

        // Delete tenant
        $deleteResponse = $this->actingAs($this->superAdmin)
            ->deleteJson("/api/admin/tenants/{$tenant->id}");

        $deleteResponse->assertStatus(200);

        // Verify deletion
        $tenant->refresh();
        $this->assertNotNull($tenant->deleted_at);
        $this->assertEquals('archived', $tenant->status);

        // Property: Deleted tenants should be restorable
        $restoreResponse = $this->actingAs($this->superAdmin)
            ->postJson("/api/admin/tenants/{$tenant->id}/restore");

        $restoreResponse->assertStatus(200);

        // Verify restoration
        $tenant->refresh();
        $this->assertNull($tenant->deleted_at);
        $this->assertEquals('active', $tenant->status);

        // Tenant users should be reactivated
        $tenantUser->refresh();
        $this->assertTrue($tenantUser->is_active);
    }

    /**
     * @test
     */
    public function test_bulk_tenant_deletion_maintains_data_integrity()
    {
        $tenants = Tenant::factory()->count(3)->create(['status' => 'active']);
        $tenantIds = $tenants->pluck('id')->toArray();

        // Create data for each tenant
        foreach ($tenants as $tenant) {
            Product::factory()->create(['tenant_id' => $tenant->id]);
            User::factory()->create(['tenant_id' => $tenant->id, 'role' => 'user']);
        }

        // Property: Bulk deletion should maintain data integrity
        $response = $this->actingAs($this->superAdmin)
            ->deleteJson('/api/admin/tenants/bulk', [
                'tenant_ids' => $tenantIds
            ]);

        $response->assertStatus(200);

        // All tenants should be soft deleted
        foreach ($tenants as $tenant) {
            $tenant->refresh();
            $this->assertNotNull($tenant->deleted_at);
            $this->assertEquals('archived', $tenant->status);
        }

        // All related data should still exist
        foreach ($tenantIds as $tenantId) {
            $this->assertDatabaseHas('products', ['tenant_id' => $tenantId]);
            $this->assertDatabaseHas('users', ['tenant_id' => $tenantId]);
        }
    }
}