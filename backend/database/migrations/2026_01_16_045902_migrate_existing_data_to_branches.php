<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\Tenant;
use App\Models\Branch;
use App\Models\Product;
use App\Models\User;
use App\Models\Sale;
use App\Models\MaintenanceContract;
use App\Models\MaintenanceVisit;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Create default branch for each tenant
        $tenants = Tenant::all();
        
        foreach ($tenants as $tenant) {
            // Create default branch
            $branch = Branch::create([
                'tenant_id' => $tenant->id,
                'name' => 'Main Branch',
                'code' => 'MAIN',
                'address' => $tenant->address,
                'phone' => $tenant->phone,
                'email' => $tenant->email,
                'is_default' => true,
                'is_active' => true,
            ]);

            // Assign all users to the default branch
            $users = User::where('tenant_id', $tenant->id)->get();
            foreach ($users as $user) {
                $user->branches()->attach($branch->id, [
                    'is_manager' => $user->isTenantAdmin(),
                ]);
            }

            // Migrate products to branch_product pivot table
            $products = Product::withoutGlobalScope('tenant')
                              ->where('tenant_id', $tenant->id)
                              ->get();
            
            foreach ($products as $product) {
                DB::table('branch_product')->insert([
                    'branch_id' => $branch->id,
                    'product_id' => $product->id,
                    'stock_quantity' => $product->stock_quantity ?? 0,
                    'min_stock_level' => $product->min_stock_level ?? 0,
                    'selling_price' => $product->selling_price,
                    'is_active' => $product->is_active ?? true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // Update sales with branch_id
            Sale::withoutGlobalScope('tenant')
                ->where('tenant_id', $tenant->id)
                ->whereNull('branch_id')
                ->update(['branch_id' => $branch->id]);

            // Update maintenance contracts with branch_id
            MaintenanceContract::withoutGlobalScope('tenant')
                ->where('tenant_id', $tenant->id)
                ->whereNull('branch_id')
                ->update(['branch_id' => $branch->id]);

            // Update maintenance visits with branch_id
            MaintenanceVisit::withoutGlobalScope('tenant')
                ->where('tenant_id', $tenant->id)
                ->whereNull('branch_id')
                ->update(['branch_id' => $branch->id]);

            // Update stock movements with branch_id
            StockMovement::withoutGlobalScope('tenant')
                ->where('tenant_id', $tenant->id)
                ->whereNull('branch_id')
                ->update(['branch_id' => $branch->id]);
        }

        // Make branch_id NOT NULL after data migration
        Schema::table('sales', function (Blueprint $table) {
            $table->foreignId('branch_id')->nullable(false)->change();
        });

        Schema::table('maintenance_contracts', function (Blueprint $table) {
            $table->foreignId('branch_id')->nullable(false)->change();
        });

        Schema::table('maintenance_visits', function (Blueprint $table) {
            $table->foreignId('branch_id')->nullable(false)->change();
        });

        Schema::table('stock_movements', function (Blueprint $table) {
            $table->foreignId('branch_id')->nullable(false)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Make branch_id nullable again
        Schema::table('sales', function (Blueprint $table) {
            $table->foreignId('branch_id')->nullable()->change();
        });

        Schema::table('maintenance_contracts', function (Blueprint $table) {
            $table->foreignId('branch_id')->nullable()->change();
        });

        Schema::table('maintenance_visits', function (Blueprint $table) {
            $table->foreignId('branch_id')->nullable()->change();
        });

        Schema::table('stock_movements', function (Blueprint $table) {
            $table->foreignId('branch_id')->nullable()->change();
        });

        // Clear branch assignments
        DB::table('branch_user')->truncate();
        DB::table('branch_product')->truncate();

        // Clear branch_id from tables
        DB::table('sales')->update(['branch_id' => null]);
        DB::table('maintenance_contracts')->update(['branch_id' => null]);
        DB::table('maintenance_visits')->update(['branch_id' => null]);
        DB::table('stock_movements')->update(['branch_id' => null]);

        // Delete all branches
        Branch::truncate();
    }
};
