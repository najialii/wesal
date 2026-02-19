<?php

namespace Database\Factories;

use App\Models\MaintenanceVisit;
use App\Models\MaintenanceContract;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Carbon\Carbon;

class MaintenanceVisitFactory extends Factory
{
    protected $model = MaintenanceVisit::class;

    public function definition(): array
    {
        $scheduledDate = $this->faker->dateTimeBetween('-6 months', '+6 months');
        
        return [
            'tenant_id' => function (array $attributes) {
                return MaintenanceContract::find($attributes['maintenance_contract_id'])->tenant_id ?? 1;
            },
            'branch_id' => function (array $attributes) {
                return MaintenanceContract::find($attributes['maintenance_contract_id'])->branch_id ?? 1;
            },
            'maintenance_contract_id' => MaintenanceContract::factory(),
            'assigned_technician_id' => User::factory(),
            'scheduled_date' => $scheduledDate,
            'scheduled_time' => $this->faker->time('H:i'),
            'actual_start_time' => null,
            'actual_end_time' => null,
            'status' => $this->faker->randomElement(['scheduled', 'in_progress', 'completed', 'cancelled', 'missed']),
            'priority' => $this->faker->randomElement(['low', 'medium', 'high', 'urgent']),
            'work_description' => $this->faker->optional()->sentence,
            'completion_notes' => null,
            'customer_feedback' => null,
            'customer_rating' => null,
            'total_cost' => null,
            'photos' => null,
            'next_visit_date' => null,
        ];
    }

    public function scheduled(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'scheduled',
            'scheduled_date' => $this->faker->dateTimeBetween('now', '+3 months'),
        ]);
    }

    public function completed(): static
    {
        $startTime = $this->faker->dateTimeBetween('-3 months', 'now');
        $endTime = Carbon::parse($startTime)->addHours($this->faker->numberBetween(1, 4));
        
        return $this->state(fn (array $attributes) => [
            'status' => 'completed',
            'scheduled_date' => $startTime,
            'actual_start_time' => $startTime,
            'actual_end_time' => $endTime,
            'completion_notes' => $this->faker->sentence,
            'customer_rating' => $this->faker->numberBetween(1, 5),
            'total_cost' => $this->faker->randomFloat(2, 50, 500),
        ]);
    }

    public function inProgress(): static
    {
        $startTime = $this->faker->dateTimeBetween('-1 day', 'now');
        
        return $this->state(fn (array $attributes) => [
            'status' => 'in_progress',
            'scheduled_date' => $startTime,
            'actual_start_time' => $startTime,
        ]);
    }

    public function overdue(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'scheduled',
            'scheduled_date' => $this->faker->dateTimeBetween('-2 months', '-1 day'),
        ]);
    }
}