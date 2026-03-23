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

// 2. Catch new menu items from React (The Admin screen)
Route::post('/menu', function (Request $request) {
    $item = new MenuItem();
    $item->name = $request->name;
    $item->description = $request->description;
    $item->price = $request->price;
    $item->category = $request->category;
    $item->is_available = $request->is_available;
    $item->save();

    return response()->json([
        'message' => $item->name . ' was added to the menu!',
        'item' => $item
    ]);
});

// 3. Catch checkout carts from React (The POS screen)
Route::post('/orders', function (Request $request) {
    $order = new Order();
    $order->total_price = $request->total_price;
    $order->status = 'pending';
    $order->save();

    foreach ($request->items as $item) {
        $orderItem = new OrderItem();
        $orderItem->order_id = $order->id;
        $orderItem->menu_item_id = $item['id'];
        $orderItem->quantity = $item['quantity'];
        $orderItem->price = $item['price'];
        $orderItem->save();
    }

    return response()->json([
        'message' => 'Order successfully sent to kitchen!',
        'order_id' => $order->id
    ]);
});