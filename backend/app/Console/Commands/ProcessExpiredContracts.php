<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\Maintenance\ContractService;
use App\Services\BranchContextService;

class ProcessExpiredContracts extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'maintenance:process-expired-contracts';

    /**
     * The console command description.
     */
    protected $description = 'Process expired maintenance contracts and cancel future visits';

    private ContractService $contractService;

    public function __construct(ContractService $contractService)
    {
        parent::__construct();
        $this->contractService = $contractService;
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Processing expired maintenance contracts...');

        try {
            $results = $this->contractService->processExpiredContracts();

            $this->info("Processed {$results['processed_contracts']} expired contracts");
            $this->info("Cancelled {$results['total_cancelled_visits']} future visits");
            $this->info("Sent {$results['notifications_sent']} notifications");

            if ($results['processed_contracts'] > 0) {
                $this->warn("Found {$results['processed_contracts']} expired contracts that needed processing");
            } else {
                $this->info('No expired contracts found');
            }

            return Command::SUCCESS;
        } catch (\Exception $e) {
            $this->error('Failed to process expired contracts: ' . $e->getMessage());
            return Command::FAILURE;
        }
    }
}