import Echo from 'laravel-echo';
import { useReactToPrint } from 'react-to-print';
import Receipt from '../components/Receipt';
import { useState, useEffect, useRef } from 'react';
import Pusher from 'pusher-js';

window.Pusher = Pusher;
  const echo = new Echo({
    broadcaster: 'pusher',
    key: '9fea525a282271c221b1',
    cluster: 'ap1', 
    forceTLS: true
})

function POS() {
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [lastOrder, setLastOrder] = useState(null);
  const contentRef = useRef(null);
  const handlePrint = useReactToPrint({ contentRef });
  
  // 🚀 NEW SECURITY STATES
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [waiterName, setWaiterName] = useState('');

  useEffect(() => {
    // Fetch menu
    fetch('http://localhost:8000/api/menu')
      .then(res => res.json())
      .then(data => setMenuItems(data))
      .catch(err => console.error("Error:", err));

    // Listen for kitchen bumps
    const channel = echo.channel('pos');
    channel.listen('.order-ready', (data) => {
      alert(`🔔 ORDER UP! Ticket #${data.orderId} is ready to serve!`);
    });

    return () => channel.stopListening('.order-ready');
  }, []);

  // 🚀 HANDLE PIN VERIFICATION
  const handlePinSubmit = () => {
    fetch('http://localhost:8000/api/pos/pin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ pin })
    })
    .then(async res => {
      if (!res.ok) throw new Error("Invalid PIN Code");
      return res.json();
    })
    .then(data => {
      setWaiterName(data.user);
      setIsUnlocked(true);
      setPin(''); // Clear PIN for security
    })
    .catch(err => {
      alert(err.message);
      setPin(''); // Clear wrong PIN
    });
  };

  const addToCart = (item) => {
    const existing = cart.find(c => c.id === item.id);
    if (existing) {
      setCart(cart.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const removeFromCart = (itemId) => {
    const existing = cart.find(c => c.id === itemId);

    if (existing.quantity > 1) {
      setCart(cart.map(c => c.id === itemId ? { ...c, quantity: c.quantity - 1 } : c));
    } else {
      setCart(cart.filter(c => c.id !== itemId));
    }
  }

  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

  const submitOrder = () => {
    fetch('http://localhost:8000/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ total_price: cartTotal, items: cart })
    })
    .then(res => res.json())
    .then(data => {
      console.log( "Order submitted:", data );
      setLastOrder({
        id: data.order_id,
        waiter: waiterName,
        items: [...cart],
        total: cartTotal,
        date: new Date().toLocaleString()
      })
      setCart([]);
    })
    .catch(err => console.error("Checkout error:", err));
  };

  // 🚀 THE LOCK SCREEN
  if (!isUnlocked) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-900 w-full">
        <div className="bg-slate-800 p-8 rounded-3xl shadow-2xl flex flex-col items-center border border-slate-700">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-2xl font-black text-white mb-2">Terminal Locked</h2>
          <p className="text-slate-400 mb-8 font-medium">Enter Waiter PIN to clock in</p>
          
          <div className="flex gap-4 mb-8">
            {/* Visual PIN dots */}
            {[0, 1, 2, 3].map(index => (
              <div key={index} className={`w-5 h-5 rounded-full ${pin.length > index ? 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-slate-700'}`} />
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button key={num} onClick={() => setPin(pin.length < 4 ? pin + num : pin)} className="w-20 h-20 bg-slate-700 hover:bg-slate-600 rounded-full text-3xl text-white font-bold transition-colors">
                {num}
              </button>
            ))}
            <button onClick={() => setPin('')} className="w-20 h-20 bg-slate-800 hover:bg-red-500/20 text-red-400 rounded-full text-xl font-bold transition-colors border border-slate-700">CLR</button>
            <button onClick={() => setPin(pin.length < 4 ? pin + '0' : pin)} className="w-20 h-20 bg-slate-700 hover:bg-slate-600 rounded-full text-3xl text-white font-bold transition-colors">0</button>
            <button onClick={handlePinSubmit} disabled={pin.length < 4} className={`w-20 h-20 rounded-full text-xl font-bold transition-colors border border-slate-700 ${pin.length === 4 ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-slate-800 text-slate-500'}`}>GO</button>
          </div>
        </div>
      </div>
    );
  }

  // 🚀 THE UNLOCKED POS (Original POS Code)
  return (
    <div className="flex flex-col flex-1 overflow-hidden w-full">
      {/* Top Bar showing who is logged in */}
      <div className="bg-slate-800 text-white px-6 py-3 flex justify-between items-center">
        <div className="font-bold">Logged in as: <span className="text-blue-400">{waiterName}</span></div>
        <button onClick={() => { setIsUnlocked(false); setCart([]); }} className="px-4 py-1 bg-slate-700 hover:bg-red-500 rounded-lg text-sm font-bold transition-colors">
          Lock Terminal
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden w-full">
        {/* LEFT SIDE: MENU GRID */}
        <div className="flex-[2] p-8 overflow-y-auto bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {menuItems.map(item => (
              <div key={item.id} onClick={() => addToCart(item)} className="bg-white p-5 rounded-xl shadow-sm hover:shadow-md border-2 border-transparent hover:border-blue-500 cursor-pointer transition-all duration-200 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-lg mb-1">{item.name}</h3>
                  <p className="text-sm text-gray-500 mb-3 uppercase tracking-wider">{item.category}</p>
                </div>
                <span className="font-extrabold text-xl text-emerald-600">${item.price}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT SIDE: TICKET */}
        <div className="flex-[1] bg-white border-l border-gray-200 p-8 flex flex-col shadow-xl z-10">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">🧾 Current Order</h2>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {cart.length === 0 ? (
               <p className="text-gray-400 text-center mt-10 italic">Ticket is empty.</p>
            ) : (
              cart.map((cartItem, index) => (
                <div key={index} className="flex justify-between items-center pb-4 border-b border-dashed border-gray-200">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800">{cartItem.name}</div>
                    <div className="text-sm text-gray-500 font-medium">Qty: {cartItem.quantity}</div>
                  </div>
                  
                  {/* The Price and New Remove Button */}
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-gray-900 w-16 text-right">
                      ${(cartItem.price * cartItem.quantity).toFixed(2)}
                    </span>
                    <button 
                      onClick={() => removeFromCart(cartItem.id)} 
                      className="w-8 h-8 flex items-center justify-center bg-red-100 text-red-600 hover:bg-red-500 hover:text-white rounded-full transition-colors font-bold text-xl pb-1"
                      title="Remove one"
                    >
                      −
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="pt-6 border-t-2 border-gray-100 mt-4">
            <div className="flex justify-between items-center text-2xl font-black mb-6">
              <span>Total:</span><span className="text-blue-600">${cartTotal.toFixed(2)}</span>
            </div>
            <button onClick={submitOrder} disabled={cart.length === 0} className={`w-full py-4 rounded-xl text-lg font-bold text-white transition-colors ${cart.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-lg'}`}>
              Send to Kitchen
            </button>
          </div>
        </div>
      </div>

      {/* 🚀 RECEIPT MODAL */}
      {lastOrder && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-100 p-6 rounded-3xl shadow-2xl flex flex-col items-center max-w-md w-full border border-slate-300">
            <h2 className="text-3xl font-black mb-6 text-slate-800">Order Sent! 🚀</h2>

            {/* Hidden wrapper that holds the actual thermal receipt */}
            <div className="bg-white border-2 border-slate-200 shadow-inner max-h-[50vh] overflow-y-auto mb-8 w-full flex justify-center py-4 rounded-xl">
               <Receipt ref={contentRef} order={lastOrder} />
            </div>

            <div className="flex gap-4 w-full">
              <button onClick={() => setLastOrder(null)} className="flex-1 py-4 bg-slate-300 hover:bg-slate-400 text-slate-800 font-bold text-lg rounded-xl transition-colors">
                New Order
              </button>
              <button onClick={handlePrint} className="flex-[2] py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-lg rounded-xl transition-colors shadow-lg shadow-blue-500/30">
                🖨️ Print / Save PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default POS;