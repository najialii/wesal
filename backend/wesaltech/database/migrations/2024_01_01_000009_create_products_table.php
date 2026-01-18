<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('category_id')->nullable(); // Will add foreign key later
            $table->string('name');
            $table->string('sku')->unique();
            $table->string('barcode')->nullable();
            $table->text('description')->nullable();
            $table->decimal('cost_price', 10, 2);
            $table->decimal('selling_price', 10, 2);
            $table->decimal('stock_quantity', 10, 2)->default(0);
            $table->decimal('min_stock_level', 10, 2)->default(0);
            $table->string('unit')->default('piece'); // piece, kg, liter, etc.
            $table->decimal('tax_rate', 5, 2)->default(15.00); // Saudi VAT 15%
            $table->boolean('is_active')->default(true);
            $table->string('image')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'is_active']);
            $table->index(['tenant_id', 'category_id']);
            $table->index(['tenant_id', 'sku']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};