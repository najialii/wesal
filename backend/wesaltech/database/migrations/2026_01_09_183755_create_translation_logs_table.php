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
        Schema::create('translation_logs', function (Blueprint $table) {
            $table->id();
            $table->string('translation_key', 255);
            $table->string('locale', 5);
            $table->text('context')->nullable();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->unsignedBigInteger('tenant_id')->nullable();
            $table->timestamp('created_at')->useCurrent();
            
            $table->index(['translation_key', 'locale']);
            $table->index('tenant_id');
            $table->index('created_at');
            
            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('translation_logs');
    }
};