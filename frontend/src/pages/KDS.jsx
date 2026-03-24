import { useEffect } from "react";
import { useState } from "react";
import Pusher from "pusher-js";
import Echo from "laravel-echo";

window.Pusher = Pusher;
const echo = new Echo({
  broadcaster: 'pusher',
  key: '9fea525a282271c221b1', // I grabbed your key from the error message!
  cluster: 'ap1', 
  forceTLS: true
});

function KDS() {

    const [orders, setOrders] = useState([]);

    useEffect(() => {
        fetchOrders();

        const channel = echo.channel("kitchen");
        channel.listen(".new-order", () => {
            console.log("New order received:");
            fetchOrders();
        });

        return () => {
            // ONLY stop listening. Do not disconnect echo!
            channel.stopListening(".new-order"); 
        }
    }, []);

    const fetchOrders = () => {
        fetch('http://localhost:8000/api/orders')
            .then(response => response.json())
            .then(data => setOrders(data))
            .catch(error => console.error('Error fetching orders:', error));
    }

    const completeOrder = (id) => {
        fetch(`http://localhost:8000/api/orders/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
        }).then(() => setOrders(orders.filter(order => order.id !== id)))
            .catch(error => console.error('Error completing order:', error));
    }

    return (
    <div className="flex-1 p-8 bg-slate-800 overflow-y-auto w-full">
      <h2 className="text-3xl font-bold mb-8 text-white">👨‍🍳 Kitchen Display Screen</h2>
      
      {orders.length === 0 ? (
        <div className="flex justify-center items-center h-64 text-slate-400 text-2xl font-semibold">
          No pending orders. Kitchen is clear! ✨
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {orders.map(order => (
            <div key={order.id} className="bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col border-t-8 border-amber-500">
              <div className="bg-amber-50 p-4 border-b border-amber-200 flex justify-between items-center">
                <span className="font-black text-xl text-amber-900">Ticket #{order.id}</span>
                <span className="text-sm font-bold text-amber-700 bg-amber-200 px-3 py-1 rounded-full">
                  {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="p-5 flex-1 space-y-4">
                {order.items.map(item => (
                  <div key={item.id} className="flex items-start gap-4 pb-3 border-b border-gray-100 last:border-0">
                    <div className="bg-slate-100 text-slate-800 font-black text-lg px-3 py-1 rounded-md">{item.quantity}x</div>
                    <div className="font-bold text-gray-800 text-lg pt-1">{item.menu_item ? item.menu_item.name : 'Unknown Item'}</div>
                  </div>
                ))}
              </div>
              <button onClick={() => completeOrder(order.id)} className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xl transition-colors">
                BUMP (Complete)
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default KDS;