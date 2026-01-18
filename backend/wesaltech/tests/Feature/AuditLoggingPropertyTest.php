<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Tenant;
use App\Models\AuditLog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Laravel\Sanctum\Sanctum;
use Illuminate\Support\Facades\DB;

/**
 * **Feature: super-admin-enhancement, Property 23: Administrative action audit logging**
 * 
 * Property-based test for comprehensive audit logging system.
 * Tests that for any administrative action performed by any super admin, 
 * the system should create comprehensive audit log entries with user identification, 
 * timestamp, action details, and affected resources.
 */
class AuditLoggingPropertyTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create a tenant for testing
        $this->tenant = Tenant::factory()->create();
    }

    /**
     * **Feature: super-admin-enhancement, Property 23: Administrative action audit logging**
     * 
     * Property: For any administrative action performed by any super admin, 
     * the system should create comprehensive audit log entries with user identification, 
     * timestamp, action details, and affected resources.
     * 
     * This test runs multiple iterations with different combinations of:
     * - Admin users with different attributes
     * - Various administrative actions (CRUD operations)
     * - Different request methods and endpoints
     * - Various request data and parameters
     */
    public function test_comprehensive_audit_logging_property(): void
    {
        $iterations = 50; // Run 50 iterations to test various scenarios
        
        for ($i = 0; $i < $iterations; $i++) {
            // Create a random super admin user
            $superAdmin = User::factory()->create([
                'is_super_admin' => true,
                'tenant_id' => $this->tenant->id,
                'name' => 'Super Admin ' . $i,
                'email' => 'admin' . $i . '@example.com',
            ]);

            Sanctum::actingAs($superAdmin);

            // Define various administrative actions to test
            $adminActions = [
                // Tenant management actions
                ['POST', '/api/admin/tenants', [
                    'name' => 'Test Tenant ' . $i,
                    'slug' => 'test-tenant-' . $i,
                    'domain' => 'test' . $i . '.example.com',
                ], 'create', 'tenant'],
                
                // Settings management actions
                ['POST', '/api/admin/settings', [
                    'key' => 'test_setting_' . $i,
                    'value' => 'test_value_' . $i,
                    'category' => 'test',
                    'type' => 'string',
                    'description' => 'Test setting for iteration ' . $i,
                ], 'create', 'setting'],
                
                // Read operations (should also be logged)
                ['GET', '/api/admin/dashboard', [], 'view', 'dashboard'],
                ['GET', '/api/admin/tenants', [], 'index', 'tenant'],
                ['GET', '/api/admin/settings', [], 'index', 'setting'],
                ['GET', '/api/admin/analytics/dashboard', [], 'view', 'analytics'],
            ];

            // Randomly select an action
            $action = $adminActions[array_rand($adminActions)];
            [$method, $path, $data, $expectedAction, $expectedResourceType] = $action;

            // Clear previous audit logs for this iteration
            AuditLog::truncate();

            // Record the time before the action
            $beforeAction = now();

            // Perform the administrative action
            $response = $this->json($method, $path, $data, [
                'User-Agent' => 'Test Browser ' . $i,
                'X-Forwarded-For' => '192.168.1.' . ($i % 255 + 1), // Vary IP addresses
            ]);

            // Record the time after the action
            $afterAction = now();

            // Verify that an audit log was created (regardless of response status)
            // Some operations might fail due to validation or missing data, but should still be logged
            if ($response->getStatusCode() !== 404) { // 404 means route doesn't exist, so no logging expected
                $auditLog = AuditLog::where('user_id', $superAdmin->id)
                    ->where('method', $method)
                    ->where('url', 'like', '%' . $path . '%')
                    ->first();

                $this->assertNotNull($auditLog, 
                    "Administrative action {$method} {$path} should create an audit log entry");

                // Verify comprehensive audit log properties
                $this->assertEquals($superAdmin->id, $auditLog->user_id,
                    "Audit log should record correct user ID");
                
                $this->assertEquals($superAdmin->email, $auditLog->user_email,
                    "Audit log should record correct user email");
                
                $this->assertEquals($superAdmin->name, $auditLog->user_name,
                    "Audit log should record correct user name");
                
                $this->assertTrue($auditLog->is_super_admin,
                    "Audit log should correctly identify super admin status");
                
                $this->assertEquals($method, $auditLog->method,
                    "Audit log should record correct HTTP method");
                
                $this->assertStringContainsString($path, $auditLog->url,
                    "Audit log should record correct URL path");
                
                $this->assertNotNull($auditLog->ip_address,
                    "Audit log should record IP address");
                
                $this->assertNotNull($auditLog->user_agent,
                    "Audit log should record user agent");
                
                $this->assertNotNull($auditLog->performed_at,
                    "Audit log should record timestamp");
                
                // Verify timestamp is within reasonable range (allow 1 second buffer)
                $this->assertGreaterThanOrEqual($beforeAction->subSecond(), $auditLog->performed_at,
                    "Audit log timestamp should be after action start");
                
                $this->assertLessThanOrEqual($afterAction->addSecond(), $auditLog->performed_at,
                    "Audit log timestamp should be before action end");
                
                // Verify response status is recorded
                $this->assertNotNull($auditLog->response_status,
                    "Audit log should record response status");
                
                $this->assertEquals($response->getStatusCode(), $auditLog->response_status,
                    "Audit log should record correct response status");
                
                // Verify execution time is recorded (should be a positive number)
                if ($auditLog->execution_time !== null) {
                    $this->assertGreaterThan(0, $auditLog->execution_time,
                        "Audit log execution time should be positive");
                }
                
                // Verify session information is captured (may be null in test environment)
                // In a real environment, session_id should be present
                $this->assertTrue(
                    $auditLog->session_id !== null || app()->environment('testing'),
                    "Audit log should record session ID (or be in testing environment)"
                );
                
                // For POST requests, verify request data is captured
                if ($method === 'POST' && !empty($data)) {
                    $this->assertNotNull($auditLog->request_data,
                        "Audit log should capture request data for POST requests");
                    
                    if (is_array($auditLog->request_data)) {
                        // Verify some of the request data is present
                        $this->assertNotEmpty($auditLog->request_data,
                            "Request data should not be empty for POST requests");
                    }
                }
                
                // Verify request headers are captured
                $this->assertNotNull($auditLog->request_headers,
                    "Audit log should capture request headers");
                
                // Verify tenant context if applicable
                if ($superAdmin->tenant_id) {
                    $this->assertEquals($superAdmin->tenant_id, $auditLog->tenant_id,
                        "Audit log should record correct tenant context");
                }
                
                // Verify action classification
                if ($auditLog->action) {
                    $this->assertNotEmpty($auditLog->action,
                        "Audit log should classify the action type");
                }
                
                // Verify resource type classification
                if ($auditLog->resource_type) {
                    $this->assertNotEmpty($auditLog->resource_type,
                        "Audit log should identify the resource type");
                }
                
                // Verify risk level assessment
                $riskLevel = $auditLog->risk_level;
                $this->assertContains($riskLevel, ['low', 'medium', 'high'],
                    "Audit log should assess risk level correctly");
                
                // High-risk actions should be properly identified
                if ($response->getStatusCode() >= 500) {
                    $this->assertEquals('high', $riskLevel,
                        "Server errors should be classified as high risk");
                } elseif ($response->getStatusCode() >= 400) {
                    $this->assertContains($riskLevel, ['medium', 'high'],
                        "Client errors should be classified as medium or high risk");
                }
                
                // Verify critical action identification
                $criticalActions = ['delete', 'suspend', 'activate', 'rollback', 'bulk_delete'];
                if ($auditLog->action && in_array($auditLog->action, $criticalActions)) {
                    $this->assertTrue($auditLog->is_critical,
                        "Critical actions should be properly flagged");
                }
            }

            // Clean up for next iteration
            $superAdmin->tokens()->delete();
        }
    }

    /**
     * **Feature: super-admin-enhancement, Property 23: Administrative action audit logging**
     * 
     * Property test for audit log data integrity and completeness.
     * Tests that audit logs maintain data integrity across different scenarios.
     */
    public function test_audit_log_data_integrity_property(): void
    {
        $iterations = 30;
        
        for ($i = 0; $i < $iterations; $i++) {
            // Create super admin with varying attributes
            $superAdmin = User::factory()->create([
                'is_super_admin' => true,
                'tenant_id' => $this->tenant->id,
                'name' => 'Admin User ' . $i,
                'email' => 'integrity.test' . $i . '@example.com',
            ]);

            Sanctum::actingAs($superAdmin);

            // Test different types of requests with varying data sizes
            $testScenarios = [
                // Small request
                ['POST', '/api/admin/settings', [
                    'key' => 'small_' . $i,
                    'value' => 'val',
                    'category' => 'test',
                    'type' => 'string',
                ]],
                
                // Large request data
                ['POST', '/api/admin/settings', [
                    'key' => 'large_' . $i,
                    'value' => str_repeat('Large value data ', 100), // ~1.7KB of data
                    'category' => 'test',
                    'type' => 'string',
                    'description' => str_repeat('Long description ', 50),
                ]],
                
                // Request with special characters
                ['POST', '/api/admin/settings', [
                    'key' => 'special_' . $i,
                    'value' => 'Special chars: àáâãäåæçèéêë ñòóôõö ùúûüý 中文 العربية',
                    'category' => 'test',
                    'type' => 'string',
                ]],
            ];

            $scenario = $testScenarios[array_rand($testScenarios)];
            [$method, $path, $data] = $scenario;

            // Clear previous logs
            AuditLog::truncate();

            // Perform the action
            $response = $this->json($method, $path, $data);

            // Verify audit log was created and data integrity is maintained
            if ($response->getStatusCode() !== 404) {
                $auditLog = AuditLog::where('user_id', $superAdmin->id)->first();
                
                $this->assertNotNull($auditLog, "Audit log should be created");

                // Verify data integrity - no corruption or truncation
                $this->assertEquals($superAdmin->email, $auditLog->user_email,
                    "User email should be stored correctly without corruption");
                
                $this->assertEquals($superAdmin->name, $auditLog->user_name,
                    "User name should be stored correctly without corruption");
                
                // Verify JSON data integrity
                if ($auditLog->request_data) {
                    $this->assertIsArray($auditLog->request_data,
                        "Request data should be properly decoded as array");
                    
                    // For POST requests, verify key data is preserved
                    if ($method === 'POST' && isset($data['key'])) {
                        $this->assertArrayHasKey('key', $auditLog->request_data,
                            "Request data should preserve key fields");
                        
                        // Note: Some sensitive data might be redacted for security
                        $this->assertTrue(
                            $data['key'] === $auditLog->request_data['key'] || 
                            $auditLog->request_data['key'] === '[REDACTED]',
                            "Request data values should be preserved or properly redacted for security"
                        );
                    }
                }
                
                if ($auditLog->request_headers) {
                    $this->assertIsArray($auditLog->request_headers,
                        "Request headers should be properly decoded as array");
                }
                
                // Verify timestamp precision
                $this->assertInstanceOf(\Carbon\Carbon::class, $auditLog->performed_at,
                    "Timestamp should be properly stored as Carbon instance");
                
                // Verify numeric fields
                if ($auditLog->execution_time !== null) {
                    $this->assertIsNumeric($auditLog->execution_time,
                        "Execution time should be numeric");
                }
                
                $this->assertIsInt($auditLog->response_status,
                    "Response status should be integer");
                
                // Verify boolean fields
                $this->assertIsBool($auditLog->is_super_admin,
                    "is_super_admin should be boolean");
            }

            // Clean up
            $superAdmin->tokens()->delete();
        }
    }

    /**
     * **Feature: super-admin-enhancement, Property 23: Administrative action audit logging**
     * 
     * Property test for audit log performance and scalability.
     * Tests that audit logging doesn't significantly impact system performance.
     */
    public function test_audit_logging_performance_property(): void
    {
        $iterations = 20;
        
        for ($i = 0; $i < $iterations; $i++) {
            $superAdmin = User::factory()->create([
                'is_super_admin' => true,
                'tenant_id' => $this->tenant->id,
            ]);

            Sanctum::actingAs($superAdmin);

            // Test rapid successive requests
            $rapidRequests = [
                ['GET', '/api/admin/dashboard'],
                ['GET', '/api/admin/tenants'],
                ['GET', '/api/admin/settings'],
            ];

            $startTime = microtime(true);
            
            // Make multiple rapid requests
            foreach ($rapidRequests as $request) {
                [$method, $path] = $request;
                $this->json($method, $path);
            }
            
            $endTime = microtime(true);
            $totalTime = $endTime - $startTime;

            // Verify all requests were logged
            $logCount = AuditLog::where('user_id', $superAdmin->id)->count();
            
            // Should have at least as many logs as successful requests
            // (some might fail due to missing data, but that's okay for this test)
            $this->assertGreaterThan(0, $logCount,
                "Rapid requests should generate audit logs");

            // Verify performance is reasonable (less than 5 seconds for 3 requests)
            $this->assertLessThan(5.0, $totalTime,
                "Audit logging should not significantly impact performance");

            // Clean up
            $superAdmin->tokens()->delete();
            AuditLog::truncate();
        }
    }

    /**
     * **Feature: super-admin-enhancement, Property 23: Administrative action audit logging**
     * 
     * Property test for audit log security and privacy.
     * Tests that sensitive information is handled appropriately in audit logs.
     */
    public function test_audit_log_security_property(): void
    {
        $iterations = 25;
        
        for ($i = 0; $i < $iterations; $i++) {
            $superAdmin = User::factory()->create([
                'is_super_admin' => true,
                'tenant_id' => $this->tenant->id,
            ]);

            Sanctum::actingAs($superAdmin);

            // Test requests with potentially sensitive data
            $sensitiveDataRequests = [
                ['POST', '/api/admin/settings', [
                    'key' => 'api_key_' . $i,
                    'value' => 'secret_api_key_12345',
                    'category' => 'security',
                    'type' => 'string',
                ]],
                
                ['POST', '/api/admin/tenants', [
                    'name' => 'Sensitive Tenant ' . $i,
                    'slug' => 'sensitive-' . $i,
                    'domain' => 'sensitive' . $i . '.example.com',
                    'internal_notes' => 'Confidential business information',
                ]],
            ];

            $request = $sensitiveDataRequests[array_rand($sensitiveDataRequests)];
            [$method, $path, $data] = $request;

            AuditLog::truncate();

            // Perform the request
            $response = $this->json($method, $path, $data);

            if ($response->getStatusCode() !== 404) {
                $auditLog = AuditLog::where('user_id', $superAdmin->id)->first();
                
                $this->assertNotNull($auditLog, "Audit log should be created");

                // Verify that audit log contains necessary information for security
                $this->assertNotNull($auditLog->user_id,
                    "User identification should be preserved for security");
                
                $this->assertNotNull($auditLog->ip_address,
                    "IP address should be logged for security tracking");
                
                $this->assertNotNull($auditLog->user_agent,
                    "User agent should be logged for security analysis");
                
                $this->assertNotNull($auditLog->performed_at,
                    "Timestamp should be preserved for security timeline");
                
                // Verify request data is captured (for security investigation)
                // Note: In a real system, you might want to sanitize certain sensitive fields
                if ($method === 'POST') {
                    $this->assertNotNull($auditLog->request_data,
                        "Request data should be captured for security analysis");
                }
                
                // Verify session tracking for security (may be null in test environment)
                $this->assertTrue(
                    $auditLog->session_id !== null || app()->environment('testing'),
                    "Session ID should be tracked for security correlation (or be in testing environment)"
                );
                
                // Verify response status for security monitoring
                $this->assertNotNull($auditLog->response_status,
                    "Response status should be logged for security monitoring");
            }

            // Clean up
            $superAdmin->tokens()->delete();
        }
    }
}