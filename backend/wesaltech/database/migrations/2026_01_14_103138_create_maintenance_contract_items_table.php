<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('maintenance_contract_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('maintenance_contract_id')->constrained()->cascadeOnDelete();
            $table->foreignId('maintenance_product_id')->constrained()->cascadeOnDelete();
            $table->decimal('quantity', 10, 2);
            $table->decimal('unit_cost', 10, 2);
            $table->boolean('is_included')->default(true)->comment('Whether this item is included in the contract or billed separately');
            $table->timestamps();

            $table->index(['tenant_id', 'maintenance_contract_id'], 'mci_tenant_contract_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('maintenance_contract_items');
    }
};
