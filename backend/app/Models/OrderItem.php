<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    public function menuItem()
    {
        return $this->belongsTo(MenuItem::class);
    }
}
