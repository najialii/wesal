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
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->string('user_name')->nullable()->after('user_email');
            $table->boolean('is_super_admin')->default(false)->after('user_name');
            $table->unsignedBigInteger('tenant_id')->nullable()->after('is_super_admin');
            $table->json('request_headers')->nullable()->after('request_data');
            $table->float('execution_time')->nullable()->after('response_data');
            $table->string('session_id')->nullable()->after('execution_time');
            $table->json('session_data')->nullable()->after('session_id');
            
            $table->index(['is_super_admin']);
            $table->index(['tenant_id']);
            $table->index(['session_id']);
            $table->index(['execution_time']);
            $table->index(['performed_at', 'action']);
            
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->dropForeign(['tenant_id']);
            $table->dropIndex(['is_super_admin']);
            $table->dropIndex(['tenant_id']);
            $table->dropIndex(['session_id']);
            $table->dropIndex(['execution_time']);
            $table->dropIndex(['performed_at', 'action']);
            
            $table->dropColumn([
                'user_name',
                'is_super_admin',
                'tenant_id',
                'request_headers',
                'execution_time',
                'session_id',
                'session_data'
            ]);
        });
    }
};
