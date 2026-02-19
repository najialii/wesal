<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Auth;

class MaintenanceSecurityService
{
    /**
     * Track failed authentication attempts
     */
    public function trackFailedAttempt(string $identifier): void
    {
        $key = "failed_attempts:{$identifier}";
        $attempts = Cache::get($key, 0) + 1;
        
        Cache::put($key, $attempts, now()->addMinutes(15));
        
        if ($attempts >= 5) {
            $this->logSecurityAlert('multiple_failed_attempts', [
                'identifier' => $identifier,
                'attempts' => $attempts
            ]);
        }
    }

    /**
     * Check if identifier is blocked due to too many failed attempts
     */
    public function isBlocked(string $identifier): bool
    {
        $key = "failed_attempts:{$identifier}";
        return Cache::get($key, 0) >= 10;
    }

    /**
     * Validate API request integrity
     */
    public function validateRequestIntegrity(array $data): bool
    {
        // Check for SQL injection patterns
        $sqlPatterns = [
            '/(\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b)/i',
            '/(\bOR\b\s+\d+\s*=\s*\d+|\bAND\b\s+\d+\s*=\s*\d+)/i',
            '/(\'|\")(\s*;\s*|\s*--|\s*\/\*)/i'
        ];

        foreach ($data as $value) {
            if (is_string($value)) {
                foreach ($sqlPatterns as $pattern) {
                    if (preg_match($pattern, $value)) {
                        $this->logSecurityAlert('sql_injection_attempt', [
                            'value' => $value,
                            'pattern' => $pattern
                        ]);
                        return false;
                    }
                }
            }
        }

        // Check for XSS patterns
        $xssPatterns = [
            '/<script[^>]*>.*?<\/script>/is',
            '/javascript:/i',
            '/on\w+\s*=/i'
        ];

        foreach ($data as $value) {
            if (is_string($value)) {
                foreach ($xssPatterns as $pattern) {
                    if (preg_match($pattern, $value)) {
                        $this->logSecurityAlert('xss_attempt', [
                            'value' => $value,
                            'pattern' => $pattern
                        ]);
                        return false;
                    }
                }
            }
        }

        return true;
    }

    /**
     * Validate file upload security
     */
    public function validateFileUpload($file): bool
    {
        if (!$file) {
            return false;
        }

        // Check file size (max 10MB)
        if ($file->getSize() > 10 * 1024 * 1024) {
            $this->logSecurityAlert('file_size_exceeded', [
                'size' => $file->getSize(),
                'filename' => $file->getClientOriginalName()
            ]);
            return false;
        }

        // Check allowed file types
        $allowedTypes = ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'];
        $extension = strtolower($file->getClientOriginalExtension());
        
        if (!in_array($extension, $allowedTypes)) {
            $this->logSecurityAlert('invalid_file_type', [
                'extension' => $extension,
                'filename' => $file->getClientOriginalName()
            ]);
            return false;
        }

        // Check MIME type
        $allowedMimes = [
            'image/jpeg', 'image/png', 'application/pdf',
            'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        
        if (!in_array($file->getMimeType(), $allowedMimes)) {
            $this->logSecurityAlert('invalid_mime_type', [
                'mime_type' => $file->getMimeType(),
                'filename' => $file->getClientOriginalName()
            ]);
            return false;
        }

        return true;
    }

    /**
     * Audit maintenance operation
     */
    public function auditOperation(string $operation, array $data = []): void
    {
        $user = Auth::user();
        
        Log::info('Maintenance Operation Audit', [
            'operation' => $operation,
            'user_id' => $user?->id,
            'user_role' => $user?->role,
            'tenant_id' => $user?->tenant_id,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'timestamp' => now()->toISOString(),
            'data' => $data
        ]);
    }

    /**
     * Check for suspicious activity patterns
     */
    public function detectSuspiciousActivity(): array
    {
        $user = Auth::user();
        $alerts = [];

        if (!$user) {
            return $alerts;
        }

        // Check for rapid API calls
        $apiCallKey = "api_calls:user:{$user->id}";
        $apiCalls = Cache::get($apiCallKey, 0);
        
        if ($apiCalls > 100) { // More than 100 calls in the last minute
            $alerts[] = [
                'type' => 'rapid_api_calls',
                'message' => 'User making unusually high number of API calls',
                'user_id' => $user->id
            ];
        }

        // Check for access to multiple tenants (potential account compromise)
        $tenantAccessKey = "tenant_access:user:{$user->id}";
        $accessedTenants = Cache::get($tenantAccessKey, []);
        
        if (count($accessedTenants) > 1) {
            $alerts[] = [
                'type' => 'multi_tenant_access',
                'message' => 'User accessing multiple tenants',
                'user_id' => $user->id,
                'tenants' => $accessedTenants
            ];
        }

        return $alerts;
    }

    /**
     * Log security alert
     */
    private function logSecurityAlert(string $type, array $data = []): void
    {
        $user = Auth::user();
        
        Log::warning('Maintenance Security Alert', [
            'alert_type' => $type,
            'user_id' => $user?->id,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'timestamp' => now()->toISOString(),
            'data' => $data
        ]);

        // In production, you might want to send this to a security monitoring service
        // or trigger automated responses
    }

    /**
     * Generate security report
     */
    public function generateSecurityReport(): array
    {
        // This would typically query a security events table
        // For now, we'll return a basic structure
        return [
            'period' => [
                'start' => now()->subDays(7)->toDateString(),
                'end' => now()->toDateString()
            ],
            'summary' => [
                'total_events' => 0,
                'critical_events' => 0,
                'blocked_attempts' => 0,
                'suspicious_activities' => 0
            ],
            'top_threats' => [],
            'recommendations' => [
                'Enable two-factor authentication',
                'Regular password updates',
                'Monitor API usage patterns',
                'Review user permissions quarterly'
            ]
        ];
    }
}