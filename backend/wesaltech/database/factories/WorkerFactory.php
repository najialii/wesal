<?php

namespace Database\Factories;

use App\Models\Worker;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Worker>
 */
class WorkerFactory extends Factory
{
    protected $model = Worker::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'tenant_id' => Tenant::factory(),
            'name' => $this->faker->name(),
            'phone' => $this->faker->phoneNumber(),
            'email' => $this->faker->unique()->safeEmail(),
            'national_id' => $this->faker->unique()->numerify('##########'),
            'job_title' => $this->faker->jobTitle(),
            'salary' => $this->faker->randomFloat(2, 3000, 15000),
            'hire_date' => $this->faker->dateTimeBetween('-2 years', 'now'),
            'is_active' => true,
            'skills' => $this->faker->randomElements(['maintenance', 'repair', 'installation', 'inspection'], 2),
            'notes' => $this->faker->optional()->sentence(),
        ];
    }

    /**
     * Indicate that the worker is inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }
}
