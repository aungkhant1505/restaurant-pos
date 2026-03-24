import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Admin() {
  const navigate = useNavigate();
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
            
            // 👉 COMMENT OUT THESE TWO LINES SO WE DON'T GET KICKED OUT:
            // localStorage.removeItem('manager_token'); 
            // navigate('/login');
            
            throw new Error("401 Unauthorized - Invalid Token");
          }
          const errorText = await res.text();
          throw new Error(`Backend Crash (${res.status}): ${errorText}`);
        }
        return res.json();
      })
      .then(data => setAnalytics(data))
      .catch(err => console.error("Analytics Error:", err.message));
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
    <div className="flex-1 p-10 bg-gray-50 overflow-y-auto flex flex-col items-center gap-10 w-full">
      
      {/* 🚀 NEW ANALYTICS SECTION */}
      {analytics && (
        <div className="w-full max-w-5xl">
          <h2 className="text-3xl font-black text-gray-800 mb-6">📈 Business Overview</h2>
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
                ) : (
                  <p className="text-sm italic opacity-80">No sales yet.</p>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      <div className="w-full max-w-5xl border-t-2 border-gray-200 my-4"></div>

      <div className="flex flex-col lg:flex-row gap-10 w-full max-w-5xl">
        {/* ADD ITEM FORM (Unchanged, just repositioned to be side-by-side on large screens) */}
        <div className="bg-white p-8 rounded-2xl shadow-xl flex-1 border border-gray-100">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">👨‍🍳 Add New Menu Item</h2>
          <form onSubmit={handleAddItem} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Item Name</label>
              <input type="text" required value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Price ($)</label>
              <input type="number" step="0.01" required value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
              <select value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="Appetizer">Appetizer</option>
                <option value="Main Course">Main Course</option>
                <option value="Dessert">Dessert</option>
                <option value="Drink">Drink</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
              <textarea required value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" rows="2"></textarea>
            </div>
            <button type="submit" className="w-full py-3 mt-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md transition-colors">
              Save to Menu
            </button>
          </form>
        </div>

        {/* MANAGE EXISTING ITEMS LIST */}
        <div className="bg-white p-8 rounded-2xl shadow-xl flex-1 border border-gray-100 flex flex-col max-h-[600px]">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">🗑️ Manage Menu</h2>
          <div className="space-y-3 overflow-y-auto pr-2">
            {menuItems.map(item => (
              <div key={item.id} className="flex justify-between items-center p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                <div>
                  <h4 className="font-bold text-md text-gray-800">{item.name}</h4>
                  <p className="text-xs text-gray-500 font-medium">${item.price}</p>
                </div>
                <button onClick={() => handleDelete(item.id)} className="px-3 py-1 bg-red-100 text-red-600 hover:bg-red-600 hover:text-white text-sm font-bold rounded-lg transition-colors">
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
  
}

export default Admin;