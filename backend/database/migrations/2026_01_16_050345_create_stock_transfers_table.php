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
        Schema::create('stock_transfers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->foreignId('from_branch_id')->constrained('branches')->onDelete('cascade');
            $table->foreignId('to_branch_id')->constrained('branches')->onDelete('cascade');
            $table->integer('quantity');
            $table->enum('status', ['pending', 'completed', 'cancelled'])->default('pending');
            $table->foreignId('initiated_by')->constrained('users');
            $table->foreignId('completed_by')->nullable()->constrained('users');
            $table->timestamp('completed_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            // Indexes
            $table->index(['status', 'created_at']);
            $table->index(['from_branch_id', 'status']);
            $table->index(['to_branch_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_transfers');
    }
};
