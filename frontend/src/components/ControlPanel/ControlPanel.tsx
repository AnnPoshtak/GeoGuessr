import { useState } from 'react';
import { User, ChevronDown, LogOut, LogIn } from 'lucide-react';
import { useUser } from '@/context/UserContext.tsx';
import VolumeControl from '../VolumeControl/VolumeControl';
import { useNavigate } from 'react-router-dom';

export const Dropdown = () => {
  const { user, logout } = useUser();
  const [isOpen, setIsOpen] = useState(false);

  const navigate = useNavigate();

  const toggleDropdown = () => setIsOpen((prev: boolean) => !prev);

  const handleLogin = () => navigate('/auth/login');

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
  };

  if (user === undefined) {
    return <div className="text-white/40 text-xs font-medium tracking-widest uppercase">Loading...</div>;
  }

  return (
    <div className="relative z-50 inline-flex max-w-[calc(100vw-1.5rem)] font-sans text-white">
      
      <button 
        onClick={toggleDropdown}
        className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl border transition-all duration-200 text-xs font-semibold tracking-wider uppercase backdrop-blur-md shadow-lg
          ${isOpen 
            ? 'border-white/30 bg-white/20' 
            : 'border-white/15 bg-white/5 hover:bg-white/12 hover:border-white/25'
          }`}
      >
        <User size={16} className="stroke-[2.5]" />
        <span>{user ? 'Account' : 'Sign In'}</span>
        <ChevronDown 
          size={14} 
          className={`stroke-[2.5] transition-transform duration-200 opacity-70 
            ${isOpen ? 'rotate-180' : 'rotate-0'}`} 
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-[min(88vw,16rem)] p-4 sm:p-5 rounded-2xl border border-white/10 bg-slate-900/95 backdrop-blur-xl shadow-2xl z-50 text-left animate-in fade-in zoom-in-95 duration-150">
          {user ? (
            <div>
              <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">
                Signed in as
              </div>
              <div className="text-sm font-medium text-cyan-400 break-all tracking-wide mb-4">
                {user.username}
              </div>
              
              <div className="h-[1px] bg-white/10 my-3" />
              
              <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">
                Music settings
              </div>
              <VolumeControl />

              <div className="h-[1px] bg-white/10 my-3" />

              <button 
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 w-full p-2.5 text-xs font-semibold tracking-wider uppercase text-red-400 border border-red-500/20 bg-red-500/5 rounded-lg cursor-pointer transition-all duration-200 hover:bg-red-500/15 hover:border-red-500/40"
              >
                <LogOut size={14} className="stroke-[2.5]" />
                Sign Out
              </button>
            </div>
          ) : (
            <div>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Sign in to save your game progress and track scores.
              </p>
              <button 
                onClick={handleLogin}
                className="flex items-center justify-center gap-2.5 w-full p-3 text-xs font-bold tracking-wider uppercase text-white bg-blue-600 rounded-lg cursor-pointer shadow-lg shadow-blue-600/25 transition-all duration-200 hover:bg-blue-700 active:scale-[0.98]"
              >
                <LogIn size={14} className="stroke-[2.5]" />
                Log In with Google
              </button>

              <div className="h-[1px] bg-white/10 my-3" />
              
              <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">
                Music settings
              </div>
              <VolumeControl />
            </div>
          )}
        </div>
      )}
    </div>
  );
};