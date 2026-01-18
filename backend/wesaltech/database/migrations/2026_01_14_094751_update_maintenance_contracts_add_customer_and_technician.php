<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('maintenance_contracts', function (Blueprint $table) {
            // Add customer_id foreign key
            $table->foreignId('customer_id')->nullable()->after('product_id')->constrained()->nullOnDelete();
            
            // Add assigned_technician_id (references users table)
            $table->foreignId('assigned_technician_id')->nullable()->after('customer_address')->constrained('users')->nullOnDelete();
            
            // Make sale_id nullable since we might create contracts without a sale
            $table->foreignId('sale_id')->nullable()->change();
        });
        
        // Update frequency enum to include 'once'
        DB::statement("ALTER TABLE maintenance_contracts MODIFY COLUMN frequency ENUM('once', 'weekly', 'monthly', 'quarterly', 'semi_annual', 'annual', 'custom') NOT NULL");
    }

    public function down(): void
    {
        Schema::table('maintenance_contracts', function (Blueprint $table) {
            $table->dropForeign(['customer_id']);
            $table->dropColumn('customer_id');
            
            $table->dropForeign(['assigned_technician_id']);
            $table->dropColumn('assigned_technician_id');
        });
        
        // Revert frequency enum
        DB::statement("ALTER TABLE maintenance_contracts MODIFY COLUMN frequency ENUM('weekly', 'monthly', 'quarterly', 'semi_annual', 'annual', 'custom') NOT NULL");
    }
};
