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
            // Check if assigned_worker_id column exists before trying to drop it
            if (Schema::hasColumn('maintenance_visits', 'assigned_worker_id')) {
                // Drop the old foreign key and column
                $table->dropForeign(['assigned_worker_id']);
                $table->dropColumn('assigned_worker_id');
            }
            
            // Add new assigned_technician_id that references users table (if not exists)
            if (!Schema::hasColumn('maintenance_visits', 'assigned_technician_id')) {
                $table->foreignId('assigned_technician_id')->nullable()->after('maintenance_contract_id')->constrained('users')->nullOnDelete();
            }
        });

        // Handle indexes separately to avoid SQLite issues
        try {
            Schema::table('maintenance_visits', function (Blueprint $table) {
                // Try to drop old index if it exists
                $table->dropIndex(['tenant_id', 'assigned_worker_id']);
            });
        } catch (\Exception $e) {
            // Ignore if index doesn't exist
        }

        try {
            Schema::table('maintenance_visits', function (Blueprint $table) {
                // Add new index
                $table->index(['tenant_id', 'assigned_technician_id']);
            });
        } catch (\Exception $e) {
            // Ignore if index already exists
        }
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
