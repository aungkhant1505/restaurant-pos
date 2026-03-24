import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import POS from './pages/POS';
import Admin from './pages/Admin';
import KDS from './pages/KDS';
import Login from './pages/Login';

function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col h-screen bg-gray-50 font-sans text-gray-800">
        
        {/* GLOBAL NAVIGATION BAR */}
        <div className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md z-20">
          <div className="font-bold text-xl tracking-wider">🚀 QUICK-POS</div>
          <div className="flex gap-4">
            {/* React Router Links instead of messy state buttons */}
            <Link to="/" className="px-4 py-2 rounded-lg font-semibold transition bg-slate-800 hover:bg-blue-600 focus:bg-blue-600">
              Terminal
            </Link>
            <Link to="/admin" className="px-4 py-2 rounded-lg font-semibold transition bg-slate-800 hover:bg-emerald-600 focus:bg-emerald-600">
              Manager Dashboard
            </Link>
          </div>
        </div>

        {/* THE ROUTER: Swaps out the page below the navbar based on the URL */}
        <Routes>
          <Route path="/" element={<POS />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/kitchen" element={<KDS />} />
          <Route path="/login" element={<Login />} />
        </Routes>

      </div>
    </BrowserRouter>
  );
}

export default App;