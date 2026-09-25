import React from 'react';
import { Sparkles, Settings, User, LogIn } from 'lucide-react';
import { UserProfile } from '../../types/index';

interface ThemeSwitcherProps {
  showDesigner: boolean;
  toggleDesigner: () => void;
  toggleTheme: () => void;
  user: UserProfile | null;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ 
  showDesigner, 
  toggleDesigner, 
  toggleTheme,
  user,
  onOpenAuth,
  onOpenProfile
}) => {
  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[100] flex flex-col gap-3 sm:gap-4">
      {/* User Login / Google Profile Avatar */}
      <div className="relative group">
        <button 
          onClick={user ? onOpenProfile : onOpenAuth}
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full glass border-white/40 shadow-xl flex items-center justify-center hover:scale-110 transition-all overflow-hidden relative"
        >
          {user ? (
            <>
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[var(--accent)] text-white flex items-center justify-center font-black text-xs sm:text-sm">
                  {(user.displayName?.charAt(0) || user.email?.charAt(0) || 'U').toUpperCase()}
                </div>
              )}
              {/* Active Status Dot */}
              <span className={`absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[var(--card-bg)] ${user.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            </>
          ) : (
            <User className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--text-main)]" />
          )}
        </button>
        <div className="absolute right-14 sm:right-16 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded glass border-white/20 text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-[var(--text-main)] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-2xl">
          {user ? user.displayName || 'Profile' : 'Sign In / Cloud Sync'}
        </div>
      </div>

      {/* Theme Designer Trigger */}
      <div className="relative group">
        <button 
          onClick={toggleDesigner}
          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full glass border-white/40 shadow-xl flex items-center justify-center hover:scale-110 transition-all ${showDesigner ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-main)]'}`}
        >
          <Sparkles className="w-4 h-4 sm:w-5 h-5" />
        </button>
        <div className="absolute right-14 sm:right-16 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded glass border-white/20 text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-[var(--text-main)] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-2xl">
          Theme Designer
        </div>
      </div>

      {/* Settings / Palette Toggle */}
      <div className="relative group">
        <button 
          onClick={toggleTheme}
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full glass border-white/40 shadow-xl flex items-center justify-center hover:scale-110 transition-all"
        >
          <Settings className="w-4 h-4 sm:w-5 h-5 text-[var(--text-main)]" />
        </button>
        <div className="absolute right-14 sm:right-16 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded glass border-white/20 text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-[var(--text-main)] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-2xl">
          Toggle Dark Mode
        </div>
      </div>
    </div>
  );
};
