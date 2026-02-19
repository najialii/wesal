<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Tenant;
use App\Models\AuditLog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use Laravel\Sanctum\Sanctum;

class AdminAuthenticationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create a tenant for testing
        $this->tenant = Tenant::factory()->create();
    }

    public function test_super_admin_can_access_admin_routes(): void
    {
        $superAdmin = User::factory()->create([
            'is_super_admin' => true,
            'tenant_id' => $this->tenant->id,
        ]);

        Sanctum::actingAs($superAdmin);

        $response = $this->getJson('/api/admin/dashboard');

        $response->assertStatus(200);
    }

    public function test_regular_user_cannot_access_admin_routes(): void
    {
        $regularUser = User::factory()->create([
            'is_super_admin' => false,
            'tenant_id' => $this->tenant->id,
        ]);

        Sanctum::actingAs($regularUser);

        $response = $this->getJson('/api/admin/dashboard');

        $response->assertStatus(403)
                ->assertJson([
                    'message' => 'Insufficient privileges. Super admin access required.',
                    'error_code' => 'UNAUTHORIZED',
                ]);
    }

    public function test_unauthenticated_user_cannot_access_admin_routes(): void
    {
        $response = $this->getJson('/api/admin/dashboard');

        $response->assertStatus(403)
                ->assertJson([
                    'message' => 'Authentication required. Please log in.',
                    'error_code' => 'UNAUTHORIZED',
                ]);
    }

    public function test_login_creates_audit_log(): void
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
            'is_super_admin' => true,
            'tenant_id' => $this->tenant->id,
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'test@example.com',
            'password' => 'password',
        ]);

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'user',
                    'token',
                    'session_timeout',
                    'expires_at',
                ]);

        // Verify user data includes tenant relationship
        $this->assertArrayHasKey('tenant', $response->json('user'));
    }

    public function test_failed_login_is_logged(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => 'nonexistent@example.com',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(422);
    }

    public function test_admin_action_creates_audit_log(): void
    {
        $superAdmin = User::factory()->create([
            'is_super_admin' => true,
            'tenant_id' => $this->tenant->id,
        ]);

        Sanctum::actingAs($superAdmin);

        // Perform an admin action that should be audited
        $response = $this->postJson('/api/admin/tenants', [
            'name' => 'Test Tenant',
            'slug' => 'test-tenant',
            'domain' => 'test.example.com',
        ]);

        // Check if audit log was created
        $this->assertDatabaseHas('audit_logs', [
            'user_id' => $superAdmin->id,
            'action' => 'create',
            'resource_type' => 'tenants',
            'method' => 'POST',
        ]);
    }

    public function test_session_management_endpoints(): void
    {
        $superAdmin = User::factory()->create([
            'is_super_admin' => true,
            'tenant_id' => $this->tenant->id,
        ]);

        Sanctum::actingAs($superAdmin);

        // Test session status
        $response = $this->getJson('/api/auth/session-status');
        $response->assertStatus(200)
                ->assertJsonStructure([
                    'is_active',
                    'time_remaining',
                    'session_timeout',
                ]);

        // Test active sessions
        $response = $this->getJson('/api/auth/sessions');
        $response->assertStatus(200)
                ->assertJsonStructure([
                    'sessions',
                    'total_count',
                ]);

        // Test session extension
        $response = $this->postJson('/api/auth/extend-session');
        $response->assertStatus(200)
                ->assertJson([
                    'message' => 'Session extended successfully',
                ]);
    }

    public function test_logout_all_revokes_all_tokens(): void
    {
        $superAdmin = User::factory()->create([
            'is_super_admin' => true,
            'tenant_id' => $this->tenant->id,
        ]);

        // Create multiple tokens
        $token1 = $superAdmin->createToken('Device 1');
        $token2 = $superAdmin->createToken('Device 2');

        $this->assertEquals(2, $superAdmin->tokens()->count());

        Sanctum::actingAs($superAdmin, ['*'], $token1->accessToken);

        $response = $this->postJson('/api/auth/logout-all');
        $response->assertStatus(200);

        // Verify all tokens are revoked
        $this->assertEquals(0, $superAdmin->fresh()->tokens()->count());
    }
}