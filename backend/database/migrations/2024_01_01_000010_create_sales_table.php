<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('customer_id')->nullable(); // Will add foreign key after customers table exists
            $table->string('sale_number')->unique();
            $table->string('customer_name');
            $table->string('customer_phone')->nullable();
            $table->string('customer_tax_id')->nullable(); // For B2B sales
            $table->foreignId('salesman_id')->constrained('users');
            $table->decimal('subtotal', 10, 2);
            $table->decimal('tax_amount', 10, 2); // Saudi VAT
            $table->decimal('discount_amount', 10, 2)->default(0);
            $table->decimal('total_amount', 10, 2);
            $table->enum('payment_method', ['cash', 'card', 'bank_transfer', 'credit']);
            $table->enum('payment_status', ['pending', 'paid', 'partial', 'refunded'])->default('pending');
            $table->text('notes')->nullable();
            $table->timestamp('sale_date');
            $table->timestamps();

            $table->index(['tenant_id', 'sale_date']);
            $table->index(['tenant_id', 'payment_status']);
            $table->index(['tenant_id', 'salesman_id']);
            $table->index(['tenant_id', 'customer_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales');
    }
};