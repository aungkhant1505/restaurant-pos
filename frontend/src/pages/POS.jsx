import { useState, useEffect } from 'react';

function POS() {
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    fetch('http://localhost:8000/api/menu')
      .then(res => res.json())
      .then(data => setMenuItems(data))
      .catch(err => console.error("Error:", err));
  }, []);

  const addToCart = (item) => {
    const existing = cart.find(c => c.id === item.id);
    if (existing) {
      setCart(cart.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

  const submitOrder = () => {
    fetch('http://localhost:8000/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ total_price: cartTotal, items: cart })
    })
    .then(res => res.json())
    .then(data => {
      alert(data.message);
      setCart([]);
    })
    .catch(err => console.error("Checkout error:", err));
  };

  return (
    <div className="flex flex-1 overflow-hidden w-full">
      <div className="flex-[2] p-8 overflow-y-auto">
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

      <div className="flex-[1] bg-white border-l border-gray-200 p-8 flex flex-col shadow-xl z-10">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">🧾 Current Order</h2>
        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
          {cart.length === 0 ? (
             <p className="text-gray-400 text-center mt-10 italic">Ticket is empty.</p>
          ) : (
            cart.map((cartItem, index) => (
              <div key={index} className="flex justify-between items-center pb-4 border-b border-dashed border-gray-200">
                <div>
                  <div className="font-semibold text-gray-800">{cartItem.name}</div>
                  <div className="text-sm text-gray-500">Qty: {cartItem.quantity}</div>
                </div>
                <span className="font-bold text-gray-900">${(cartItem.price * cartItem.quantity).toFixed(2)}</span>
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
  );
}

export default POS;