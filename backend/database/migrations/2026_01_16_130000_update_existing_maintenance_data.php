<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update existing contracts with null status to 'active'
        DB::table('maintenance_contracts')
            ->whereNull('status')
            ->update(['status' => 'active']);

        // Update existing visits with null status to appropriate status
        DB::table('maintenance_visits')
            ->whereNull('status')
            ->where('scheduled_date', '>', Carbon::now())
            ->update(['status' => 'scheduled']);

        DB::table('maintenance_visits')
            ->whereNull('status')
            ->where('scheduled_date', '<=', Carbon::now())
            ->whereNotNull('actual_end_time')
            ->update(['status' => 'completed']);

        DB::table('maintenance_visits')
            ->whereNull('status')
            ->where('scheduled_date', '<=', Carbon::now())
            ->whereNull('actual_end_time')
            ->update(['status' => 'overdue']);

        // Ensure all contracts have proper tenant_id and branch_id
        $contractsWithoutTenant = DB::table('maintenance_contracts')
            ->whereNull('tenant_id')
            ->get();

        foreach ($contractsWithoutTenant as $contract) {
            // Try to get tenant_id from associated customer
            $customer = DB::table('customers')
                ->where('id', $contract->customer_id)
                ->first();

            if ($customer && $customer->tenant_id) {
                DB::table('maintenance_contracts')
                    ->where('id', $contract->id)
                    ->update(['tenant_id' => $customer->tenant_id]);
            }
        }

        // Ensure all visits have proper tenant_id and branch_id
        $visitsWithoutTenant = DB::table('maintenance_visits')
            ->whereNull('tenant_id')
            ->get();

        foreach ($visitsWithoutTenant as $visit) {
            // Get tenant_id from associated contract
            $contract = DB::table('maintenance_contracts')
                ->where('id', $visit->maintenance_contract_id)
                ->first();

            if ($contract && $contract->tenant_id) {
                $updateData = ['tenant_id' => $contract->tenant_id];
                
                // Also set branch_id if contract has one
                if ($contract->branch_id) {
                    $updateData['branch_id'] = $contract->branch_id;
                }

                DB::table('maintenance_visits')
                    ->where('id', $visit->id)
                    ->update($updateData);
            }
        }

        // Update contracts without branch_id to use default branch
        $contractsWithoutBranch = DB::table('maintenance_contracts')
            ->whereNull('branch_id')
            ->whereNotNull('tenant_id')
            ->get();

        foreach ($contractsWithoutBranch as $contract) {
            // Get default branch for tenant
            $defaultBranch = DB::table('branches')
                ->where('tenant_id', $contract->tenant_id)
                ->where('is_default', true)
                ->first();

            if (!$defaultBranch) {
                // If no default branch, get any branch for the tenant
                $defaultBranch = DB::table('branches')
                    ->where('tenant_id', $contract->tenant_id)
                    ->first();
            }

            if ($defaultBranch) {
                DB::table('maintenance_contracts')
                    ->where('id', $contract->id)
                    ->update(['branch_id' => $defaultBranch->id]);
            }
        }

        // Skip recalculating total_visits as this column doesn't exist
        // This section has been commented out as total_visits column is not in the table schema
        /*
        // Recalculate total_visits for contracts that don't have it set
        $contractsWithoutTotalVisits = DB::table('maintenance_contracts')
            ->where(function($query) {
                $query->whereNull('total_visits')
                      ->orWhere('total_visits', 0);
            })
            ->whereNotNull('start_date')
            ->whereNotNull('end_date')
            ->get();

        foreach ($contractsWithoutTotalVisits as $contract) {
            $totalVisits = $this->calculateTotalVisits(
                $contract->frequency,
                Carbon::parse($contract->start_date),
                Carbon::parse($contract->end_date)
            );

            DB::table('maintenance_contracts')
                ->where('id', $contract->id)
                ->update(['total_visits' => $totalVisits]);
        }
        */
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // This migration updates existing data, so we don't reverse it
        // as it could cause data loss
    }

    /**
     * Calculate total visits based on frequency and date range
     */
    private function calculateTotalVisits(string $frequency, Carbon $startDate, Carbon $endDate): int
    {
        $totalDays = $startDate->diffInDays($endDate);

        switch ($frequency) {
            case 'daily':
                return $totalDays;
            case 'weekly':
                return (int) ceil($totalDays / 7);
            case 'bi_weekly':
                return (int) ceil($totalDays / 14);
            case 'monthly':
                return $startDate->diffInMonths($endDate);
            case 'quarterly':
                return (int) ceil($startDate->diffInMonths($endDate) / 3);
            case 'semi_annual':
                return (int) ceil($startDate->diffInMonths($endDate) / 6);
            case 'annual':
                return $startDate->diffInYears($endDate);
            default:
                return 1;
        }
    }
};