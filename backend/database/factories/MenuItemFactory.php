<?php

namespace Database\Factories;

use App\Models\MenuItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MenuItem>
 */
class MenuItemFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            // Generates a random 2-3 word name (e.g., "Spicy Granite Chicken")
            'name' => ucwords(fake()->words(rand(2, 3), true)), 
            
            // Generates a random tasty-sounding sentence
            'description' => fake()->sentence(), 
            
            // Generates a random price between $5.00 and $45.00
            'price' => fake()->randomFloat(2, 5, 45), 
            
            // Randomly picks one of these categories
            'category' => fake()->randomElement(['Appetizer', 'Main Course', 'Dessert', 'Drink']), 
            
            // 90% chance the item is in stock, 10% chance it's sold out
            'is_available' => fake()->boolean(90), 
        ];
    }
}
