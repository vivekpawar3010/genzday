import React from 'react';
import { motion } from 'motion/react';

export const Logo: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <motion.svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 512 512"
      className={className}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <defs>
        <linearGradient id="premiumGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FDB931"/>
          <stop offset="30%" stopColor="#FFF5C3"/>
          <stop offset="60%" stopColor="#D4AF37"/>
          <stop offset="100%" stopColor="#996515"/>
        </linearGradient>
        
        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000" floodOpacity="0.5"/>
        </filter>

        <filter id="glow">
          <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <circle cx="256" cy="256" r="256" fill="#111111"/>

      <motion.g 
        filter="url(#softShadow)"
        animate={{ 
          y: [0, -5, 0],
        }}
        transition={{ 
          duration: 4, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
      >
        <path d="M130 140 V400 H382 V140" 
              fill="none" 
              stroke="#FFFFFF" 
              strokeWidth="12" 
              strokeLinecap="round"/>

        <path d="M170 160 L256 380 L342 160 H300 L256 290 L212 160 Z" 
              fill="#FFFFFF"/>

        <motion.path 
          d="M190 145 L190 100 L223 130 L256 80 L289 130 L322 100 L322 145 Z" 
          fill="url(#premiumGold)"
          animate={{
            filter: ["brightness(1)", "brightness(1.2)", "brightness(1)"]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        <motion.circle 
          cx="256" cy="70" r="5" fill="#FFF5C3"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.circle 
          cx="190" cy="90" r="5" fill="#FFF5C3"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
        />
        <motion.circle 
          cx="322" cy="90" r="5" fill="#FFF5C3"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, delay: 1 }}
        />
      </motion.g>
    </motion.svg>
  );
};
