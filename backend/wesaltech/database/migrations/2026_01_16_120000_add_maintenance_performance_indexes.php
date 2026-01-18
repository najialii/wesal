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
        // Maintenance contracts indexes
        Schema::table('maintenance_contracts', function (Blueprint $table) {
            // Frequently queried fields
            $table->index(['tenant_id', 'status'], 'idx_contracts_tenant_status');
            $table->index(['tenant_id', 'branch_id', 'status'], 'idx_contracts_tenant_branch_status');
            $table->index(['end_date', 'status'], 'idx_contracts_end_date_status');
            $table->index(['assigned_technician_id', 'status'], 'idx_contracts_technician_status');
            $table->index(['customer_id', 'status'], 'idx_contracts_customer_status');
            $table->index(['created_at'], 'idx_contracts_created_at');
        });

        // Maintenance visits indexes
        Schema::table('maintenance_visits', function (Blueprint $table) {
            // Most frequently queried combinations
            $table->index(['tenant_id', 'status'], 'idx_visits_tenant_status');
            $table->index(['tenant_id', 'branch_id', 'status'], 'idx_visits_tenant_branch_status');
            $table->index(['scheduled_date', 'status'], 'idx_visits_scheduled_date_status');
            $table->index(['assigned_technician_id', 'status'], 'idx_visits_technician_status');
            $table->index(['maintenance_contract_id', 'status'], 'idx_visits_contract_status');
            $table->index(['maintenance_contract_id', 'scheduled_date'], 'idx_visits_contract_date');
            
            // Date range queries
            $table->index(['scheduled_date', 'scheduled_time'], 'idx_visits_scheduled_datetime');
            $table->index(['actual_start_time'], 'idx_visits_actual_start');
            $table->index(['actual_end_time'], 'idx_visits_actual_end');
            
            // Analytics queries
            $table->index(['status', 'scheduled_date'], 'idx_visits_status_date');
            $table->index(['tenant_id', 'scheduled_date'], 'idx_visits_tenant_date');
        });

        // Maintenance contract items indexes
        Schema::table('maintenance_contract_items', function (Blueprint $table) {
            $table->index(['tenant_id', 'maintenance_contract_id'], 'idx_contract_items_tenant_contract');
            $table->index(['maintenance_product_id'], 'idx_contract_items_product');
        });

        // Maintenance visit items indexes
        Schema::table('maintenance_visit_items', function (Blueprint $table) {
            $table->index(['tenant_id', 'maintenance_visit_id'], 'idx_visit_items_tenant_visit');
            $table->index(['maintenance_product_id'], 'idx_visit_items_product');
        });

        // Products indexes (if not already present)
        if (Schema::hasTable('products')) {
            Schema::table('products', function (Blueprint $table) {
                if (!$this->indexExists('products', 'idx_products_tenant_active')) {
                    $table->index(['tenant_id', 'is_active'], 'idx_products_tenant_active');
                }
                if (!$this->indexExists('products', 'idx_products_spare_part')) {
                    $table->index(['is_spare_part', 'is_active'], 'idx_products_spare_part');
                }
                if (!$this->indexExists('products', 'idx_products_sku')) {
                    $table->index(['sku'], 'idx_products_sku');
                }
            });
        }

        // Users indexes for technician queries
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                if (!$this->indexExists('users', 'idx_users_tenant_role')) {
                    $table->index(['tenant_id', 'role'], 'idx_users_tenant_role');
                }
            });
        }

        // Branches indexes
        if (Schema::hasTable('branches')) {
            Schema::table('branches', function (Blueprint $table) {
                if (!$this->indexExists('branches', 'idx_branches_tenant_active')) {
                    $table->index(['tenant_id', 'is_active'], 'idx_branches_tenant_active');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop maintenance contracts indexes
        Schema::table('maintenance_contracts', function (Blueprint $table) {
            $table->dropIndex('idx_contracts_tenant_status');
            $table->dropIndex('idx_contracts_tenant_branch_status');
            $table->dropIndex('idx_contracts_end_date_status');
            $table->dropIndex('idx_contracts_technician_status');
            $table->dropIndex('idx_contracts_customer_status');
            $table->dropIndex('idx_contracts_created_at');
        });

        // Drop maintenance visits indexes
        Schema::table('maintenance_visits', function (Blueprint $table) {
            $table->dropIndex('idx_visits_tenant_status');
            $table->dropIndex('idx_visits_tenant_branch_status');
            $table->dropIndex('idx_visits_scheduled_date_status');
            $table->dropIndex('idx_visits_technician_status');
            $table->dropIndex('idx_visits_contract_status');
            $table->dropIndex('idx_visits_contract_date');
            $table->dropIndex('idx_visits_scheduled_datetime');
            $table->dropIndex('idx_visits_actual_start');
            $table->dropIndex('idx_visits_actual_end');
            $table->dropIndex('idx_visits_status_date');
            $table->dropIndex('idx_visits_tenant_date');
        });

        // Drop other indexes
        Schema::table('maintenance_contract_items', function (Blueprint $table) {
            $table->dropIndex('idx_contract_items_tenant_contract');
            $table->dropIndex('idx_contract_items_product');
        });

        Schema::table('maintenance_visit_items', function (Blueprint $table) {
            $table->dropIndex('idx_visit_items_tenant_visit');
            $table->dropIndex('idx_visit_items_product');
        });

        // Drop conditional indexes
        if (Schema::hasTable('products')) {
            Schema::table('products', function (Blueprint $table) {
                if ($this->indexExists('products', 'idx_products_tenant_active')) {
                    $table->dropIndex('idx_products_tenant_active');
                }
                if ($this->indexExists('products', 'idx_products_spare_part')) {
                    $table->dropIndex('idx_products_spare_part');
                }
                if ($this->indexExists('products', 'idx_products_sku')) {
                    $table->dropIndex('idx_products_sku');
                }
            });
        }

        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                if ($this->indexExists('users', 'idx_users_tenant_role')) {
                    $table->dropIndex('idx_users_tenant_role');
                }
            });
        }

        if (Schema::hasTable('branches')) {
            Schema::table('branches', function (Blueprint $table) {
                if ($this->indexExists('branches', 'idx_branches_tenant_active')) {
                    $table->dropIndex('idx_branches_tenant_active');
                }
            });
        }
    }

    /**
     * Check if an index exists on a table
     */
    private function indexExists(string $table, string $index): bool
    {
        $indexes = Schema::getConnection()
            ->getDoctrineSchemaManager()
            ->listTableIndexes($table);
        
        return array_key_exists($index, $indexes);
    }
};