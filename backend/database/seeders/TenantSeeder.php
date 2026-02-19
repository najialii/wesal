<?php

namespace Database\Seeders;

use App\Models\Tenant;
use App\Models\User;
use App\Models\Plan;
use App\Models\Post;
use App\Models\Project;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class TenantSeeder extends Seeder
{
    public function run(): void
    {
        $plans = Plan::all();
        
        // Create sample tenants
        $tenants = [
            [
                'name' => 'Acme Corporation',
                'slug' => 'acme-corp',
                'domain' => 'acme.wesaltech.com',
                'plan_id' => $plans->where('slug', 'professional')->first()->id,
                'status' => 'active',
                'trial_ends_at' => now()->addDays(14),
                'default_language' => 'en',
            ],
            [
                'name' => 'TechStart Inc',
                'slug' => 'techstart',
                'domain' => 'techstart.wesaltech.com',
                'plan_id' => $plans->where('slug', 'starter')->first()->id,
                'status' => 'active',
                'trial_ends_at' => now()->addDays(7),
                'default_language' => 'ar',
            ],
            [
                'name' => 'Enterprise Solutions',
                'slug' => 'enterprise-solutions',
                'domain' => 'enterprise.wesaltech.com',
                'plan_id' => $plans->where('slug', 'enterprise')->first()->id,
                'status' => 'active',
                'default_language' => 'en',
            ],
            [
                'name' => 'شركة الرياض التقنية',
                'slug' => 'riyadh-tech',
                'domain' => 'riyadh.wesaltech.com',
                'plan_id' => $plans->where('slug', 'professional')->first()->id,
                'status' => 'active',
                'trial_ends_at' => now()->addDays(30),
                'default_language' => 'ar',
            ],
        ];

        foreach ($tenants as $tenantData) {
            $tenant = Tenant::create($tenantData);
            
            // Create tenant admin user
            $adminUser = User::create([
                'name' => $tenant->name . ' Admin',
                'email' => 'admin@' . str_replace('.wesaltech.com', '.com', $tenant->domain),
                'password' => Hash::make('password'),
                'tenant_id' => $tenant->id,
                'email_verified_at' => now(),
            ]);

            // Create some regular users for the tenant
            $users = [];
            $languages = ['en', 'ar'];
            for ($i = 1; $i <= 3; $i++) {
                $users[] = User::create([
                    'name' => "User {$i} - {$tenant->name}",
                    'email' => "user{$i}@" . str_replace('.wesaltech.com', '.com', $tenant->domain),
                    'password' => Hash::make('password'),
                    'tenant_id' => $tenant->id,
                    'email_verified_at' => now(),
                    'language_preference' => $i === 1 ? null : $languages[array_rand($languages)], // First user inherits tenant default
                ]);
            }

            // Create sample posts for the tenant
            for ($i = 1; $i <= 5; $i++) {
                Post::create([
                    'tenant_id' => $tenant->id,
                    'title' => "Sample Post {$i} for {$tenant->name}",
                    'content' => "This is sample content for post {$i} belonging to {$tenant->name}. This demonstrates row-level tenant isolation.",
                    'status' => $i <= 3 ? 'published' : 'draft',
                    'published_at' => $i <= 3 ? now()->subDays(rand(1, 30)) : null,
                    'author_id' => $users[array_rand($users)]->id,
                ]);
            }

            // Create sample projects for the tenant
            for ($i = 1; $i <= 3; $i++) {
                Project::create([
                    'tenant_id' => $tenant->id,
                    'name' => "Project {$i} - {$tenant->name}",
                    'description' => "Sample project {$i} for {$tenant->name}. This shows how tenant data is isolated.",
                    'status' => ['planning', 'active', 'completed'][array_rand(['planning', 'active', 'completed'])],
                    'start_date' => now()->subDays(rand(10, 60)),
                    'end_date' => now()->addDays(rand(30, 90)),
                    'manager_id' => $adminUser->id,
                ]);
            }
        }
    }
}