<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add index on branches table
        Schema::table('branches', function (Blueprint $table) {
            $table->index(['tenant_id', 'is_active'], 'idx_branches_tenant_active');
        });

        // Add index on branch_user pivot table
        Schema::table('branch_user', function (Blueprint $table) {
            $table->index(['user_id', 'branch_id'], 'idx_branch_user_user_branch');
        });

        // Add index on branch_product pivot table
        Schema::table('branch_product', function (Blueprint $table) {
            $table->index(['branch_id', 'product_id'], 'idx_branch_product_branch_product');
        });

        // Add index on sales table
        Schema::table('sales', function (Blueprint $table) {
            $table->index(['branch_id', 'sale_date'], 'idx_sales_branch_date');
        });

        // Add index on maintenance_contracts table
        Schema::table('maintenance_contracts', function (Blueprint $table) {
            $table->index(['branch_id', 'status'], 'idx_maintenance_contracts_branch_status');
        });

        // Add index on stock_transfers table
        Schema::table('stock_transfers', function (Blueprint $table) {
            $table->index(['status', 'created_at'], 'idx_stock_transfers_status_created');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('branches', function (Blueprint $table) {
            $table->dropIndex('idx_branches_tenant_active');
        });

        Schema::table('branch_user', function (Blueprint $table) {
            $table->dropIndex('idx_branch_user_user_branch');
        });

        Schema::table('branch_product', function (Blueprint $table) {
            $table->dropIndex('idx_branch_product_branch_product');
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->dropIndex('idx_sales_branch_date');
        });

        Schema::table('maintenance_contracts', function (Blueprint $table) {
            $table->dropIndex('idx_maintenance_contracts_branch_status');
        });

        Schema::table('stock_transfers', function (Blueprint $table) {
            $table->dropIndex('idx_stock_transfers_status_created');
        });
    }
};
