<?php

namespace Database\Factories;

use App\Models\Plan;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Plan>
 */
class PlanFactory extends Factory
{
    protected $model = Plan::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $planTypes = ['basic', 'professional', 'enterprise', 'starter', 'premium'];
        $planType = $this->faker->randomElement($planTypes);
        
        return [
            'name' => ucfirst($planType) . ' Plan',
            'slug' => $planType . '-' . $this->faker->unique()->randomNumber(4),
            'description' => $this->faker->sentence(10),
            'price' => $this->faker->randomFloat(2, 9.99, 199.99),
            'billing_cycle' => $this->faker->randomElement(['monthly', 'yearly']),
            'features' => $this->faker->randomElements([
                'Basic POS', 'Advanced POS', 'Unlimited products', 'Basic reporting', 
                'Advanced reporting', 'Inventory management', 'API access', 'Priority support'
            ], $this->faker->numberBetween(2, 5)),
            'limits' => [
                'products' => $this->faker->randomElement([100, 500, 1000, -1]),
                'users' => $this->faker->randomElement([3, 10, 25, -1]),
                'storage' => $this->faker->randomElement([1024, 5120, 10240, -1]),
            ],
            'is_active' => $this->faker->boolean(90), // 90% chance of being active
            'trial_days' => $this->faker->randomElement([0, 7, 14, 30]),
            'sort_order' => $this->faker->numberBetween(1, 10),
        ];
    }

    /**
     * Indicate that the plan is active.
     */
    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => true,
        ]);
    }

    /**
     * Indicate that the plan is inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }

    /**
     * Create a basic plan.
     */
    public function basic(): static
    {
        return $this->state(fn (array $attributes) => [
            'name' => 'Basic',
            'slug' => 'basic',
            'description' => 'Perfect for small businesses getting started',
            'price' => 29.99,
            'features' => ['Basic POS', 'Up to 100 products', 'Basic reporting'],
            'limits' => ['products' => 100, 'users' => 3, 'storage' => 1024],
        ]);
    }

    /**
     * Create a professional plan.
     */
    public function professional(): static
    {
        return $this->state(fn (array $attributes) => [
            'name' => 'Professional',
            'slug' => 'professional',
            'description' => 'Advanced features for growing businesses',
            'price' => 59.99,
            'features' => ['Advanced POS', 'Unlimited products', 'Advanced reporting', 'Inventory management'],
            'limits' => ['products' => -1, 'users' => 10, 'storage' => 5120],
        ]);
    }

    /**
     * Create an enterprise plan.
     */
    public function enterprise(): static
    {
        return $this->state(fn (array $attributes) => [
            'name' => 'Enterprise',
            'slug' => 'enterprise',
            'description' => 'Full-featured solution for large organizations',
            'price' => 99.99,
            'features' => ['Enterprise POS', 'Unlimited everything', 'Custom reporting', 'API access', 'Priority support'],
            'limits' => ['products' => -1, 'users' => -1, 'storage' => -1],
        ]);
    }

    /**
     * Create a plan with trial period.
     */
    public function withTrial(int $days = 14): static
    {
        return $this->state(fn (array $attributes) => [
            'trial_days' => $days,
        ]);
    }
}