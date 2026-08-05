import React from 'react';
import { motion } from 'motion/react';
import { Logo } from '../common/Logo';

export const Header: React.FC = () => {
  return (
    <header className="pt-10 pb-10 px-4">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-4 mb-8">
        <a href="/" className="flex items-center gap-4 rounded-3xl border border-white/10 bg-white/5 px-4 py-3 shadow-xl transition-colors hover:border-[var(--accent)] hover:bg-white/10">
          <div className="w-14 h-14 rounded-3xl bg-[#111] p-3 flex items-center justify-center shadow-2xl">
            <Logo className="w-full h-full" />
          </div>
          <div className="text-left">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-[var(--text-main)]">Genzday</h1>
            <p className="text-[10px] uppercase tracking-[0.4em] text-[var(--text-muted)] opacity-70">Master Your Moment</p>
          </div>
        </a>
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25, duration: 0.8 }}
        className="text-center"
      >
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.8em] mb-12 opacity-50"
        >
          Master Your Moment
        </motion.p>
      </motion.div>
    </header>
  );
};
