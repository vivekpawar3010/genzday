import React from 'react';
import { CardItem } from '../../types/index';
import { AutoExpandingTextarea } from '../../components/common/AutoExpandingTextarea';

interface DreamCardProps {
  dream: CardItem;
  onUpdate: (id: string, updates: Partial<CardItem>) => void;
  onDelete: (id: string) => void;
  onAiMagic: (item: CardItem, isGoal: boolean) => void;
}

export const DreamCard: React.FC<DreamCardProps> = ({ 
  dream, 
  onUpdate, 
  onDelete, 
  onAiMagic 
}) => {
  return (
    <div className="content-card overflow-hidden shadow-xl group">
      <div className="relative h-64 bg-black/10">
        {dream.image ? (
          <img 
            src={dream.image} 
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
            alt="" 
            referrerPolicy="no-referrer" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
             <span className="text-[10px] font-black uppercase tracking-widest opacity-20">Vision Missing</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80"></div>
        <button 
          onClick={() => onAiMagic(dream, false)}
          className="absolute bottom-6 right-6 w-12 h-12 rounded-full glass border-white/40 flex items-center justify-center shadow-xl hover:scale-110 active:scale-90 transition-all"
        >
          ✨
        </button>
        <div className="absolute bottom-6 left-6 right-6">
          <AutoExpandingTextarea 
            className="w-full text-xl font-black text-white placeholder:text-white/30 drop-shadow-lg bg-transparent outline-none resize-none"
            placeholder="Dream Name..."
            value={dream.title}
            onChange={(val) => onUpdate(dream.id, { title: val })}
          />
        </div>
      </div>
      <div className="p-6">
        <div className="mb-4">
          <label className="text-[8px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-40 block mb-1">Vision URL</label>
          <input 
            className="w-full text-[10px] text-[var(--text-muted)] bg-white/5 p-2 rounded-lg outline-none border border-white/5 focus:border-[var(--accent)]/30 transition-all"
            placeholder="Paste image URL..."
            value={dream.image || ''}
            onChange={(e) => onUpdate(dream.id, { image: e.target.value })}
          />
        </div>
        <AutoExpandingTextarea 
          className="w-full text-xs text-[var(--text-muted)] font-medium leading-relaxed opacity-60 bg-transparent outline-none resize-none"
          placeholder="What does this look like?"
          value={dream.info}
          onChange={(val) => onUpdate(dream.id, { info: val })}
        />
        <div className="mt-6 flex justify-between">
          <button 
            onClick={() => onDelete(dream.id)} 
            className="text-[8px] font-black uppercase tracking-widest text-red-500/40 hover:text-red-500 transition-all"
          >
            Discard
          </button>
        </div>
      </div>
    </div>
  );
};
