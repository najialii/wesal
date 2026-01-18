<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('maintenance_visits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('maintenance_contract_id')->constrained()->cascadeOnDelete();
            $table->foreignId('assigned_worker_id')->nullable()->constrained('workers')->nullOnDelete();
            $table->date('scheduled_date');
            $table->time('scheduled_time')->nullable();
            $table->datetime('actual_start_time')->nullable();
            $table->datetime('actual_end_time')->nullable();
            $table->enum('status', ['scheduled', 'in_progress', 'completed', 'cancelled', 'missed'])->default('scheduled');
            $table->enum('priority', ['low', 'medium', 'high', 'urgent'])->default('medium');
            $table->text('work_description')->nullable();
            $table->text('completion_notes')->nullable();
            $table->text('customer_feedback')->nullable();
            $table->integer('customer_rating')->nullable(); // 1-5 stars
            $table->decimal('total_cost', 10, 2)->nullable();
            $table->json('photos')->nullable(); // Array of photo URLs
            $table->date('next_visit_date')->nullable(); // Auto-calculated based on frequency
            $table->timestamps();

            $table->index(['tenant_id', 'status']);
            $table->index(['tenant_id', 'scheduled_date']);
            $table->index(['tenant_id', 'assigned_worker_id']);
            $table->index(['tenant_id', 'maintenance_contract_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('maintenance_visits');
    }
};