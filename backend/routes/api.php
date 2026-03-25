<?php

use App\Events\OrderReady;
use App\Events\OrderSentToKitchen;
use App\Events\OrderUpdated;
use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

// The route that sends the menu to React
Route::get('/menu', function () {
    return MenuItem::all();
});

// 2. Catch new menu items from React (The Admin screen)


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

    // SHOUT INTO THE PUSHER WEBSOCKET!
    event(new OrderSentToKitchen());

    return response()->json([
        'message' => 'Order successfully sent to kitchen!',
        'order_id' => $order->id
    ]);
});

Route::get('/orders', function () {
    return Order::with('items.menuItem')
        ->where('status', 'pending')
        ->orderBy('created_at', 'asc')
        ->get();
});

Route::patch('/order-items/{id}', function ($id) {
    $orderItem = OrderItem::findorFail($id);
    $orderItem->status = 'completed';
    $orderItem->save();

    $order = Order::with('items')->findOrFail($orderItem->order_id);

    $allCompleted = true;

    foreach ($order->items as $item) {
        if ($item->status != 'completed') {
            $allCompleted = false;
            break;
        }
    }

    if ($allCompleted) {
        $order->status = 'completed';
        $order->save();

        event(new OrderReady($order->id));
    } else {
        event(new OrderUpdated());
    }

    return response()->json([
        'message' => 'Item bumped!'
    ]);
});

Route::patch('/orders/{id}', function ($id) {
    $order = Order::findorFail($id);
    $order->status = 'completed';
    $order->save();

    event(new OrderReady($order->id));

    return response()->json([
        'message' => 'Order successfully completed!'
    ]);
});


Route::post('/login', function (Request $request) {
    $user = User::where('email', $request->email)->first();

    if (!$user || !Hash::check($request->password, $user->password)) {
        return response()->json(['message' => 'Invalid credentials'], 401);
    }

    $token = $user->createToken('manager-token')->plainTextToken;

    return response()->json([
        'token' => $token,
        'message' => 'Login successful!'
    ]);
});

Route::post('/pos/pin-login', function (Request $request) {
    $user = User::where('pin_code', $request->pin)
        ->where('role', 'waiter')
        ->first();

    if (!$user) {
        return response()->json(['message' => 'Invalid PIN'], 401);
    }

    return response()->json([
        'message' => 'Terminal Unlocked!',
        'user' => $user->name
    ]);
});

Route::middleware('auth:sanctum')->group(function () {
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

    Route::delete('/menu/{id}', function ($id) {
        $item = MenuItem::findorFail($id);
        $item->delete();

        return response()->json([
            'message' => $item->name . ' was removed from the menu!'
        ]);
    });

    Route::get('/analytics', function () {
        $completedOrders = Order::where('status', 'completed')->get();

        $totalRevenue = $completedOrders->sum('total_price');
        $totalOrders = $completedOrders->count();

        $bestSellers = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('menu_items', 'order_items.menu_item_id', '=', 'menu_items.id')
            ->where('orders.status', 'completed')
            ->select('menu_items.name', DB::raw('SUM(order_items.quantity) as total_sold'))
            ->groupBy('menu_items.id', 'menu_items.name')
            ->orderByDesc('total_sold')
            ->take(3)
            ->get();

        return response()->json([
            'total_revenue' => $totalRevenue,
            'total_orders' => $totalOrders,
            'best_sellers' => $bestSellers
        ]);
    });

    Route::get('/history', function () {
        return Order::with('items.menuItem')
            ->where('status', 'completed')
            ->orderBy('created_at', 'desc')
            ->get();
    });
    
});