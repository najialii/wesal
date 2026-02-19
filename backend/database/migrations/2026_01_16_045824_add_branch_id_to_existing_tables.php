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
        // Add branch_id to sales table
        Schema::table('sales', function (Blueprint $table) {
            $table->foreignId('branch_id')->nullable()->after('tenant_id')->constrained()->onDelete('cascade');
            $table->index(['branch_id', 'sale_date']);
        });

        // Add branch_id to maintenance_contracts table
        Schema::table('maintenance_contracts', function (Blueprint $table) {
            $table->foreignId('branch_id')->nullable()->after('tenant_id')->constrained()->onDelete('cascade');
            $table->index(['branch_id', 'status']);
        });

        // Add branch_id to maintenance_visits table
        Schema::table('maintenance_visits', function (Blueprint $table) {
            $table->foreignId('branch_id')->nullable()->after('tenant_id')->constrained()->onDelete('cascade');
            $table->index(['branch_id', 'status']);
        });

        // Add branch_id to stock_movements table
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->foreignId('branch_id')->nullable()->after('tenant_id')->constrained()->onDelete('cascade');
            $table->index(['branch_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropForeign(['branch_id']);
            $table->dropIndex(['branch_id', 'sale_date']);
            $table->dropColumn('branch_id');
        });

        Schema::table('maintenance_contracts', function (Blueprint $table) {
            $table->dropForeign(['branch_id']);
            $table->dropIndex(['branch_id', 'status']);
            $table->dropColumn('branch_id');
        });

        Schema::table('maintenance_visits', function (Blueprint $table) {
            $table->dropForeign(['branch_id']);
            $table->dropIndex(['branch_id', 'status']);
            $table->dropColumn('branch_id');
        });

        Schema::table('stock_movements', function (Blueprint $table) {
            $table->dropForeign(['branch_id']);
            $table->dropIndex(['branch_id', 'created_at']);
            $table->dropColumn('branch_id');
        });
    }
};
