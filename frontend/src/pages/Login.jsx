import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    
    fetch('http://localhost:8000/api/login', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Accept': 'application/json' 
      },
      body: JSON.stringify({ email, password })
    })
    .then(async (res) => {
      if (!res.ok) throw new Error('Invalid credentials');
      return res.json();
    })
    .then(data => { 
      localStorage.setItem('manager_token', data.token);
      navigate('/admin');
    })
    .catch(err => {
      alert("Login failed: " + err.message);
    });
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-slate-900 w-full">
      <div className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-md">
        <h2 className="text-3xl font-black text-gray-800 mb-2 text-center">Manager Login</h2>
        <p className="text-gray-500 text-center mb-8 font-medium">Please enter your credentials.</p>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
            <input 
              type="email" required 
              value={email} onChange={e => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              placeholder="admin@restaurant.com"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
            <input 
              type="password" required 
              value={password} onChange={e => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              placeholder="••••••••"
            />
          </div>
          <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-lg rounded-xl shadow-lg transition-colors">
            Unlock Dashboard
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;