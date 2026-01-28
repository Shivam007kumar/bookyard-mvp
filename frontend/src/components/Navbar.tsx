import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { BookOpen, LogOut, LayoutDashboard, User, PlusCircle } from 'lucide-react'; // Icons
import api from '@/lib/api';

export default function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    if (token) {
      api.get('/users/me')
        .then(res => setCredits(res.data.credits))
        .catch(() => handleLogout());
    }
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
    window.location.reload();
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 text-xl font-bold text-slate-900 hover:opacity-80 transition">
          <div className="bg-indigo-600 text-white p-1.5 rounded-lg">
            <BookOpen size={20} />
          </div>
          <span className="hidden sm:inline">BookYard</span>
        </Link>
        
        <div className="flex items-center gap-4">
          {token ? (
            <>
              {/* Credit Badge */}
              <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full text-sm font-semibold border border-indigo-100">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                {credits !== null ? credits : '-'} Credits
              </div>

              {/* Navigation Links */}
              <Link to="/dashboard" className="hidden sm:flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition">
                <LayoutDashboard size={18} />
                Dashboard
              </Link>

              <button 
                onClick={handleLogout} 
                className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-red-600 transition ml-2"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <div className="flex gap-3">
              <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2">Login</Link>
              <Link to="/signup" className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition shadow-sm">
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}