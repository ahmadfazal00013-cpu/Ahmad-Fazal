
import React from 'react';
import { AppLanguage, AppTheme, SUPPORTED_THEMES } from '../types';
import { t } from '../i18n';

interface QuickPanelProps {
  isOpen: boolean;
  onClose: () => void;
  language: AppLanguage;
  currentTheme: AppTheme;
  onThemeChange: (theme: AppTheme) => void;
  onBriefing: () => void;
  isBriefingLoading: boolean;
}

const QuickPanel: React.FC<QuickPanelProps> = ({ 
  isOpen, 
  onClose, 
  language, 
  currentTheme, 
  onThemeChange, 
  onBriefing,
  isBriefingLoading 
}) => {
  const isRTL = ['Urdu', 'Arabic', 'Pashto'].includes(language);

  return (
    <>
      {/* Overlay Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[150] transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Sliding Panel */}
      <div 
        className={`fixed bottom-0 left-0 right-0 z-[160] transform transition-transform duration-500 ease-out ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="bg-white/95 dark:bg-[#1a1a1c]/95 backdrop-blur-3xl rounded-t-[3rem] p-8 border-t border-white/20 shadow-[0_-10px_40px_rgba(0,0,0,0.3)] max-w-lg mx-auto overflow-hidden">
          
          {/* Pull Handle */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-black/10 dark:bg-white/10 rounded-full cursor-pointer" onClick={onClose} />

          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-black dark:text-white flex items-center gap-3">
              <i className="fa-solid fa-bolt-lightning text-amber-500"></i>
              {t('quick_panel', language)}
            </h3>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center dark:text-white/40 hover:text-white transition-all">
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div className="space-y-8">
            {/* Theme Section */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-black/40 dark:text-white/40 block mb-4">{t('theme', language)}</label>
              <div className="flex gap-4 overflow-x-auto pb-4 scroll-hide">
                {SUPPORTED_THEMES.map(theme => (
                  <button 
                    key={theme.id}
                    onClick={() => onThemeChange(theme.id)}
                    className={`flex flex-col items-center gap-2 shrink-0 group`}
                  >
                    <div className={`w-14 h-14 rounded-full ${theme.color} border-4 transition-all ${currentTheme === theme.id ? 'border-amber-500 scale-110 shadow-lg' : 'border-white/10 group-hover:scale-105'}`}>
                      <div className="w-full h-full flex items-center justify-center text-white">
                        {theme.id === 'Ramadan' && <i className="fa-solid fa-moon"></i>}
                        {theme.id === 'Eid' && <i className="fa-solid fa-star"></i>}
                        {theme.id === 'Hajj' && <i className="fa-solid fa-kaaba"></i>}
                        {theme.id === 'Standard' && <i className="fa-solid fa-wand-magic-sparkles"></i>}
                      </div>
                    </div>
                    <span className={`text-[9px] font-black uppercase ${currentTheme === theme.id ? 'text-amber-500' : 'text-black/40 dark:text-white/40'}`}>
                      {theme.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => { onBriefing(); onClose(); }}
                disabled={isBriefingLoading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white p-5 rounded-[2rem] flex flex-col items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-indigo-600/20"
              >
                <div className={`w-10 h-10 rounded-full bg-white/10 flex items-center justify-center ${isBriefingLoading ? 'animate-spin' : ''}`}>
                  <i className="fa-solid fa-sparkles text-xl"></i>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">Daily Briefing</span>
              </button>

              <button 
                onClick={() => { window.scrollTo({top: 0, behavior: 'smooth'}); onClose(); }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white p-5 rounded-[2rem] flex flex-col items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-emerald-600/20"
              >
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <i className="fa-solid fa-arrow-up text-xl"></i>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">Scroll To Top</span>
              </button>
            </div>
            
            <p className="text-[10px] text-center dark:text-white/20 font-black uppercase tracking-[0.3em] py-4">
              Proper Life With Islam
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default QuickPanel;
