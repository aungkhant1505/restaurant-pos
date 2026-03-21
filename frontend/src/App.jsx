import { useState, useEffect } from 'react';

function App() {
  const [menuItems, setMenuItems] = useState([]);
  
  // 1. New State: The Cart
  const [cart, setCart] = useState([]);

  // Fetch the menu data from Laravel
  useEffect(() => {
    fetch('http://localhost:8000/api/menu')
      .then(response => response.json())
      .then(data => setMenuItems(data))
      .catch(error => console.error("Error fetching menu:", error));
  }, []);

  // 2. The Logic: Adding to the Cart
  const addToCart = (item) => {
    // Check if the item is already in the cart
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    
    if (existingItem) {
      // If it exists, just increase the quantity by 1
      setCart(cart.map(cartItem => 
        cartItem.id === item.id 
          ? { ...cartItem, quantity: cartItem.quantity + 1 } 
          : cartItem
      ));
    } else {
      // If it's new, add it to the cart array with a quantity of 1
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  // 3. The Math: Calculating the Total
  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

  // 4. The Checkout Logic
  const submitOrder = () => {
    fetch('http://localhost:8000/api/orders', {
      method: 'POST', // We are SENDING data, not getting it!
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        total_price: cartTotal,
        items: cart // We package up the entire cart array
      })
    })
    .then(response => response.json())
    .then(data => {
      alert(data.message); // Show the success message from Laravel
      setCart([]); // Instantly clear the ticket for the next customer!
    })
    .catch(error => console.error("Checkout error:", error));
  };

  // 4. The UI Layout
  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'system-ui, sans-serif', margin: 0 }}>
      
      {/* LEFT SIDE: The Menu Grid */}
      <div style={{ flex: 2, padding: '2rem', overflowY: 'auto', backgroundColor: '#f9fafb' }}>
        <h1 style={{ marginTop: 0 }}>🍽️ Menu</h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '15px' }}>
          
          {menuItems.map(item => (
            <div 
              key={item.id} 
              onClick={() => addToCart(item)} // <-- The Magic Click!
              style={{ 
                backgroundColor: 'white', 
                padding: '1.5rem', 
                borderRadius: '10px', 
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                cursor: 'pointer', // Makes it look clickable
                transition: 'transform 0.1s',
                border: '2px solid transparent'
              }}
              onMouseOver={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
              onMouseOut={(e) => e.currentTarget.style.borderColor = 'transparent'}
            >
              <h3 style={{ margin: '0 0 5px 0' }}>{item.name}</h3>
              <p style={{ color: '#6b7280', fontSize: '0.8rem', margin: '0 0 10px 0' }}>{item.category}</p>
              <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#10b981' }}>
                ${item.price}
              </span>
            </div>
          ))}

        </div>
      </div>

      {/* RIGHT SIDE: The Order Ticket */}
      <div style={{ flex: 1, padding: '2rem', backgroundColor: 'white', borderLeft: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ marginTop: 0 }}>🧾 Current Order</h2>
        
        {/* The Cart Items */}
        <div style={{ flex: 1, overflowY: 'auto', marginTop: '10px' }}>
          {cart.length === 0 ? (
            <p style={{ color: '#9ca3af', textAlign: 'center', marginTop: '2rem' }}>Ticket is empty. Click items to add.</p>
          ) : (
            cart.map((cartItem, index) => (
              <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px dashed #e5e7eb' }}>
                <div>
                  <span style={{ fontWeight: 'bold' }}>{cartItem.name}</span>
                  <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>Qty: {cartItem.quantity}</div>
                </div>
                <span style={{ fontWeight: 'bold' }}>
                  ${(cartItem.price * cartItem.quantity).toFixed(2)}
                </span>
              </div>
            ))
          )}
        </div>

        {/* The Total & Checkout Button */}
        <div style={{ borderTop: '2px solid #e5e7eb', paddingTop: '15px', marginTop: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '20px' }}>
            <span>Total:</span>
            <span>${cartTotal.toFixed(2)}</span>
          </div>
          
          <button 
            onClick={submitOrder}
            disabled={cart.length === 0}
            style={{ 
              width: '100%', 
              padding: '15px', 
              backgroundColor: cart.length === 0 ? '#d1d5db' : '#3b82f6', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              cursor: cart.length === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            Send to Kitchen
          </button>
        </div>
      </div>

    </div>
  );
}

export default App;