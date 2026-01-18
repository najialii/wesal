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
        Schema::create('model_translations', function (Blueprint $table) {
            $table->id();
            $table->string('model_type'); // 'Product', 'Category', 'Worker'
            $table->unsignedBigInteger('model_id'); // Foreign key to the model
            $table->string('field_name'); // 'name', 'description', 'job_title'
            $table->enum('locale', ['ar', 'en']); // 'ar' or 'en'
            $table->text('value'); // Translated content
            $table->timestamps();
            
            // Indexes for performance
            $table->unique(['model_type', 'model_id', 'field_name', 'locale'], 'unique_translation');
            $table->index(['model_type', 'model_id', 'locale'], 'idx_model_lookup');
            $table->index('locale', 'idx_locale');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('model_translations');
    }
};
