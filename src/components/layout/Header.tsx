import React from 'react';
import { motion } from 'motion/react';

export const Header: React.FC = () => {
  return (
    <header className="pt-20 pb-10 text-center px-4">
      <motion.h1 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-5xl sm:text-6xl font-black tracking-tighter text-[var(--text-main)] mb-1 drop-shadow-sm"
      >
        Genzday
      </motion.h1>
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 0.5, duration: 1 }}
        className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.8em] mb-12 opacity-50"
      >
        Master Your Moment
      </motion.p>
    </header>
  );
};
