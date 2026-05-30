import { Link, useLocation } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  const personaBadgeColors = {
    Investor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    Researcher: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    Student: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    Founder: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    Generalist: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  };

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#0f111a]/80 border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-4 flex justify-between items-center transition-all">
        
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-600 to-indigo-500 flex items-center justify-center text-white font-bold shadow-lg shadow-brand-500/30 group-hover:scale-105 transition-transform duration-300">
            N
          </div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            Nutino
          </h1>
        </Link>

        <div className="flex items-center gap-4">
          {/* Nav links */}
          <div className="flex space-x-1 lg:space-x-3 bg-white/5 p-1 rounded-2xl border border-white/5">
            <Link 
              to="/" 
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                location.pathname === '/' 
                  ? 'bg-white/10 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Feed
            </Link>
            <Link 
              to="/summaries" 
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                location.pathname === '/summaries' 
                  ? 'bg-white/10 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Library
            </Link>
          </div>

          {/* User Menu */}
          {user && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shadow-md">
                  {initials}
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${menuOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown */}
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-[#1e1b4b]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* User info */}
                  <div className="px-5 py-4 border-b border-white/10">
                    <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{user.email}</p>
                    {user.profile?.persona && (
                      <span className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${personaBadgeColors[user.profile.persona] || personaBadgeColors.Generalist}`}>
                        {user.profile.persona}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="p-2">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors duration-200"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
