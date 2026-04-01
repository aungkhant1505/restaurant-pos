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
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

// Fetch the Menu (Powered by Redis)
Route::get('/menu', function () {
    // 1. Check Redis for a key called 'menu_items'
    // 2. If it exits, return it instantly.
    // 3. If it doesn't exist, run the function, get it from MySQL, and save it in Redis forever
    return Cache::rememberForever('menu_items', function () {
        return MenuItem::all()->toArray();
    });
});

// 3. Catch checkout carts from React (The POS screen)
// Route::post('/orders', function (Request $request) {
//     $order = new Order();
//     $order->total_price = $request->total_price;
//     $order->status = 'pending';
//     $order->table_number = $request->table_number;
//     $order->save();

//     foreach ($request->items as $item) {
//         $orderItem = new OrderItem();
//         $orderItem->order_id = $order->id;
//         $orderItem->menu_item_id = $item['id'];
//         $orderItem->quantity = $item['quantity'];
//         $orderItem->price = $item['price'];
//         $orderItem->save();
//     }

//     // SHOUT INTO THE PUSHER WEBSOCKET!
//     event(new OrderSentToKitchen());

//     return response()->json([
//         'message' => 'Order successfully sent to kitchen!',
//         'order_id' => $order->id
//     ]);
// });

Route::post('/orders', function (Request $request) {
    // Look for an existing pending order for this table, or create a brand new one
    $order = Order::firstOrCreate(
        ['table_number' => $request->table_number, 'status' => 'pending'],
        ['total_price' => 0] // Default starting price if it's new
    );

    // Add the new cart total to the existing total
    $order->total_price += $request->total_price;
    $order->save();

    // Loop through the items sent from React
    foreach ($request->items as $item) {
        // Did they already order this exact item?
        $existingItem = OrderItem::where('order_id', $order->id)
                                 ->where('menu_item_id', $item['id'])
                                 ->where('status', '!=', 'completed')
                                 ->first();

        if ($existingItem) {
            // Just bump up the quantity on the kitchen ticket!
            $existingItem->quantity += $item['quantity'];
            $existingItem->save();
        } else {
            // It's a brand new dish for this table
            $orderItem = new OrderItem();
            $orderItem->order_id = $order->id;
            $orderItem->menu_item_id = $item['id'];
            $orderItem->quantity = $item['quantity'];
            $orderItem->price = $item['price'];
            $orderItem->status = 'pending';
            $orderItem->save();
        }
    }

    // Shout to the kitchen iPad
    event(new OrderSentToKitchen($order));

    return response()->json([
        'message' => 'Order successfully merged and sent to kitchen!',
        'order_id' => $order->id
    ]);
});

// Route::get('/orders', function () {
//     return Order::with('items.menuItem')
//         ->where('status', 'pending')
//         ->orderBy('created_at', 'asc')
//         ->get();
// });

Route::get('/orders', function () {
    $orders = Order::with('items.menuItem')
        ->where('status', 'pending')
        ->orderBy('created_at', 'asc')
        ->get();

    // We must "flatten" the data so React can read it easily
    return $orders->map(function ($order) {
        return [
            'id' => $order->id,
            'table_number' => $order->table_number,
            'status' => $order->status,
            'total_price' => $order->total_price,
            'created_at' => $order->created_at,
            // Map the nested menuItems into a clean array for the React Receipt
            'items' => $order->items->map(function ($item) {
                return [
                    'id' => $item->id,
                    'name' => $item->menuItem->name ?? 'Unknown', // Pull the name out of the relationship!
                    'price' => $item->price,
                    'quantity' => $item->quantity,
                    'status' => $item->status
                ];
            })
        ];
    });
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
        // The food is done, but the table stays green until they cash out.
        event(new OrderReady($order->id));
    } else {
        event(new OrderUpdated());
    }

    return response()->json([
        'message' => 'Item bumped!'
    ]);
});

// 🚀 NEW: The KDS Route (Only cares about food!)
Route::get('/kds-orders', function () {
    // Fetch ANY order (paid or unpaid) as long as it has uncooked items
    $orders = Order::with('items.menuItem')
        ->whereHas('items', function ($query) {
            $query->where('status', '!=', 'completed');
        })
        ->orderBy('created_at', 'asc')
        ->get();

    return $orders->map(function ($order) {
        return [
            'id' => $order->id,
            'table_number' => $order->table_number,
            'created_at' => $order->created_at,
            'items' => $order->items->map(function ($item) {
                return [
                    'id' => $item->id,
                    'name' => $item->menuItem->name ?? 'Unknown',
                    'quantity' => $item->quantity,
                    'status' => $item->status
                ];
            })
        ];
    });
});


// Route::patch('/orders/{id}', function ($id) {
//     $order = Order::findorFail($id);
//     $order->status = 'completed';
//     $order->save();

//     event(new OrderReady($order->id));

//     return response()->json([
//         'message' => 'Order successfully completed!'
//     ]);
// });

Route::post('/orders/{table_number}/complete', function ($table_number) {
    // Find the active order for this specific table
    $order = Order::where('table_number', $table_number)
                  ->where('status', 'pending')
                  ->firstOrFail();

    $order->status = 'completed';
    $order->save();

    // Tell the Kitchen iPads this ticket is done
    event(new OrderReady($order->id));

    return response()->json([
        'message' => $table_number . ' successfully cashed out!'
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

        // Bust the cache! Force Redis to fetch fresh data next time!
        Cache::forget('menu_items');

        return response()->json([
            'message' => $item->name . ' was added to the menu!',
            'item' => $item
        ]);
    });

    Route::delete('/menu/{id}', function ($id) {
        $item = MenuItem::findorFail($id);
        $item->delete();

        Cache::forget('menu_items');

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