<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('maintenance_products', function (Blueprint $table) {
            // Drop the existing unique constraint on sku
            $table->dropUnique(['sku']);
            
            // Add a composite unique constraint for tenant_id and sku
            $table->unique(['tenant_id', 'sku'], 'maintenance_products_tenant_sku_unique');
        });
    }

    public function down(): void
    {
        Schema::table('maintenance_products', function (Blueprint $table) {
            // Drop the composite unique constraint
            $table->dropUnique('maintenance_products_tenant_sku_unique');
            
            // Add back the global unique constraint on sku
            $table->unique('sku');
        });
    }
};