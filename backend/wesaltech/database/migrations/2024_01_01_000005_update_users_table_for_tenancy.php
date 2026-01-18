<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable()->after('id')->constrained()->nullOnDelete();
            $table->boolean('is_super_admin')->default(false)->after('email_verified_at');
            $table->string('avatar')->nullable()->after('is_super_admin');
            $table->string('phone')->nullable()->after('avatar');
            $table->string('timezone')->default('UTC')->after('phone');
            $table->timestamp('last_login_at')->nullable()->after('timezone');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['tenant_id']);
            $table->dropColumn([
                'tenant_id',
                'is_super_admin',
                'avatar',
                'phone',
                'timezone',
                'last_login_at'
            ]);
        });
    }
};