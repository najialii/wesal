<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscription_changes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->onDelete('cascade');
            $table->foreignId('old_plan_id')->nullable()->constrained('plans')->onDelete('set null');
            $table->foreignId('new_plan_id')->constrained('plans')->onDelete('cascade');
            $table->timestamp('changed_at');
            $table->string('reason')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'changed_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscription_changes');
    }
};