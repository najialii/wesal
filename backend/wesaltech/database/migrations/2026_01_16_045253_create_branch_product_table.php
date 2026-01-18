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
        Schema::create('branch_product', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained()->onDelete('cascade');
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->integer('stock_quantity')->default(0);
            $table->integer('min_stock_level')->default(0);
            $table->decimal('selling_price', 10, 2)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            // Unique constraint to prevent duplicate assignments
            $table->unique(['branch_id', 'product_id']);
            // Index for low stock queries
            $table->index(['branch_id', 'stock_quantity', 'min_stock_level']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('branch_product');
    }
};
