import React, { useState } from 'react';
import { TaskItem } from '../../types/index';
import { Plus } from 'lucide-react';
import { AutoExpandingTextarea } from '../../components/common/AutoExpandingTextarea';

interface TaskFormProps {
  onAddTask: (task: Omit<TaskItem, 'id' | 'completed' | 'createdAt'>) => void;
}

export const TaskForm: React.FC<TaskFormProps> = ({ onAddTask }) => {
  const [text, setText] = useState('');
  const [hours, setHours] = useState(0);
  const [isUntimed, setIsUntimed] = useState(false);
  const [repeatInterval, setRepeatInterval] = useState(1);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    onAddTask({
      text,
      hours: isUntimed ? 0 : hours,
      repeatInterval: isUntimed ? 1 : repeatInterval,
      startDate: isUntimed ? new Date().toISOString().split('T')[0] : startDate,
    });

    setText('');
    setHours(0);
    setRepeatInterval(1);
  };

  return (
    <form onSubmit={handleSubmit} className="content-card p-6 sm:p-8 shadow-xl mb-8">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-sm font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">Add New Task</h3>
          <p className="text-[10px] text-[var(--text-muted)] opacity-50 mt-1 uppercase tracking-wider">Plan your day or just list a quick to-do.</p>
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] block mb-2 opacity-60">Task Name</label>
          <AutoExpandingTextarea 
            className="w-full glass p-4 rounded-xl text-sm text-[var(--text-main)] border border-white/10 focus:border-[var(--accent)] transition-all resize-none"
            placeholder="e.g., Go to park, Call mom, Study Physics..."
            value={text}
            onChange={(val) => setText(val)}
          />
        </div>

        <div className="flex items-center gap-2 mb-2">
          <input 
            type="checkbox" 
            id="untimed" 
            checked={isUntimed} 
            onChange={(e) => setIsUntimed(e.target.checked)}
            className="w-4 h-4 accent-[var(--accent)]"
          />
          <label htmlFor="untimed" className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] cursor-pointer">Quick Task (No time/date needed)</label>
        </div>

        {!isUntimed && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fadeIn">
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] block mb-2 opacity-60">Hours</label>
              <input 
                type="number"
                min="0"
                step="0.5"
                className="w-full glass p-4 rounded-xl text-sm text-[var(--text-main)] border border-white/10 focus:border-[var(--accent)] transition-all"
                value={isNaN(hours) ? '' : hours}
                onChange={(e) => setHours(parseFloat(e.target.value))}
              />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] block mb-2 opacity-60">Repeat (Days)</label>
              <input 
                type="number"
                min="1"
                max="12"
                className="w-full glass p-4 rounded-xl text-sm text-[var(--text-main)] border border-white/10 focus:border-[var(--accent)] transition-all"
                value={isNaN(repeatInterval) ? '' : repeatInterval}
                onChange={(e) => setRepeatInterval(parseInt(e.target.value))}
              />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] block mb-2 opacity-60">Start Date</label>
              <input 
                type="date"
                className="w-full glass p-4 rounded-xl text-sm text-[var(--text-main)] border border-white/10 focus:border-[var(--accent)] transition-all"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
          </div>
        )}

        <button 
          type="submit"
          className="w-full py-4 rounded-xl bg-[var(--accent)] text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-[1.01] transition-all flex items-center justify-center gap-2 mt-4"
        >
          <Plus className="w-4 h-4" />
          Create Task
        </button>
      </div>
    </form>
  );
};
