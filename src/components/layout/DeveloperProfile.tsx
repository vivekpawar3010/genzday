import React from 'react';
import { Github, Globe, Linkedin } from 'lucide-react';
import { Logo } from '../common/Logo';
import { motion } from 'motion/react';

interface DeveloperProfileProps {
  isProfilePinned: boolean;
  setIsProfilePinned: (pinned: boolean) => void;
}

export const DeveloperProfile: React.FC<DeveloperProfileProps> = ({ 
  isProfilePinned, 
  setIsProfilePinned 
}) => {
  return (
    <motion.div 
      initial={{ x: 50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="absolute sm:fixed top-6 right-6 z-[100] flex items-center gap-4"
    >
      <div className="relative group">
        <div 
          onClick={() => setIsProfilePinned(!isProfilePinned)}
          className={`glass p-1.5 sm:p-2 sm:pr-6 rounded-full flex items-center gap-2 sm:gap-3 border-white/30 backdrop-blur-3xl shadow-2xl hover:bg-white/10 transition-all cursor-pointer ${isProfilePinned ? 'ring-2 ring-[var(--accent)]' : ''}`}
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 border-[var(--accent)] shadow-lg flex items-center justify-center bg-[#111] flame-effect">
            <Logo className="w-full h-full" />
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-[8px] sm:text-[10px] font-black text-[var(--text-main)] uppercase tracking-widest text-flame">Vivek Pawar</span>
            <span className="text-[7px] sm:text-[8px] font-bold text-[var(--text-muted)] opacity-60 uppercase tracking-tighter">Developer</span>
          </div>
        </div>

        {/* Hover/Pinned Menu */}
        <div className={`absolute top-full right-0 mt-3 w-48 glass p-4 rounded-3xl border-white/20 shadow-2xl transition-all ${isProfilePinned ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 pointer-events-none group-hover:pointer-events-auto'}`}>
          <div className="space-y-2">
            <a 
              href="https://www.linkedin.com/in/vivekbpawar" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/10 transition-all group/link"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover/link:bg-blue-500 group-hover/link:text-white transition-all">
                <Linkedin className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-black text-[var(--text-main)] uppercase tracking-widest">LinkedIn</span>
            </a>
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/10 transition-all group/link"
            >
              <div className="w-8 h-8 rounded-xl bg-black/5 flex items-center justify-center group-hover/link:bg-[var(--accent)] group-hover/link:text-white transition-all">
                <Github className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-black text-[var(--text-main)] uppercase tracking-widest">GitHub</span>
            </a>
            <a 
              href="#" 
              onClick={(e) => e.preventDefault()}
              className="flex items-center gap-3 p-3 rounded-2xl opacity-40 cursor-not-allowed"
            >
              <div className="w-8 h-8 rounded-xl bg-black/5 flex items-center justify-center">
                <Globe className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-black text-[var(--text-main)] uppercase tracking-widest">Portfolio (Soon)</span>
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
