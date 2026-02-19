<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('maintenance_products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('sku')->unique();
            $table->text('description')->nullable();
            $table->decimal('cost_price', 10, 2);
            $table->integer('stock_quantity')->default(0);
            $table->string('unit')->default('pcs');
            $table->enum('type', ['spare_part', 'consumable', 'tool', 'chemical'])->default('spare_part');
            $table->json('compatible_products')->nullable(); // Array of product IDs this maintenance product is compatible with
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['tenant_id', 'is_active']);
            $table->index(['tenant_id', 'type']);
            $table->index(['tenant_id', 'sku']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('maintenance_products');
    }
};