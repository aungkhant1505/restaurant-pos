import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Admin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [history, setHistory] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [newItem, setNewItem] = useState({
    name: '', description: '', price: '', category: 'Main Course', is_available: true
  });

  useEffect(() => {
    const token = localStorage.getItem('manager_token');
    
    if (!token) {
      navigate('/login');
      return;
    }

    const headers = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // Fetch Menu Items
    fetch('http://localhost:8000/api/menu', { headers })
      .then(async res => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then(data => setMenuItems(data))
      .catch(err => console.error("Menu fetch failed:", err));

    // Fetch Analytics Data
    // Fetch Analytics Data
    fetch('http://localhost:8000/api/analytics', { headers })
      .then(async res => {
        if (!res.ok) {
          if (res.status === 401) {
            console.error("🚨 THE BOUNCER REJECTED THIS EXACT TOKEN:", token);
            
            throw new Error("401 Unauthorized - Invalid Token");
          }
          const errorText = await res.text();
          throw new Error(`Backend Crash (${res.status}): ${errorText}`);
        }
        return res.json();
      })
      .then(data => setAnalytics(data))
      .catch(err => console.error("Analytics Error:", err.message));

      fetch('http://localhost:8000/api/history', { headers })
        .then(res => res.json())
        .then(data => setHistory(data))
        .catch(err => console.error("History fetch failed:", err));
  }, [navigate]);

  const handleAddItem = (e) => {
    e.preventDefault();
    
    fetch('http://localhost:8000/api/menu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(newItem)
    })
    .then(res => res.json())
    .then(data => {
      alert(data.message);
      setMenuItems([...menuItems, data.item]);
      setNewItem({ name: '', description: '', price: '', category: 'Main Course', is_available: true });
    })
    .catch(err => console.error("Error adding item:", err));
  };

  const handleDelete = ($id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;

    fetch(`http://localhost:8000/api/menu/${$id}`, {
      method: 'DELETE',
      headers: { 'Accept': 'application/json' }
    })
    .then(res => res.json())
    .then(data => {
      setMenuItems(menuItems.filter(item => item.id !== $id));
    })
    .catch(err => console.error("Error deleting item:", err));
  }

  return (
    <div className="flex-1 bg-gray-50 flex flex-col h-screen overflow-hidden w-full">
      
      {/* 🚀 NEW: TOP NAVIGATION TABS */}
      <div className="bg-white border-b border-gray-200 px-10 py-4 flex gap-4 shadow-sm z-10">
        <button onClick={() => setActiveTab('overview')} className={`px-6 py-3 rounded-xl font-bold text-lg transition-all ${activeTab === 'overview' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
          📈 Overview
        </button>
        <button onClick={() => setActiveTab('history')} className={`px-6 py-3 rounded-xl font-bold text-lg transition-all ${activeTab === 'history' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
          🕒 Today's History
        </button>
        <button onClick={() => setActiveTab('menu')} className={`px-6 py-3 rounded-xl font-bold text-lg transition-all ${activeTab === 'menu' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
          🍔 Manage Menu
        </button>
        
        <div className="ml-auto">
          <button onClick={() => { localStorage.removeItem('manager_token'); navigate('/login'); }} className="px-6 py-3 rounded-xl font-bold text-lg bg-red-100 text-red-600 hover:bg-red-600 hover:text-white transition-all">
            Logout
          </button>
        </div>
      </div>

      {/* SCROLLABLE CONTENT AREA */}
      <div className="flex-1 overflow-y-auto p-10 flex flex-col items-center">
        
        {/* TAB 1: OVERVIEW (ANALYTICS) */}
        {activeTab === 'overview' && analytics && (
          <div className="w-full max-w-5xl animate-fade-in">
            <h2 className="text-3xl font-black text-gray-800 mb-6">Business Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-2xl shadow-lg text-white">
                <h3 className="text-blue-100 font-semibold mb-1">Total Revenue</h3>
                <p className="text-4xl font-black">${parseFloat(analytics.total_revenue).toFixed(2)}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-600 to-purple-800 p-6 rounded-2xl shadow-lg text-white">
                <h3 className="text-purple-100 font-semibold mb-1">Completed Orders</h3>
                <p className="text-4xl font-black">{analytics.total_orders}</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 p-6 rounded-2xl shadow-lg text-white">
                <h3 className="text-emerald-100 font-semibold mb-3">Top Sellers</h3>
                <div className="space-y-2">
                  {analytics.best_sellers.length > 0 ? (
                    analytics.best_sellers.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm font-medium border-b border-emerald-500/50 pb-1">
                        <span>{index + 1}. {item.name}</span>
                        <span className="bg-emerald-900/50 px-2 rounded">{item.total_sold} sold</span>
                      </div>
                    ))
                  ) : (<p className="text-sm italic opacity-80">No sales yet.</p>)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 🚀 TAB 2: TODAY'S HISTORY */}
        {activeTab === 'history' && (
          <div className="w-full max-w-5xl animate-fade-in">
             <h2 className="text-3xl font-black text-gray-800 mb-6">Today's Completed Tickets</h2>
             {history.length === 0 ? (
                <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-100 text-center text-gray-500 font-medium text-lg">
                  No orders have been completed today yet.
                </div>
             ) : (
                <div className="space-y-6">
                  {history.map(order => (
                    <div key={order.id} className="bg-white p-6 rounded-2xl shadow-md border-l-8 border-emerald-500">
                      <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-4">
                        <div>
                          <span className="text-xl font-black text-gray-800 mr-4">Order #{order.id}</span>
                          <span className="text-sm font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">Completed</span>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-black text-emerald-600">${order.total_price}</div>
                          <div className="text-sm text-gray-400 font-medium">
                            {new Date(order.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                      
                      {/* Show the items inside the order */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {order.items.map(item => (
                           <div key={item.id} className="flex justify-between text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                             <span><span className="font-bold text-gray-800">{item.quantity}x</span> {item.menu_item ? item.menu_item.name : 'Unknown Item'}</span>
                             <span>${item.price}</span>
                           </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
             )}
          </div>
        )}

        {/* TAB 3: MANAGE MENU (Original Layout) */}
        {activeTab === 'menu' && (
          <div className="flex flex-col lg:flex-row gap-10 w-full max-w-5xl animate-fade-in">
            <div className="bg-white p-8 rounded-2xl shadow-xl flex-1 border border-gray-100">
              <h2 className="text-2xl font-bold mb-6 text-gray-900">👨‍🍳 Add New Menu Item</h2>
              <form onSubmit={handleAddItem} className="space-y-5">
                <div><label className="block text-sm font-semibold text-gray-700 mb-1">Item Name</label><input type="text" required value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-1">Price ($)</label><input type="number" step="0.01" required value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                  <select value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="Appetizer">Appetizer</option>
                    <option value="Main Course">Main Course</option>
                    <option value="Dessert">Dessert</option>
                    <option value="Drink">Drink</option>
                  </select>
                </div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-1">Description</label><textarea required value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" rows="2"></textarea></div>
                <button type="submit" className="w-full py-3 mt-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md transition-colors">Save to Menu</button>
              </form>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-xl flex-1 border border-gray-100 flex flex-col max-h-[600px]">
              <h2 className="text-2xl font-bold mb-6 text-gray-900">🗑️ Manage Menu</h2>
              <div className="space-y-3 overflow-y-auto pr-2">
                {menuItems.map(item => (
                  <div key={item.id} className="flex justify-between items-center p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                    <div><h4 className="font-bold text-md text-gray-800">{item.name}</h4><p className="text-xs text-gray-500 font-medium">${item.price}</p></div>
                    <button onClick={() => handleDelete(item.id)} className="px-3 py-1 bg-red-100 text-red-600 hover:bg-red-600 hover:text-white text-sm font-bold rounded-lg transition-colors">Delete</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
  
}

export default Admin;