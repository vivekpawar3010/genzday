import React from 'react';
import { Theme, CustomTheme } from '../../types/index';
import { THEME_PRESETS } from '../../utils/constants';

interface ThemeDesignerProps {
  showDesigner: boolean;
  setShowDesigner: (show: boolean) => void;
  designerRef: React.RefObject<HTMLDivElement | null>;
  customBgUrl: string;
  setCustomBgUrl: (url: string) => void;
  customBaseStyle: Theme;
  setCustomBaseStyle: (style: Theme) => void;
  themeDraftName: string;
  setThemeDraftName: (name: string) => void;
  handleSaveTheme: () => void;
  savedThemes: CustomTheme[];
  handleDeleteTheme: (id: string) => void;
  setTheme: (theme: Theme) => void;
}

export const ThemeDesigner: React.FC<ThemeDesignerProps> = ({
  showDesigner,
  setShowDesigner,
  designerRef,
  customBgUrl,
  setCustomBgUrl,
  customBaseStyle,
  setCustomBaseStyle,
  themeDraftName,
  setThemeDraftName,
  handleSaveTheme,
  savedThemes,
  handleDeleteTheme,
  setTheme,
}) => {
  if (!showDesigner) return null;

  return (
    <div ref={designerRef} className="designer-panel glass p-8 rounded-[2.5rem] w-full max-w-2xl mx-auto shadow-2xl border-white/20 text-left mb-10 animate-fadeIn">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-6">
          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] block mb-3 opacity-60">Visual Blueprint</label>
            <input 
              className="w-full glass p-4 rounded-xl text-xs text-[var(--text-main)] border border-white/10" 
              placeholder="Paste Unsplash URL..." 
              value={customBgUrl} 
              onChange={(e) => setCustomBgUrl(e.target.value)} 
            />
          </div>
          
          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] block mb-3 opacity-60">Base Palette</label>
            <div className="grid grid-cols-4 gap-2">
              {THEME_PRESETS.map(preset => (
                <div key={preset.id} className="relative group/preset">
                  <button 
                    onClick={() => setCustomBaseStyle(preset.id)} 
                    className={`w-full h-8 rounded-lg border-2 ${customBaseStyle === preset.id ? 'border-[var(--accent)]' : 'border-transparent'} ${preset.color} shadow-sm transition-all hover:scale-105`}
                  ></button>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded bg-black/80 text-[8px] font-black text-white uppercase tracking-widest whitespace-nowrap opacity-0 group-hover/preset:opacity-100 transition-opacity pointer-events-none z-50">
                    {preset.name}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--border)] space-y-4">
            <input 
              className="w-full glass p-4 rounded-xl text-xs font-bold text-[var(--text-main)] border border-white/10" 
              placeholder="New Theme Name..." 
              value={themeDraftName} 
              onChange={(e) => setThemeDraftName(e.target.value)} 
            />
            <button 
              onClick={handleSaveTheme} 
              className="w-full py-4 rounded-xl bg-[var(--accent)] text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl transition-all active:scale-[0.98]"
            >
              Save Theme
            </button>
          </div>
        </div>

        <div>
          <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] block mb-3 opacity-60">Your Library</label>
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
            {savedThemes.map(st => (
              <div key={st.id} className="group relative flex items-center gap-3 glass p-3 rounded-2xl border-white/10 hover:bg-white/20 transition-all">
                <div className="absolute -top-2 -left-2 px-2 py-1 rounded bg-black/80 text-[7px] font-black text-white uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  Apply Theme
                </div>
                <div 
                  onClick={() => { setCustomBgUrl(st.bgUrl); setCustomBaseStyle(st.baseStyle); setTheme('custom'); }} 
                  className="w-10 h-10 rounded-xl overflow-hidden shrink-0 cursor-pointer shadow-sm bg-emerald-600 flex items-center justify-center"
                >
                  {st.bgUrl === '3d' ? (
                    <div className="text-[10px] font-black text-white">3D</div>
                  ) : (
                    <img src={st.bgUrl} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                  )}
                </div>
                <div 
                  onClick={() => { setCustomBgUrl(st.bgUrl); setCustomBaseStyle(st.baseStyle); setTheme('custom'); }} 
                  className="flex-grow cursor-pointer min-w-0"
                >
                  <p className="text-[10px] font-black text-[var(--text-main)] uppercase tracking-widest truncate">{st.name}</p>
                  <p className="text-[8px] font-bold text-[var(--text-muted)] opacity-50 uppercase">{st.baseStyle}</p>
                </div>
                <button 
                  onClick={() => handleDeleteTheme(st.id)} 
                  className="opacity-0 group-hover:opacity-100 p-2 text-red-500/30 hover:text-red-500 transition-all shrink-0"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
      <button 
        onClick={() => setShowDesigner(false)} 
        className="mt-6 w-full py-2 text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-40 hover:opacity-100"
      >
        Close Designer
      </button>
    </div>
  );
};
