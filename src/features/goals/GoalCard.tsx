import React from 'react';
import { CardItem } from '../../types/index';
import { AutoExpandingTextarea } from '../../components/common/AutoExpandingTextarea';

interface GoalCardProps {
  goal: CardItem;
  onUpdate: (id: string, updates: Partial<CardItem>) => void;
  onDelete: (id: string) => void;
  onAiMagic: (item: CardItem, isGoal: boolean) => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({ 
  goal, 
  onUpdate, 
  onDelete, 
  onAiMagic 
}) => {
  return (
    <div className="content-card overflow-hidden shadow-xl group">
      <div className="relative h-48 bg-black/10">
        {goal.image ? (
          <img 
            src={goal.image} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
            alt="" 
            referrerPolicy="no-referrer" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
             <span className="text-[10px] font-black uppercase tracking-widest opacity-20">No Visual</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <button 
          onClick={() => onAiMagic(goal, true)}
          className="absolute top-4 right-4 w-10 h-10 rounded-full glass border-white/40 flex items-center justify-center shadow-xl hover:scale-110 active:scale-90 transition-all"
        >
          ✨
        </button>
      </div>
      <div className="p-6">
        <AutoExpandingTextarea 
          className="w-full text-lg font-black text-[var(--text-main)] mb-2 placeholder:opacity-20 bg-transparent outline-none resize-none"
          placeholder="Goal Title..."
          value={goal.title}
          onChange={(val) => onUpdate(goal.id, { title: val })}
        />
        <div className="mb-4">
          <label className="text-[8px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-40 block mb-1">Image URL</label>
          <input 
            className="w-full text-[10px] text-[var(--text-muted)] bg-white/5 p-2 rounded-lg outline-none border border-white/5 focus:border-[var(--accent)]/30 transition-all"
            placeholder="Paste image URL..."
            value={goal.image || ''}
            onChange={(e) => onUpdate(goal.id, { image: e.target.value })}
          />
        </div>
        <AutoExpandingTextarea 
          className="w-full text-xs text-[var(--text-muted)] font-medium leading-relaxed opacity-60 bg-transparent outline-none resize-none"
          placeholder="Describe the outcome..."
          value={goal.info}
          onChange={(val) => onUpdate(goal.id, { info: val })}
        />
        <div className="mt-6 pt-6 border-t border-[var(--border)] flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <label className="text-[8px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-40">Progress</label>
            <div className="flex items-center gap-3">
              <input 
                type="range"
                min="0"
                max="100"
                className="w-24 accent-[var(--accent)]"
                value={isNaN(goal.progress || 0) ? 0 : (goal.progress || 0)}
                onChange={(e) => onUpdate(goal.id, { progress: parseInt(e.target.value) || 0 })}
              />
              <span className="text-[9px] font-black text-[var(--text-muted)] w-8 text-right">{goal.progress || 0}%</span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <button 
              onClick={() => onDelete(goal.id)} 
              className="text-[8px] font-black uppercase tracking-widest text-red-500/40 hover:text-red-500 transition-all"
            >
              Remove
            </button>
            <div className="w-20 h-1 bg-black/5 rounded-full overflow-hidden">
               <div className="h-full bg-[var(--accent)] transition-all duration-500" style={{ width: `${goal.progress || 0}%` }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
