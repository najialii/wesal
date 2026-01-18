<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\Category;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Product>
 */
class ProductFactory extends Factory
{
    protected $model = Product::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'tenant_id' => Tenant::factory(),
            'category_id' => Category::factory(),
            'name' => $this->faker->words(3, true),
            'sku' => $this->faker->unique()->regexify('[A-Z]{3}[0-9]{3}'),
            'barcode' => $this->faker->unique()->ean13(),
            'description' => $this->faker->sentence(),
            'cost_price' => $this->faker->randomFloat(2, 10, 500),
            'selling_price' => $this->faker->randomFloat(2, 15, 750),
            'stock_quantity' => $this->faker->numberBetween(0, 100),
            'min_stock_level' => $this->faker->numberBetween(1, 10),
            'unit' => $this->faker->randomElement(['piece', 'kg', 'liter', 'meter']),
            'tax_rate' => 15.00, // Saudi VAT rate
            'is_active' => true,
        ];
    }

    /**
     * Indicate that the product is inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }

    /**
     * Indicate that the product is low stock.
     */
    public function lowStock(): static
    {
        return $this->state(fn (array $attributes) => [
            'stock_quantity' => 2,
            'min_stock_level' => 5,
        ]);
    }
}
