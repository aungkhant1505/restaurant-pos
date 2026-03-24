<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrderReady implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $orderId; // we will attach the id to the event.

    public function __construct($orderId)
    {
        $this->orderId = $orderId;
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('pos'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'order-ready';
    }
}
