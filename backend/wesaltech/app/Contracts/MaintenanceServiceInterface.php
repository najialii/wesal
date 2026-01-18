<?php

namespace App\Contracts;

/**
 * Base interface for maintenance services
 * Provides common contract for all maintenance-related services
 */
interface MaintenanceServiceInterface
{
    /**
     * Get service name for logging and debugging
     */
    public function getServiceName(): string;

    /**
     * Validate tenant access for the given resource
     */
    public function validateTenantAccess(int $tenantId, int $resourceId): bool;
}