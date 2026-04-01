<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = [
        'table_number', 
        'status', 
        'total_price'
    ];
    
    protected $casts = [
        'total_price' => 'float',
    ];
    
    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }
}
