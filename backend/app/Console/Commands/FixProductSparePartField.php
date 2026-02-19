<?php

namespace App\Console\Commands;

use App\Models\Product;
use Illuminate\Console\Command;

class FixProductSparePartField extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'products:fix-spare-part-field';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fix existing products that have null is_spare_part field';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Fixing products with null is_spare_part field...');
        
        $count = Product::whereNull('is_spare_part')->update(['is_spare_part' => false]);
        
        $this->info("Updated {$count} products with is_spare_part = false");
        
        return 0;
    }
}
