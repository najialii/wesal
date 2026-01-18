<?php

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            [
                'name' => 'Starter',
                'slug' => 'starter',
                'description' => 'Perfect for small teams getting started',
                'price' => 29.00,
                'billing_cycle' => 'monthly',
                'features' => [
                    'Up to 5 users',
                    'Basic dashboard',
                    'Email support',
                    'API access',
                ],
                'limits' => [
                    'users' => 5,
                    'storage' => 1024, // MB
                    'api_calls' => 1000,
                ],
                'trial_days' => 14,
                'sort_order' => 1,
            ],
            [
                'name' => 'Professional',
                'slug' => 'professional',
                'description' => 'For growing businesses with advanced needs',
                'price' => 79.00,
                'billing_cycle' => 'monthly',
                'features' => [
                    'Up to 25 users',
                    'Advanced analytics',
                    'Priority support',
                    'API access',
                    'Custom integrations',
                    'Advanced reporting',
                ],
                'limits' => [
                    'users' => 25,
                    'storage' => 10240, // MB
                    'api_calls' => 10000,
                ],
                'trial_days' => 14,
                'sort_order' => 2,
            ],
            [
                'name' => 'Enterprise',
                'slug' => 'enterprise',
                'description' => 'For large organizations with custom requirements',
                'price' => 199.00,
                'billing_cycle' => 'monthly',
                'features' => [
                    'Unlimited users',
                    'Custom dashboard',
                    'Dedicated support',
                    'API access',
                    'Custom integrations',
                    'Advanced reporting',
                    'SSO integration',
                    'Custom branding',
                ],
                'limits' => [
                    'users' => -1, // Unlimited
                    'storage' => -1, // Unlimited
                    'api_calls' => -1, // Unlimited
                ],
                'trial_days' => 30,
                'sort_order' => 3,
            ],
        ];

        foreach ($plans as $plan) {
            Plan::create($plan);
        }
    }
}