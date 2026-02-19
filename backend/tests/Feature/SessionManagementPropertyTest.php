<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Laravel\Sanctum\Sanctum;

/**
 * **Feature: super-admin-enhancement, Property 20: Session management capabilities**
 * 
 * Property-based test for session management capabilities.
 * Tests that for any super admin with multiple active sessions, the system should provide 
 * session management capabilities including viewing active sessions and forcing logout.
 */
class SessionManagementPropertyTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create a tenant for testing
        $this->tenant = Tenant::factory()->create();
    }

    /**
     * **Feature: super-admin-enhancement, Property 20: Session management capabilities**
     * 
     * Property: For any super admin with multiple active sessions, the system should provide 
     * session management capabilities including viewing active sessions and forcing logout.
     * 
     * This test runs multiple iterations with different combinations of:
     * - Number of active sessions (1 to 5)
     * - Different device types and names
     * - Session management operations
     */
    public function test_session_management_capabilities_property(): void
    {
        $iterations = 30; // Property-based test iterations
        
        for ($i = 0; $i < $iterations; $i++) {
            $superAdmin = User::factory()->create([
                'is_super_admin' => true,
                'tenant_id' => $this->tenant->id,
            ]);

            // Create random number of sessions (1 to 5)
            $sessionCount = rand(1, 5);
            $tokens = [];
            $deviceNames = [
                'Chrome on Windows (192.168.1.100)',
                'Firefox on macOS (10.0.0.50)',
                'Safari on iOS (172.16.0.25)',
                'Edge on Windows (192.168.1.101)',
                'Chrome on Android (10.0.0.75)',
            ];

            // Create multiple sessions
            for ($j = 0; $j < $sessionCount; $j++) {
                $deviceName = $deviceNames[array_rand($deviceNames)] . " - Session $j";
                $token = $superAdmin->createToken($deviceName);
                $tokens[] = $token;
            }

            // Use simple Sanctum authentication
            Sanctum::actingAs($superAdmin);

            // Test 1: View active sessions
            $response = $this->getJson('/api/auth/sessions');
            
            $this->assertEquals(200, $response->getStatusCode(),
                "Super admin should be able to view active sessions");
            
            $responseData = $response->json();
            $this->assertArrayHasKey('sessions', $responseData,
                "Response should contain sessions array");
            $this->assertArrayHasKey('total_count', $responseData,
                "Response should contain total_count");
            $this->assertEquals($sessionCount, $responseData['total_count'],
                "Total count should match created sessions");
            $this->assertCount($sessionCount, $responseData['sessions'],
                "Sessions array should contain all created sessions");

            // Verify session data structure
            foreach ($responseData['sessions'] as $session) {
                $this->assertArrayHasKey('id', $session,
                    "Session should have id");
                $this->assertArrayHasKey('name', $session,
                    "Session should have name");
                $this->assertArrayHasKey('created_at', $session,
                    "Session should have created_at");
                $this->assertArrayHasKey('last_used_at', $session,
                    "Session should have last_used_at");
                $this->assertArrayHasKey('expires_at', $session,
                    "Session should have expires_at");
                $this->assertArrayHasKey('is_current', $session,
                    "Session should have is_current flag");
            }

            // Test 2: Identify current session
            $currentSession = collect($responseData['sessions'])->firstWhere('is_current', true);
            $this->assertNotNull($currentSession,
                "One session should be marked as current");

            // Test 3: Revoke a non-current session (if multiple sessions exist)
            if ($sessionCount > 1) {
                $nonCurrentSession = collect($responseData['sessions'])->firstWhere('is_current', false);
                $this->assertNotNull($nonCurrentSession,
                    "Should have at least one non-current session");

                $revokeResponse = $this->deleteJson("/api/auth/sessions/{$nonCurrentSession['id']}");
                $this->assertEquals(200, $revokeResponse->getStatusCode(),
                    "Should be able to revoke non-current session");

                // Verify session was revoked
                $updatedResponse = $this->getJson('/api/auth/sessions');
                $updatedData = $updatedResponse->json();
                $this->assertEquals($sessionCount - 1, $updatedData['total_count'],
                    "Session count should decrease after revocation");
            }

            // Test 4: Cannot revoke current session
            $currentSessionId = $currentSession['id'];
            $revokeCurrentResponse = $this->deleteJson("/api/auth/sessions/{$currentSessionId}");
            $this->assertEquals(400, $revokeCurrentResponse->getStatusCode(),
                "Should not be able to revoke current session");
            
            $errorData = $revokeCurrentResponse->json();
            $this->assertArrayHasKey('message', $errorData,
                "Error response should contain message");
            $this->assertStringContainsString('Cannot revoke current session', $errorData['message'],
                "Error message should explain why current session cannot be revoked");

            // Test 5: Session status endpoint
            $statusResponse = $this->getJson('/api/auth/session-status');
            $this->assertEquals(200, $statusResponse->getStatusCode(),
                "Should be able to check session status");
            
            $statusData = $statusResponse->json();
            $this->assertArrayHasKey('is_active', $statusData,
                "Status should indicate if session is active");
            $this->assertArrayHasKey('session_timeout', $statusData,
                "Status should include session timeout");

            // Test 6: Session extension
            $extendResponse = $this->postJson('/api/auth/extend-session');
            $this->assertEquals(200, $extendResponse->getStatusCode(),
                "Should be able to extend session");
            
            $extendData = $extendResponse->json();
            $this->assertArrayHasKey('message', $extendData,
                "Extend response should contain message");

            // Clean up: logout all sessions for next iteration
            $logoutAllResponse = $this->postJson('/api/auth/logout-all');
            $this->assertEquals(200, $logoutAllResponse->getStatusCode(),
                "Should be able to logout from all sessions");

            // Verify all sessions are revoked
            $this->assertEquals(0, $superAdmin->fresh()->tokens()->count(),
                "All tokens should be revoked after logout-all");
        }
    }

    /**
     * **Feature: super-admin-enhancement, Property 20: Session management capabilities**
     * 
     * Property test for logout-all functionality.
     * Tests that logout-all properly revokes all sessions regardless of session count.
     */
    public function test_logout_all_revokes_all_sessions_property(): void
    {
        $iterations = 20;
        
        for ($i = 0; $i < $iterations; $i++) {
            $superAdmin = User::factory()->create([
                'is_super_admin' => true,
                'tenant_id' => $this->tenant->id,
            ]);

            // Create random number of sessions (2 to 10)
            $sessionCount = rand(2, 10);
            $tokens = [];

            for ($j = 0; $j < $sessionCount; $j++) {
                $deviceName = "Device $j - Test Session";
                $token = $superAdmin->createToken($deviceName);
                $tokens[] = $token;
            }

            // Verify sessions were created
            $this->assertEquals($sessionCount, $superAdmin->tokens()->count(),
                "Should have created $sessionCount sessions");

            // Use first token for authentication
            Sanctum::actingAs($superAdmin, ['*'], $tokens[0]->accessToken);

            // Logout from all devices
            $response = $this->postJson('/api/auth/logout-all');
            
            $this->assertEquals(200, $response->getStatusCode(),
                "Logout-all should succeed");
            
            $responseData = $response->json();
            $this->assertArrayHasKey('message', $responseData,
                "Response should contain success message");

            // Verify all tokens are revoked
            $this->assertEquals(0, $superAdmin->fresh()->tokens()->count(),
                "All sessions should be revoked after logout-all");

            // Verify user can no longer access protected endpoints
            $testResponse = $this->getJson('/api/auth/sessions');
            $this->assertEquals(401, $testResponse->getStatusCode(),
                "Should not be able to access protected endpoints after logout-all");
        }
    }

    /**
     * **Feature: super-admin-enhancement, Property 20: Session management capabilities**
     * 
     * Property test for session data consistency.
     * Tests that session information remains consistent across different operations.
     */
    public function test_session_data_consistency_property(): void
    {
        $iterations = 15;
        
        for ($i = 0; $i < $iterations; $i++) {
            $superAdmin = User::factory()->create([
                'is_super_admin' => true,
                'tenant_id' => $this->tenant->id,
            ]);

            // Create sessions with specific device names
            $deviceNames = [
                "Chrome on Windows (Test $i)",
                "Firefox on macOS (Test $i)",
                "Safari on iOS (Test $i)",
            ];

            $tokens = [];
            foreach ($deviceNames as $deviceName) {
                $token = $superAdmin->createToken($deviceName);
                $tokens[] = $token;
            }

            // Use first token for authentication
            Sanctum::actingAs($superAdmin, ['*'], $tokens[0]->accessToken);

            // Get sessions multiple times to ensure consistency
            $response1 = $this->getJson('/api/auth/sessions');
            $response2 = $this->getJson('/api/auth/sessions');

            $this->assertEquals(200, $response1->getStatusCode());
            $this->assertEquals(200, $response2->getStatusCode());

            $data1 = $response1->json();
            $data2 = $response2->json();

            // Verify consistency
            $this->assertEquals($data1['total_count'], $data2['total_count'],
                "Session count should be consistent across calls");
            $this->assertCount(count($deviceNames), $data1['sessions'],
                "Should return all created sessions");

            // Verify device names are preserved
            $returnedNames = collect($data1['sessions'])->pluck('name')->toArray();
            foreach ($deviceNames as $deviceName) {
                $this->assertContains($deviceName, $returnedNames,
                    "Device name '$deviceName' should be preserved in session data");
            }

            // Verify exactly one session is marked as current
            $currentSessions = collect($data1['sessions'])->where('is_current', true);
            $this->assertEquals(1, $currentSessions->count(),
                "Exactly one session should be marked as current");

            // Clean up
            $superAdmin->tokens()->delete();
        }
    }

    /**
     * **Feature: super-admin-enhancement, Property 20: Session management capabilities**
     * 
     * Property test for session revocation edge cases.
     * Tests various edge cases in session revocation functionality.
     */
    public function test_session_revocation_edge_cases_property(): void
    {
        $iterations = 15;
        
        for ($i = 0; $i < $iterations; $i++) {
            $superAdmin = User::factory()->create([
                'is_super_admin' => true,
                'tenant_id' => $this->tenant->id,
            ]);

            // Create multiple sessions
            $sessionCount = rand(3, 6);
            $tokens = [];
            
            for ($j = 0; $j < $sessionCount; $j++) {
                $token = $superAdmin->createToken("Session $j");
                $tokens[] = $token;
            }

            Sanctum::actingAs($superAdmin, ['*'], $tokens[0]->accessToken);

            // Test 1: Try to revoke non-existent session
            $nonExistentId = 99999;
            $response = $this->deleteJson("/api/auth/sessions/{$nonExistentId}");
            $this->assertEquals(404, $response->getStatusCode(),
                "Should return 404 for non-existent session");

            // Test 2: Try to revoke session belonging to another user
            $otherUser = User::factory()->create([
                'is_super_admin' => true,
                'tenant_id' => $this->tenant->id,
            ]);
            $otherToken = $otherUser->createToken('Other User Session');
            
            $response = $this->deleteJson("/api/auth/sessions/{$otherToken->accessToken->id}");
            $this->assertEquals(404, $response->getStatusCode(),
                "Should return 404 when trying to revoke another user's session");

            // Test 3: Verify session list after partial revocation
            $sessionsResponse = $this->getJson('/api/auth/sessions');
            $sessions = $sessionsResponse->json()['sessions'];
            
            // Revoke a non-current session
            $nonCurrentSession = collect($sessions)->firstWhere('is_current', false);
            if ($nonCurrentSession) {
                $revokeResponse = $this->deleteJson("/api/auth/sessions/{$nonCurrentSession['id']}");
                $this->assertEquals(200, $revokeResponse->getStatusCode());

                // Verify the specific session was removed
                $updatedResponse = $this->getJson('/api/auth/sessions');
                $updatedSessions = $updatedResponse->json()['sessions'];
                
                $revokedSessionExists = collect($updatedSessions)
                    ->contains('id', $nonCurrentSession['id']);
                $this->assertFalse($revokedSessionExists,
                    "Revoked session should not appear in session list");
            }

            // Clean up
            $superAdmin->tokens()->delete();
            $otherUser->tokens()->delete();
        }
    }
}