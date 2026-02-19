<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('system_setting_histories', function (Blueprint $table) {
            $table->id();
            $table->string('setting_key');
            $table->json('old_value')->nullable();
            $table->json('new_value')->nullable();
            $table->foreignId('changed_by')->constrained('users');
            $table->string('change_reason')->nullable();
            $table->timestamps();

            $table->foreign('setting_key')->references('key')->on('system_settings')->onDelete('cascade');
            $table->index(['setting_key', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('system_setting_histories');
    }
};