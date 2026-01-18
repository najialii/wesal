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
        Schema::table('maintenance_visits', function (Blueprint $table) {
            // Drop the old foreign key and column
            $table->dropForeign(['assigned_worker_id']);
            $table->dropColumn('assigned_worker_id');
            
            // Add new assigned_technician_id that references users table
            $table->foreignId('assigned_technician_id')->nullable()->after('maintenance_contract_id')->constrained('users')->nullOnDelete();
            
            // Update index
            $table->dropIndex(['tenant_id', 'assigned_worker_id']);
            $table->index(['tenant_id', 'assigned_technician_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('maintenance_visits', function (Blueprint $table) {
            // Drop the new foreign key and column
            $table->dropForeign(['assigned_technician_id']);
            $table->dropColumn('assigned_technician_id');
            
            // Restore old assigned_worker_id
            $table->foreignId('assigned_worker_id')->nullable()->after('maintenance_contract_id')->constrained('workers')->nullOnDelete();
            
            // Restore index
            $table->dropIndex(['tenant_id', 'assigned_technician_id']);
            $table->index(['tenant_id', 'assigned_worker_id']);
        });
    }
};
