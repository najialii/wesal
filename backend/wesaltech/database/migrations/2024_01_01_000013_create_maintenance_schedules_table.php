<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('maintenance_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('description');
            $table->string('equipment_name');
            $table->enum('maintenance_type', ['preventive', 'corrective', 'emergency']);
            $table->enum('priority', ['low', 'medium', 'high', 'critical']);
            $table->foreignId('assigned_worker_id')->nullable()->constrained('workers')->nullOnDelete();
            $table->datetime('scheduled_date');
            $table->decimal('estimated_duration', 5, 2); // hours
            $table->enum('status', ['scheduled', 'in_progress', 'completed', 'cancelled'])->default('scheduled');
            $table->datetime('actual_start_time')->nullable();
            $table->datetime('actual_end_time')->nullable();
            $table->decimal('cost', 10, 2)->nullable();
            $table->text('notes')->nullable();
            $table->text('completion_notes')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'status']);
            $table->index(['tenant_id', 'scheduled_date']);
            $table->index(['tenant_id', 'assigned_worker_id']);
            $table->index(['tenant_id', 'priority']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('maintenance_schedules');
    }
};