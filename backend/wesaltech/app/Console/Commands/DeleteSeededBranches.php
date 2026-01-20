<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Branch;
use App\Models\StockTransfer;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class DeleteSeededBranches extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'branches:delete-seeded {--force : Force deletion without confirmation}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Delete all branches created by the BranchSeeder across all tenants';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $seededBranchNames = [
            'Downtown Branch',
            'North Branch', 
            'South Branch'
        ];

        // Find all seeded branches
        $seededBranches = Branch::whereIn('name', $seededBranchNames)->get();

        if ($seededBranches->isEmpty()) {
            $this->info('No seeded branches found to delete.');
            return 0;
        }

        $this->info("Found {$seededBranches->count()} seeded branches to delete:");
        foreach ($seededBranches as $branch) {
            $this->line("- {$branch->name} (Tenant: {$branch->tenant->name})");
        }

        if (!$this->option('force') && !$this->confirm('Are you sure you want to delete these branches?')) {
            $this->info('Operation cancelled.');
            return 0;
        }

        DB::beginTransaction();

        try {
            foreach ($seededBranches as $branch) {
                $this->info("Deleting branch: {$branch->name}");

                // 1. Update sales to remove branch assignment
                $salesCount = Sale::where('branch_id', $branch->id)->count();
                if ($salesCount > 0) {
                    Sale::where('branch_id', $branch->id)->update(['branch_id' => null]);
                    $this->line("  - Updated {$salesCount} sales records");
                }

                // 2. Delete stock transfers
                $transfersCount = StockTransfer::where(function($query) use ($branch) {
                    $query->where('from_branch_id', $branch->id)
                          ->orWhere('to_branch_id', $branch->id);
                })->count();
                
                if ($transfersCount > 0) {
                    StockTransfer::where(function($query) use ($branch) {
                        $query->where('from_branch_id', $branch->id)
                              ->orWhere('to_branch_id', $branch->id);
                    })->delete();
                    $this->line("  - Deleted {$transfersCount} stock transfers");
                }

                // 3. Detach users from branch
                $usersCount = $branch->users()->count();
                if ($usersCount > 0) {
                    $branch->users()->detach();
                    $this->line("  - Detached {$usersCount} users");
                }

                // 4. Detach products from branch
                $productsCount = $branch->products()->count();
                if ($productsCount > 0) {
                    $branch->products()->detach();
                    $this->line("  - Detached {$productsCount} products");
                }

                // 5. Delete the branch
                $branch->delete();
                $this->line("  - Branch deleted successfully");
            }

            DB::commit();
            $this->info("Successfully deleted {$seededBranches->count()} seeded branches!");

        } catch (\Exception $e) {
            DB::rollback();
            $this->error("Error deleting branches: " . $e->getMessage());
            return 1;
        }

        return 0;
    }
}