<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\Tenant;
use Illuminate\Database\Seeder;

class CustomerSeeder extends Seeder
{
    public function run(): void
    {
        $tenants = Tenant::all();

        foreach ($tenants as $tenant) {
            // Create individual customers
            Customer::factory()
                ->count(15)
                ->individual()
                ->active()
                ->create(['tenant_id' => $tenant->id]);

            // Create business customers
            Customer::factory()
                ->count(5)
                ->business()
                ->active()
                ->withCredit(10000)
                ->create(['tenant_id' => $tenant->id]);

            // Create some inactive customers
            Customer::factory()
                ->count(3)
                ->inactive()
                ->create(['tenant_id' => $tenant->id]);

            // Create specific customers for demo
            if ($tenant->domain === 'acme') {
                Customer::create([
                    'tenant_id' => $tenant->id,
                    'name' => 'Ahmed Al-Rashid',
                    'phone' => '+966501234567',
                    'secondary_phone' => '+966112345678',
                    'address' => 'King Fahd Road, Riyadh, Saudi Arabia',
                    'email' => 'ahmed@example.com',
                    'type' => 'individual',
                    'credit_limit' => 5000,
                    'current_balance' => 1200,
                    'is_active' => true,
                    'notes' => 'VIP Customer - Regular maintenance contracts',
                ]);

                Customer::create([
                    'tenant_id' => $tenant->id,
                    'name' => 'Riyadh Tech Solutions',
                    'phone' => '+966112345678',
                    'address' => 'Olaya District, Riyadh, Saudi Arabia',
                    'email' => 'info@riyadhtech.com',
                    'type' => 'business',
                    'tax_number' => '1234567890',
                    'credit_limit' => 25000,
                    'current_balance' => 5000,
                    'is_active' => true,
                    'notes' => 'Corporate client - Monthly bulk orders',
                ]);
            }
        }
    }
}