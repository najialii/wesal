<?php

namespace Database\Factories;

use App\Models\MaintenanceContract;
use App\Models\Tenant;
use App\Models\Branch;
use App\Models\Product;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Carbon\Carbon;

class MaintenanceContractFactory extends Factory
{
    protected $model = MaintenanceContract::class;

    public function definition(): array
    {
        $startDate = $this->faker->dateTimeBetween('-1 year', 'now');
        $endDate = $this->faker->dateTimeBetween($startDate, '+2 years');
        
        return [
            'tenant_id' => Tenant::factory(),
            'branch_id' => Branch::factory(),
            'product_id' => Product::factory(),
            'customer_id' => Customer::factory(),
            'customer_name' => $this->faker->company,
            'customer_phone' => $this->faker->phoneNumber,
            'customer_email' => $this->faker->email,
            'customer_address' => $this->faker->address,
            'assigned_technician_id' => User::factory(),
            'frequency' => $this->faker->randomElement(['weekly', 'monthly', 'quarterly', 'semi_annual', 'annual']),
            'frequency_value' => null,
            'frequency_unit' => null,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'contract_value' => $this->faker->randomFloat(2, 1000, 50000),
            'special_instructions' => $this->faker->optional()->sentence,
            'status' => $this->faker->randomElement(['active', 'paused', 'completed', 'cancelled']),
        ];
    }

    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'active',
        ]);
    }

    public function withCustomFrequency(): static
    {
        return $this->state(fn (array $attributes) => [
            'frequency' => 'custom',
            'frequency_value' => $this->faker->numberBetween(1, 12),
            'frequency_unit' => $this->faker->randomElement(['days', 'weeks', 'months']),
        ]);
    }

    public function expired(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'active',
            'start_date' => $this->faker->dateTimeBetween('-2 years', '-1 year'),
            'end_date' => $this->faker->dateTimeBetween('-6 months', '-1 day'),
        ]);
    }

    public function longTerm(): static
    {
        return $this->state(fn (array $attributes) => [
            'start_date' => now()->subYear(),
            'end_date' => now()->addYear(),
        ]);
    }
}