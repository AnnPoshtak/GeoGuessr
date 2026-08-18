import { UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/context/UserContext.tsx';

export const Dropdown = () => {
  const { user, login } = useUser();
  const navigate = useNavigate();

  if (user === undefined) {
    return <div className="text-muted/40 text-xs font-semibold tracking-wider select-none">Loading...</div>;
  }

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const handleLoginClick = () => {
    login();
  };

  return (
    <div className="inline-flex font-sans text-dark">
      {user ? (
        <button onClick={handleProfileClick} className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-all duration-200 text-sm font-bold tracking-wide select-none hover:bg-white/30 dark:hover:bg-black/20 active:scale-[0.98] group">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm shadow-sm group-hover:bg-primary-hover transition-colors">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <span className="text-muted group-hover:text-primary dark:group-hover:text-accent transition-colors">
            {user.username}
          </span>
        </button>
      ) : (
        <button 
          onClick={handleLoginClick}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white transition-all duration-150 text-xs font-bold tracking-wide uppercase shadow-sm shadow-primary/20 hover:bg-primary-hover active:scale-[0.98]"
        >
          <UserRound size={16} className="stroke-[2.5]" />
          <span>Sign in</span>
        </button>
      )}
    </div>
  );
};