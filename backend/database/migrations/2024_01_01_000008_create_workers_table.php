<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('phone');
            $table->string('email')->nullable();
            $table->string('national_id')->unique();
            $table->string('job_title');
            $table->decimal('salary', 10, 2);
            $table->date('hire_date');
            $table->boolean('is_active')->default(true);
            $table->json('skills')->nullable(); // ['mechanic', 'electrician', 'plumber']
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'is_active']);
            $table->index(['tenant_id', 'job_title']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workers');
    }
};