import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Admin() {
  const navigate = useNavigate(); // This lets us magically redirect the user
  const [newItem, setNewItem] = useState({
    name: '', description: '', price: '', category: 'Main Course', is_available: true
  });

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
      navigate('/'); // Instantly redirect back to the POS page!
    })
    .catch(err => console.error("Error adding item:", err));
  };

  return (
    <div className="flex-1 p-10 overflow-y-auto flex justify-center items-start w-full">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-2xl border border-gray-100">
        <h2 className="text-3xl font-bold mb-8 text-gray-900">👨‍🍳 Add New Menu Item</h2>
        
        <form onSubmit={handleAddItem} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Item Name</label>
              <input type="text" required value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="e.g. Truffle Fries" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Price ($)</label>
              <input type="number" step="0.01" required value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="0.00" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
            <textarea required value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" rows="3"></textarea>
          </div>

          <div className="grid grid-cols-2 gap-6 items-center">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
              <select value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="Appetizer">Appetizer</option>
                <option value="Main Course">Main Course</option>
                <option value="Dessert">Dessert</option>
                <option value="Drink">Drink</option>
              </select>
            </div>
            <div className="flex items-center mt-6">
              <input type="checkbox" id="available" checked={newItem.is_available} onChange={e => setNewItem({...newItem, is_available: e.target.checked})} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
              <label htmlFor="available" className="ml-3 font-medium text-gray-700 cursor-pointer">Currently in stock</label>
            </div>
          </div>

          <button type="submit" className="w-full py-4 mt-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-lg font-bold shadow-lg transition-colors">
            Save to Database
          </button>
        </form>
      </div>
    </div>
  );
}

export default Admin;