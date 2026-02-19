<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('system_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->json('value');
            $table->string('category')->index();
            $table->enum('type', ['string', 'number', 'boolean', 'json', 'array'])->default('string');
            $table->text('description')->nullable();
            $table->boolean('is_public')->default(false);
            $table->foreignId('updated_by')->constrained('users');
            $table->timestamps();

            $table->index(['category', 'key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('system_settings');
    }
};