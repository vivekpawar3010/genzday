import React from 'react';
import { Sparkles, Settings } from 'lucide-react';

interface ThemeSwitcherProps {
  showDesigner: boolean;
  toggleDesigner: () => void;
  toggleTheme: () => void;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ 
  showDesigner, 
  toggleDesigner, 
  toggleTheme 
}) => {
  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[100] flex flex-col gap-3 sm:gap-4">
      <div className="relative group">
        <button 
          onClick={toggleDesigner}
          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full glass border-white/40 shadow-xl flex items-center justify-center hover:scale-110 transition-all ${showDesigner ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-main)]'}`}
        >
          <Sparkles className="w-4 h-4 sm:w-5 h-5" />
        </button>
        <div className="absolute right-14 sm:right-16 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg glass border-white/20 text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-[var(--text-main)] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-2xl">
          Theme Designer
        </div>
      </div>

      <div className="relative group">
        <button 
          onClick={toggleTheme}
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full glass border-white/40 shadow-xl flex items-center justify-center hover:scale-110 transition-all"
        >
          <Settings className="w-4 h-4 sm:w-5 h-5 text-[var(--text-main)]" />
        </button>
        <div className="absolute right-14 sm:right-16 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg glass border-white/20 text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-[var(--text-main)] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-2xl">
          Toggle Dark Mode
        </div>
      </div>
    </div>
  );
};
