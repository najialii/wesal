<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Tenant;
use App\Models\Plan;
use App\Models\Subscription;

class SubscriptionSeeder extends Seeder
{
    public function run(): void
    {
        $tenants = Tenant::all();
        $plans = Plan::all();

        foreach ($tenants as $tenant) {
            Subscription::create([
                'tenant_id' => $tenant->id,
                'plan_id' => $plans->random()->id,
                'status' => 'active',
                'payment_status' => 'paid',
                'amount' => rand(29, 199),
                'currency' => 'USD',
                'starts_at' => now()->subDays(rand(1, 30)),
                'ends_at' => now()->addDays(rand(30, 365)),
            ]);
        }
    }
}