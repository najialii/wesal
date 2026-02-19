<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('maintenance_contracts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('sale_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('customer_name');
            $table->string('customer_phone')->nullable();
            $table->string('customer_email')->nullable();
            $table->text('customer_address')->nullable();
            $table->enum('frequency', ['weekly', 'monthly', 'quarterly', 'semi_annual', 'annual', 'custom']);
            $table->integer('frequency_value')->nullable(); // For custom frequency (e.g., every 3 months)
            $table->string('frequency_unit')->nullable(); // days, weeks, months, years
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->decimal('contract_value', 10, 2)->nullable();
            $table->json('maintenance_products')->nullable(); // Array of maintenance product IDs and quantities
            $table->text('special_instructions')->nullable();
            $table->enum('status', ['active', 'paused', 'completed', 'cancelled'])->default('active');
            $table->timestamps();

            $table->index(['tenant_id', 'status']);
            $table->index(['tenant_id', 'customer_name']);
            $table->index(['tenant_id', 'start_date']);
            $table->index(['tenant_id', 'sale_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('maintenance_contracts');
    }
};