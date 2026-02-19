<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use App\Models\AuditLog;
use Carbon\Carbon;

class AuditLogMiddleware
{
    /**
     * Handle an incoming request with comprehensive audit logging.
     */
    public function handle(Request $request, Closure $next)
    {
        $startTime = microtime(true);
        $response = $next($request);
        $endTime = microtime(true);

        // Log admin and business routes
        $path = $request->path();
        
        // Exclude audit log viewing from being logged (prevent infinite loop)
        if (str_contains($path, 'audit-logs') || str_contains($path, 'audit_logs')) {
            return $response;
        }

        // Exclude session status and other read-only monitoring endpoints
        $excludedPaths = [
            'session-status',
            'session_status',
            'me',
            'notifications/unread-count',
        ];
        
        foreach ($excludedPaths as $excluded) {
            if (str_contains($path, $excluded)) {
                return $response;
            }
        }

        if (str_starts_with($path, 'api/admin/') || str_starts_with($path, 'api/business/') || str_starts_with($path, 'api/pos/') || str_starts_with($path, 'api/maintenance/')) {
            $this->logAction($request, $response, $endTime - $startTime);
        }

        return $response;
    }

    /**
     * Log action with comprehensive details.
     */
    private function logAction(Request $request, $response, float $executionTime): void
    {
        try {
            $user = Auth::user();
            $responseData = $this->getResponseData($response);
            
            $auditData = [
                'user_id' => $user?->id,
                'user_email' => $user?->email,
                'action' => $this->getActionFromRequest($request),
                'resource_type' => $this->getResourceType($request),
                'resource_id' => $this->getResourceId($request),
                'method' => $request->method(),
                'url' => $request->fullUrl(),
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'request_data' => $this->sanitizeRequestData($request),
                'response_status' => $response->getStatusCode(),
                'response_data' => $responseData,
                'execution_time' => round($executionTime * 1000, 2), // Convert to milliseconds
                'performed_at' => now(),
            ];

            // Add additional context for admin actions
            if ($user) {
                $auditData['user_name'] = $user->name;
                $auditData['is_super_admin'] = $user->isSuperAdmin();
                $auditData['tenant_id'] = $user->tenant_id;
            }

            // Add request headers for security analysis
            $auditData['request_headers'] = $this->getSecurityHeaders($request);

            // Add session information
            if ($request->hasSession()) {
                $auditData['session_id'] = $request->session()->getId();
                $auditData['session_data'] = $this->getSessionData($request);
            }

            AuditLog::create($auditData);

            // Log critical actions to application log as well
            if ($this->isCriticalAction($request, $response)) {
                Log::warning('Critical admin action performed', $auditData);
            }

        } catch (\Exception $e) {
            // Log the error but don't break the request
            Log::error('Failed to create audit log', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_url' => $request->fullUrl(),
                'user_id' => $user?->id ?? null,
            ]);
        }
    }

    /**
     * Extract action from request with enhanced detection.
     */
    private function getActionFromRequest(Request $request): string
    {
        $method = $request->method();
        $path = $request->path();

        // Extract specific actions from URL patterns
        if (preg_match('/\/(\w+)\/(\d+)\/(\w+)$/', $path, $matches)) {
            return $matches[3]; // e.g., 'suspend', 'activate', 'assign-plan'
        }

        // Check for bulk operations
        if (str_contains($path, 'bulk')) {
            return 'bulk_' . strtolower($method);
        }

        // Check for export/import operations
        if (str_contains($path, 'export')) {
            return 'export';
        }
        if (str_contains($path, 'import')) {
            return 'import';
        }

        // Check for rollback operations
        if (str_contains($path, 'rollback')) {
            return 'rollback';
        }

        // Check for specific business actions
        if (str_contains($path, '/sales')) {
            return match ($method) {
                'POST' => 'create_sale',
                'GET' => 'view_sales',
                default => strtolower($method) . '_sale',
            };
        }

        if (str_contains($path, '/products')) {
            return match ($method) {
                'POST' => 'create_product',
                'PUT', 'PATCH' => 'update_product',
                'DELETE' => 'delete_product',
                'GET' => 'view_products',
                default => strtolower($method) . '_product',
            };
        }

        if (str_contains($path, '/categories')) {
            return match ($method) {
                'POST' => 'create_category',
                'PUT', 'PATCH' => 'update_category',
                'DELETE' => 'delete_category',
                'GET' => 'view_categories',
                default => strtolower($method) . '_category',
            };
        }

        if (str_contains($path, '/customers')) {
            return match ($method) {
                'POST' => 'create_customer',
                'PUT', 'PATCH' => 'update_customer',
                'DELETE' => 'delete_customer',
                'GET' => 'view_customers',
                default => strtolower($method) . '_customer',
            };
        }

        if (str_contains($path, '/staff')) {
            return match ($method) {
                'POST' => 'create_staff',
                'PUT', 'PATCH' => 'update_staff',
                'DELETE' => 'delete_staff',
                'GET' => 'view_staff',
                default => strtolower($method) . '_staff',
            };
        }

        if (str_contains($path, '/branches')) {
            return match ($method) {
                'POST' => 'create_branch',
                'PUT', 'PATCH' => 'update_branch',
                'DELETE' => 'delete_branch',
                'GET' => 'view_branches',
                default => strtolower($method) . '_branch',
            };
        }

        if (str_contains($path, '/maintenance')) {
            if (str_contains($path, '/contracts')) {
                return match ($method) {
                    'POST' => 'create_maintenance_contract',
                    'PUT', 'PATCH' => 'update_maintenance_contract',
                    'DELETE' => 'delete_maintenance_contract',
                    'GET' => 'view_maintenance_contracts',
                    default => strtolower($method) . '_maintenance_contract',
                };
            }
            if (str_contains($path, '/visits')) {
                return match ($method) {
                    'POST' => 'create_maintenance_visit',
                    'PUT', 'PATCH' => 'update_maintenance_visit',
                    'DELETE' => 'delete_maintenance_visit',
                    'GET' => 'view_maintenance_visits',
                    default => strtolower($method) . '_maintenance_visit',
                };
            }
        }

        // Default action mapping
        return match ($method) {
            'POST' => str_contains($path, 'reorder') ? 'reorder' : 'create',
            'PUT', 'PATCH' => 'update',
            'DELETE' => 'delete',
            'GET' => str_contains($path, 'analytics') ? 'view_analytics' : 'view',
            default => 'unknown',
        };
    }

    /**
     * Get resource type from request path.
     */
    private function getResourceType(Request $request): ?string
    {
        $path = $request->path();
        
        // Extract resource from admin routes
        if (preg_match('/api\/admin\/(\w+)/', $path, $matches)) {
            return $matches[1];
        }

        // Extract resource from business routes
        if (preg_match('/api\/business\/(\w+)/', $path, $matches)) {
            return $matches[1];
        }

        // Extract resource from tenant routes
        if (preg_match('/api\/tenant\/(\w+)/', $path, $matches)) {
            return $matches[1];
        }

        // Extract resource from POS routes
        if (preg_match('/api\/pos\/(\w+)/', $path, $matches)) {
            return $matches[1];
        }

        // Extract resource from maintenance routes
        if (preg_match('/api\/maintenance\/(\w+)/', $path, $matches)) {
            return $matches[1];
        }

        return null;
    }

    /**
     * Get resource ID from request path.
     */
    private function getResourceId(Request $request): ?string
    {
        $path = $request->path();
        
        // Extract ID from URL patterns like /api/admin/tenants/123
        if (preg_match('/\/(\d+)(?:\/|$)/', $path, $matches)) {
            return $matches[1];
        }

        // For settings, use the key as resource ID
        if (str_contains($path, 'settings/') && preg_match('/settings\/([^\/]+)/', $path, $matches)) {
            return $matches[1];
        }

        return null;
    }

    /**
     * Sanitize request data by removing sensitive information.
     */
    private function sanitizeRequestData(Request $request): array
    {
        $data = $request->all();
        
        // Remove sensitive fields
        $sensitiveFields = [
            'password', 'password_confirmation', 'token', 'secret', 'key',
            'api_key', 'private_key', 'access_token', 'refresh_token'
        ];
        
        foreach ($sensitiveFields as $field) {
            if (isset($data[$field])) {
                $data[$field] = '[REDACTED]';
            }
        }

        // Recursively sanitize nested arrays
        $data = $this->sanitizeNestedArray($data, $sensitiveFields);

        // Limit data size to prevent huge logs
        $jsonData = json_encode($data);
        if (strlen($jsonData) > 10000) {
            return ['message' => 'Request data too large to log', 'size' => strlen($jsonData)];
        }

        return $data;
    }

    /**
     * Recursively sanitize nested arrays.
     */
    private function sanitizeNestedArray(array $data, array $sensitiveFields): array
    {
        foreach ($data as $key => $value) {
            if (is_array($value)) {
                $data[$key] = $this->sanitizeNestedArray($value, $sensitiveFields);
            } elseif (in_array($key, $sensitiveFields)) {
                $data[$key] = '[REDACTED]';
            }
        }

        return $data;
    }

    /**
     * Get response data for logging.
     */
    private function getResponseData($response): ?array
    {
        $statusCode = $response->getStatusCode();
        
        // Always log error responses
        if ($statusCode >= 400) {
            $content = $response->getContent();
            
            if (strlen($content) > 2000) {
                return ['message' => 'Error response too large to log', 'status' => $statusCode];
            }

            $decoded = json_decode($content, true);
            return is_array($decoded) ? $decoded : ['raw_content' => $content];
        }

        // For successful responses, only log metadata for certain actions
        if ($this->shouldLogSuccessResponse($response)) {
            $content = $response->getContent();
            $decoded = json_decode($content, true);
            
            if (is_array($decoded)) {
                // Log only metadata, not full content
                return [
                    'success' => true,
                    'data_type' => isset($decoded['data']) ? gettype($decoded['data']) : 'unknown',
                    'record_count' => is_array($decoded['data'] ?? null) ? count($decoded['data']) : null,
                ];
            }
        }

        return null;
    }

    /**
     * Get security-relevant headers.
     */
    private function getSecurityHeaders(Request $request): array
    {
        $securityHeaders = [
            'X-Forwarded-For',
            'X-Real-IP',
            'X-Forwarded-Proto',
            'Authorization',
            'Referer',
            'Origin',
        ];

        $headers = [];
        foreach ($securityHeaders as $header) {
            if ($request->hasHeader($header)) {
                $value = $request->header($header);
                // Sanitize Authorization header
                if ($header === 'Authorization' && $value) {
                    $headers[$header] = 'Bearer [TOKEN_PRESENT]';
                } else {
                    $headers[$header] = $value;
                }
            }
        }

        return $headers;
    }

    /**
     * Get relevant session data for audit.
     */
    private function getSessionData(Request $request): array
    {
        if (!$request->hasSession()) {
            return [];
        }

        return [
            'last_activity' => $request->session()->get('last_activity'),
            'login_time' => $request->session()->get('login_time'),
            'csrf_token' => $request->session()->token(),
        ];
    }

    /**
     * Determine if this is a critical action that needs extra logging.
     */
    private function isCriticalAction(Request $request, $response): bool
    {
        $criticalActions = [
            'delete', 'suspend', 'activate', 'rollback', 'bulk_delete',
            'assign-plan', 'unassign-plan', 'import'
        ];

        $action = $this->getActionFromRequest($request);
        $statusCode = $response->getStatusCode();

        return in_array($action, $criticalActions) || $statusCode >= 400;
    }

    /**
     * Determine if successful response should be logged.
     */
    private function shouldLogSuccessResponse($response): bool
    {
        // Only log successful responses for write operations
        return $response->getStatusCode() < 300;
    }
}