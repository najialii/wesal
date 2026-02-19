<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class MaintenanceLoggerService
{
    private string $correlationId;

    public function __construct()
    {
        $this->correlationId = $this->generateCorrelationId();
    }

    /**
     * Generate a unique correlation ID for tracking requests
     */
    private function generateCorrelationId(): string
    {
        return Str::uuid()->toString();
    }

    /**
     * Get the current correlation ID
     */
    public function getCorrelationId(): string
    {
        return $this->correlationId;
    }

    /**
     * Set a custom correlation ID
     */
    public function setCorrelationId(string $correlationId): void
    {
        $this->correlationId = $correlationId;
    }

    /**
     * Log contract creation
     */
    public function logContractCreated(int $contractId, int $tenantId, array $metadata = []): void
    {
        $this->logStructured('info', 'contract.created', [
            'contract_id' => $contractId,
            'tenant_id' => $tenantId,
            'metadata' => $metadata,
        ]);
    }

    /**
     * Log contract update
     */
    public function logContractUpdated(int $contractId, array $changes, array $metadata = []): void
    {
        $this->logStructured('info', 'contract.updated', [
            'contract_id' => $contractId,
            'changes' => $changes,
            'metadata' => $metadata,
        ]);
    }

    /**
     * Log contract expiration
     */
    public function logContractExpired(int $contractId, int $cancelledVisits, array $metadata = []): void
    {
        $this->logStructured('warning', 'contract.expired', [
            'contract_id' => $contractId,
            'cancelled_visits' => $cancelledVisits,
            'metadata' => $metadata,
        ]);
    }

    /**
     * Log visit creation
     */
    public function logVisitCreated(int $visitId, int $contractId, string $scheduledDate, array $metadata = []): void
    {
        $this->logStructured('info', 'visit.created', [
            'visit_id' => $visitId,
            'contract_id' => $contractId,
            'scheduled_date' => $scheduledDate,
            'metadata' => $metadata,
        ]);
    }

    /**
     * Log visit status change
     */
    public function logVisitStatusChanged(int $visitId, string $fromStatus, string $toStatus, array $metadata = []): void
    {
        $this->logStructured('info', 'visit.status_changed', [
            'visit_id' => $visitId,
            'from_status' => $fromStatus,
            'to_status' => $toStatus,
            'metadata' => $metadata,
        ]);
    }

    /**
     * Log visit completion
     */
    public function logVisitCompleted(int $visitId, int $technicianId, float $totalCost, array $metadata = []): void
    {
        $this->logStructured('info', 'visit.completed', [
            'visit_id' => $visitId,
            'technician_id' => $technicianId,
            'total_cost' => $totalCost,
            'metadata' => $metadata,
        ]);
    }

    /**
     * Log performance metrics
     */
    public function logPerformanceMetric(string $operation, float $duration, array $metadata = []): void
    {
        $this->logStructured('info', 'performance.metric', [
            'operation' => $operation,
            'duration_ms' => $duration,
            'metadata' => $metadata,
        ]);
    }

    /**
     * Log business metrics
     */
    public function logBusinessMetric(string $metric, $value, array $metadata = []): void
    {
        $this->logStructured('info', 'business.metric', [
            'metric' => $metric,
            'value' => $value,
            'metadata' => $metadata,
        ]);
    }

    /**
     * Log error with context
     */
    public function logError(string $operation, \Throwable $error, array $context = []): void
    {
        $this->logStructured('error', 'maintenance.error', [
            'operation' => $operation,
            'error_message' => $error->getMessage(),
            'error_code' => $error->getCode(),
            'error_file' => $error->getFile(),
            'error_line' => $error->getLine(),
            'context' => $context,
        ]);
    }

    /**
     * Log security event
     */
    public function logSecurityEvent(string $event, int $userId, array $metadata = []): void
    {
        $this->logStructured('warning', 'security.event', [
            'event' => $event,
            'user_id' => $userId,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'metadata' => $metadata,
        ]);
    }

    /**
     * Log API request
     */
    public function logApiRequest(string $method, string $endpoint, int $statusCode, float $duration, array $metadata = []): void
    {
        $this->logStructured('info', 'api.request', [
            'method' => $method,
            'endpoint' => $endpoint,
            'status_code' => $statusCode,
            'duration_ms' => $duration,
            'metadata' => $metadata,
        ]);
    }

    /**
     * Log structured message with correlation ID
     */
    private function logStructured(string $level, string $event, array $data): void
    {
        $logData = [
            'correlation_id' => $this->correlationId,
            'event' => $event,
            'timestamp' => now()->toISOString(),
            'service' => 'maintenance',
            'data' => $data,
        ];

        Log::log($level, $event, $logData);
    }

    /**
     * Start performance tracking
     */
    public function startPerformanceTracking(string $operation): array
    {
        return [
            'operation' => $operation,
            'start_time' => microtime(true),
            'start_memory' => memory_get_usage(true),
        ];
    }

    /**
     * End performance tracking and log metrics
     */
    public function endPerformanceTracking(array $tracking, array $metadata = []): void
    {
        $endTime = microtime(true);
        $endMemory = memory_get_usage(true);
        
        $duration = ($endTime - $tracking['start_time']) * 1000; // Convert to milliseconds
        $memoryUsed = $endMemory - $tracking['start_memory'];

        $this->logStructured('info', 'performance.tracking', [
            'operation' => $tracking['operation'],
            'duration_ms' => round($duration, 2),
            'memory_used_bytes' => $memoryUsed,
            'memory_used_mb' => round($memoryUsed / 1024 / 1024, 2),
            'metadata' => $metadata,
        ]);
    }

    /**
     * Log database query performance
     */
    public function logQueryPerformance(string $query, float $duration, array $bindings = []): void
    {
        if ($duration > 100) { // Log slow queries (>100ms)
            $this->logStructured('warning', 'database.slow_query', [
                'query' => $query,
                'duration_ms' => $duration,
                'bindings' => $bindings,
            ]);
        }
    }

    /**
     * Log cache hit/miss
     */
    public function logCacheEvent(string $key, string $event, array $metadata = []): void
    {
        $this->logStructured('debug', 'cache.' . $event, [
            'cache_key' => $key,
            'metadata' => $metadata,
        ]);
    }
}