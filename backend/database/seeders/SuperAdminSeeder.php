<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        $superAdmin = User::create([
            'name' => 'Super Admin',
            'email' => 'admin@wesaltech.com',
            'password' => Hash::make('11235813nJ'),
            'email_verified_at' => now(),
            'is_super_admin' => true,
            'tenant_id' => null, // Super admin doesn't belong to any tenant
        ]);

        $superAdmin->assignRole('system_admin');

        $this->command->info('Super Admin created successfully!');
        $this->command->info('Email: admin@wesaltech.com');
        $this->command->info('Password: 11235813nJ');
    }
}
