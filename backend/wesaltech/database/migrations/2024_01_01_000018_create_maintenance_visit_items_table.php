<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('maintenance_visit_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('maintenance_visit_id')->constrained()->cascadeOnDelete();
            $table->foreignId('maintenance_product_id')->constrained()->cascadeOnDelete();
            $table->integer('quantity_used');
            $table->decimal('unit_cost', 10, 2);
            $table->decimal('total_cost', 10, 2);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'maintenance_visit_id']);
            $table->index(['tenant_id', 'maintenance_product_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('maintenance_visit_items');
    }
};