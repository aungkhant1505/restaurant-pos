<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;


// The route that sends the menu to React
Route::get('/menu', function () {
    return MenuItem::all();
});

// The route that catches the cart from React
Route::post('/orders', function (Request $request) {
    // 1. Create the main Order receipt
    $order = new Order();
    $order->total_price = $request->total_price;
    $order->status = 'pending';
    $order->save();

    // 2. Loop through the cart array and attach each item to the Order
    foreach ($request->items as $item) {
        $orderItem = new OrderItem();
        $orderItem->order_id = $order->id;
        $orderItem->menu_item_id = $item['id'];
        $orderItem->quantity = $item['quantity'];
        $orderItem->price = $item['price'];
        $orderItem->save();
    }

    // 3. Send a success message back to React
    return response()->json([
        'message' => 'Order successfully sent to kitchen!',
        'order_id' => $order->id
    ]);
});