import { useEffect, useState } from "react";
import Pusher from "pusher-js";
import Echo from "laravel-echo";

window.Pusher = Pusher;
const echo = new Echo({
  broadcaster: 'pusher',
  key: '9fea525a282271c221b1',
  cluster: 'ap1', 
  forceTLS: true
});

function KDS() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchOrders();

    const channel = echo.channel("kitchen");
    
    // Listen for brand new tickets
    channel.listen(".new-order", () => {
      fetchOrders();
    });

    // Listen for items being crossed off by other chefs
    channel.listen(".order-updated", () => {
      fetchOrders();
    });

    channel.listen('.order-ready', () => {
      fetchOrders();
    })

    return () => {
      channel.stopListening(".new-order"); 
      channel.stopListening(".order-updated");
      channel.stopListening('.order-ready');
    }
  }, []);

  const fetchOrders = () => {
    fetch('http://localhost:8000/api/orders')
      .then(response => response.json())
      .then(data => setOrders(data))
      .catch(error => console.error('Error fetching orders:', error));
  }

  // 🚀 NEW: Bump a single item!
  const completeItem = (itemId) => {
    fetch(`http://localhost:8000/api/order-items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    })
    .then(() => fetchOrders()) // Re-fetch to immediately see the strike-through
    .catch(error => console.error('Error completing item:', error));
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
                  // If the item is completed, fade it out and add a line-through!
                  <div key={item.id} className={`flex items-center justify-between pb-3 border-b border-gray-100 last:border-0 transition-all ${item.status === 'completed' ? 'opacity-30 grayscale' : ''}`}>
                    
                    <div className={`flex items-start gap-4 ${item.status === 'completed' ? 'line-through' : ''}`}>
                      <div className="bg-slate-100 text-slate-800 font-black text-lg px-3 py-1 rounded-md">{item.quantity}x</div>
                      <div className="font-bold text-gray-800 text-lg pt-1">{item.menu_item ? item.menu_item.name : 'Unknown Item'}</div>
                    </div>

                    {/* Only show the Bump button if the item is still pending */}
                    {item.status !== 'completed' && (
                      <button 
                        onClick={() => completeItem(item.id)} 
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg transition-colors shadow-sm"
                      >
                        Bump
                      </button>
                    )}

                  </div>
                ))}
              </div>
              {/* Note: The giant BUMP button is gone! */}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default KDS;