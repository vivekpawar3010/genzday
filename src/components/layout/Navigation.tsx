import React from 'react';
import { Layout, CheckSquare, List, Target, Sparkles } from 'lucide-react';
import { Tab } from '../../types/index';

interface NavigationProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Layout },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'routine', label: 'Routine', icon: List },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'dreams', label: 'Dreams', icon: Sparkles },
  ];

  return (
    <div className="sticky top-0 z-50 px-2 flex justify-center mb-10 pt-4 sm:pt-6">
      <nav className="glass p-1.5 sm:p-2 rounded-[1.5rem] sm:rounded-[2rem] shadow-2xl flex gap-0.5 sm:gap-1 border-white/30 backdrop-blur-3xl overflow-x-auto no-scrollbar max-w-full">
        {tabs.map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id as Tab)} 
            className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-8 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'tab-active' : 'text-[var(--text-muted)] hover:bg-white/10'}`}
          >
            <tab.icon className="w-3.5 h-3.5 sm:w-4 h-4" />
            <span className="hidden xs:inline sm:inline">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};
