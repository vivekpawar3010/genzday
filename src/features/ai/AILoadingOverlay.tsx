import React from 'react';
import { Sparkles } from 'lucide-react';

interface AILoadingOverlayProps {
  isLoading: boolean;
}

export const AILoadingOverlay: React.FC<AILoadingOverlayProps> = ({ isLoading }) => {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/20 backdrop-blur-md animate-fadeIn">
      <div className="glass p-8 rounded-[2.5rem] flex flex-col items-center gap-6 shadow-2xl border-white/20">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-[var(--accent)]/20 border-t-[var(--accent)] rounded-full animate-spin"></div>
          <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-[var(--accent)] animate-pulse" />
        </div>
        <div className="text-center">
          <p className="text-xs font-black text-[var(--text-main)] uppercase tracking-[0.3em]">AI is Dreaming</p>
          <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest opacity-60 mt-1">Crafting your vision...</p>
        </div>
      </div>
    </div>
  );
};
