<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('menu_items', function (Blueprint $table) {
            $table->id();
            
            // Your custom columns:
            $table->string('name');
            $table->text('description')->nullable(); // nullable means this can be left blank
            $table->decimal('price', 8, 2); // 8 digits total, 2 after the decimal (e.g., 999999.99)
            $table->string('category'); // e.g., 'Appetizer', 'Main Course', 'Drink'
            $table->boolean('is_available')->default(true); // true = in stock, false = sold out
            
            $table->timestamps(); // automatically creates 'created_at' and 'updated_at' columns
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('menu_items');
    }
};
