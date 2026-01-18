<?php

namespace App\Exceptions;

use Exception;

class MaintenanceException extends Exception
{
    /**
     * Contract not found exception
     */
    public static function contractNotFound(int $id): self
    {
        return new self("Maintenance contract with ID {$id} not found", 404);
    }

    /**
     * Visit not found exception
     */
    public static function visitNotFound(int $id): self
    {
        return new self("Maintenance visit with ID {$id} not found", 404);
    }

    /**
     * Visit cannot be started exception
     */
    public static function visitCannotBeStarted(string $reason): self
    {
        return new self("Visit cannot be started: {$reason}", 400);
    }

    /**
     * Visit cannot be completed exception
     */
    public static function visitCannotBeCompleted(string $reason): self
    {
        return new self("Visit cannot be completed: {$reason}", 400);
    }

    /**
     * Insufficient parts exception
     */
    public static function insufficientParts(string $part, int $required, int $available): self
    {
        return new self("Insufficient parts: {$part}. Required: {$required}, Available: {$available}", 400);
    }

    /**
     * Invalid status transition exception
     */
    public static function invalidStatusTransition(string $from, string $to): self
    {
        return new self("Invalid status transition from '{$from}' to '{$to}'", 400);
    }

    /**
     * Contract already expired exception
     */
    public static function contractExpired(int $contractId): self
    {
        return new self("Contract {$contractId} has already expired", 400);
    }

    /**
     * Technician not assigned exception
     */
    public static function technicianNotAssigned(int $visitId): self
    {
        return new self("No technician assigned to visit {$visitId}", 400);
    }

    /**
     * Branch access denied exception
     */
    public static function branchAccessDenied(int $branchId): self
    {
        return new self("Access denied to branch {$branchId}", 403);
    }

    /**
     * Duplicate visit generation exception
     */
    public static function duplicateVisitGeneration(int $contractId, string $date): self
    {
        return new self("Visit already exists for contract {$contractId} on {$date}", 409);
    }

    /**
     * Invalid contract frequency exception
     */
    public static function invalidContractFrequency(string $frequency): self
    {
        return new self("Invalid contract frequency: {$frequency}", 400);
    }

    /**
     * Contract renewal failed exception
     */
    public static function contractRenewalFailed(int $contractId, string $reason): self
    {
        return new self("Contract renewal failed for contract {$contractId}: {$reason}", 400);
    }

    /**
     * Parts inventory update failed exception
     */
    public static function partsInventoryUpdateFailed(string $reason): self
    {
        return new self("Parts inventory update failed: {$reason}", 500);
    }

    /**
     * Visit scheduling conflict exception
     */
    public static function visitSchedulingConflict(int $technicianId, string $date, string $time): self
    {
        return new self("Scheduling conflict: Technician {$technicianId} already has a visit on {$date} at {$time}", 409);
    }

    /**
     * Contract validation failed exception
     */
    public static function contractValidationFailed(array $errors): self
    {
        $errorMessages = implode(', ', $errors);
        return new self("Contract validation failed: {$errorMessages}", 422);
    }

    /**
     * Visit validation failed exception
     */
    public static function visitValidationFailed(array $errors): self
    {
        $errorMessages = implode(', ', $errors);
        return new self("Visit validation failed: {$errorMessages}", 422);
    }
}