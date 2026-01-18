<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('status', ['planning', 'active', 'completed', 'cancelled'])->default('planning');
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->foreignId('manager_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            // Index for tenant-based queries
            $table->index(['tenant_id', 'status']);
            $table->index(['tenant_id', 'start_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};