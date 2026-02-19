<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('maintenance_contract_items', function (Blueprint $table) {
            // Drop the existing foreign key constraint
            $table->dropForeign(['maintenance_product_id']);
            
            // Add a new foreign key constraint pointing to products table
            $table->foreign('maintenance_product_id')->references('id')->on('products')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('maintenance_contract_items', function (Blueprint $table) {
            // Drop the products foreign key constraint
            $table->dropForeign(['maintenance_product_id']);
            
            // Add back the maintenance_products foreign key constraint
            $table->foreign('maintenance_product_id')->references('id')->on('maintenance_products')->cascadeOnDelete();
        });
    }
};