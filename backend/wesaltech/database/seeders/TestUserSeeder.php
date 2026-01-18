<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Tenant;
use Illuminate\Support\Facades\Hash;

class TestUserSeeder extends Seeder
{
    public function run(): void
    {
        $tenant = Tenant::first();
        if (!$tenant) {
            return;
        }

        User::updateOrCreate(
            ['email' => 'business@wesaltech.com'],
            [
                'name' => 'Business User',
                'email' => 'business@wesaltech.com',
                'password' => Hash::make('password'),
                'tenant_id' => $tenant->id,
                'is_super_admin' => false,
                'email_verified_at' => now(),
            ]
        );
    }
}