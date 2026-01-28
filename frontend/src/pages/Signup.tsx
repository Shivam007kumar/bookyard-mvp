import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';

// The "export default" keywords are crucial here!
export default function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: '', email: '', password: '', unit_no: '', whatsapp_no: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/auth/signup', formData);
      alert('Account created! Please login.');
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Signup failed');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded shadow-lg bg-white">
      <h2 className="text-2xl font-bold mb-4">Join BookYard</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <input 
          placeholder="Full Name" 
          className="w-full p-2 border rounded"
          onChange={e => setFormData({...formData, full_name: e.target.value})}
        />
        <input 
          placeholder="Email" 
          type="email"
          className="w-full p-2 border rounded"
          onChange={e => setFormData({...formData, email: e.target.value})}
        />
        <input 
          placeholder="Apartment / Unit No" 
          className="w-full p-2 border rounded"
          onChange={e => setFormData({...formData, unit_no: e.target.value})}
        />
        <input 
          placeholder="WhatsApp Number" 
          className="w-full p-2 border rounded"
          onChange={e => setFormData({...formData, whatsapp_no: e.target.value})}
        />
        <input 
          placeholder="Password" 
          type="password"
          className="w-full p-2 border rounded"
          onChange={e => setFormData({...formData, password: e.target.value})}
        />
        <button className="w-full bg-slate-900 text-white p-2 rounded hover:bg-slate-800">
          Create Account (+3 Credits)
        </button>
      </form>
    </div>
  );
}