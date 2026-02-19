<?php

namespace Database\Factories;

use App\Models\Customer;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

class CustomerFactory extends Factory
{
    protected $model = Customer::class;

    public function definition(): array
    {
        return [
            'tenant_id' => Tenant::factory(),
            'name' => $this->faker->name(),
            'phone' => $this->faker->phoneNumber(),
            'secondary_phone' => $this->faker->optional()->phoneNumber(),
            'address' => $this->faker->address(),
            'email' => $this->faker->optional()->email(),
            'type' => $this->faker->randomElement(['individual', 'business']),
            'tax_number' => $this->faker->optional()->numerify('##########'),
            'credit_limit' => $this->faker->randomFloat(2, 0, 10000),
            'current_balance' => $this->faker->randomFloat(2, 0, 1000),
            'is_active' => $this->faker->boolean(90),
            'notes' => $this->faker->optional()->sentence(),
        ];
    }

    public function individual(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'individual',
            'tax_number' => null,
        ]);
    }

    public function business(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'business',
            'name' => $this->faker->company(),
            'tax_number' => $this->faker->numerify('##########'),
        ]);
    }

    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => true,
        ]);
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }

    public function withCredit(float $limit = 5000): static
    {
        return $this->state(fn (array $attributes) => [
            'credit_limit' => $limit,
            'current_balance' => $this->faker->randomFloat(2, 0, $limit * 0.5),
        ]);
    }
}