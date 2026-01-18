<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('user_email')->nullable();
            $table->string('action');
            $table->string('resource_type')->nullable();
            $table->string('resource_id')->nullable();
            $table->string('method', 10);
            $table->text('url');
            $table->ipAddress('ip_address');
            $table->text('user_agent')->nullable();
            $table->json('request_data')->nullable();
            $table->integer('response_status');
            $table->json('response_data')->nullable();
            $table->timestamp('performed_at');
            $table->timestamps();

            $table->index(['user_id', 'performed_at']);
            $table->index(['resource_type', 'resource_id']);
            $table->index(['action', 'performed_at']);
            $table->index('performed_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};