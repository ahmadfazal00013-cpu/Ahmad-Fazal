
import React, { useState, useEffect, useRef } from 'react';
import { INITIAL_SCHEDULE, DEFAULT_DOCK_ITEMS } from './constants';
import { ScheduleItem, Tab, AppLanguage, SUPPORTED_LANGUAGES, UserProfile, AppTheme, SUPPORTED_THEMES, NavSize, DockItem } from './types';
import Header from './components/Header';
import Timeline from './components/Timeline';
import Hub from './components/Hub';
import FocusMode from './components/FocusMode';
import QuranReader from './components/QuranReader';
import HadithExplorer from './components/HadithExplorer';
import IslamicHistory from './components/IslamicHistory';
import AIStudio from './components/AIStudio'; // NEW
import Onboarding from './components/Onboarding';
import QuickPanel from './components/QuickPanel';
import { t } from './i18n';
import { GoogleGenAI } from "@google/genai";

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.Timeline);
  const [language, setLanguage] = useState<AppLanguage>(() => {
    return (localStorage.getItem('app_language') as AppLanguage) || 'English';
  });
  const [theme, setTheme] = useState<AppTheme>(() => {
    return (localStorage.getItem('app_theme') as AppTheme) || 'Standard';
  });
  const [navSize, setNavSize] = useState<NavSize>(() => {
    return (localStorage.getItem('app_nav_size') as NavSize) || 'Medium';
  });
  const [dockItems, setDockItems] = useState<DockItem[]>(() => {
    const saved = localStorage.getItem('app_dock_items');
    return saved ? JSON.parse(saved) : DEFAULT_DOCK_ITEMS;
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isQuickPanelOpen, setIsQuickPanelOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isBriefingLoading, setIsBriefingLoading] = useState(false);
  const [briefing, setBriefing] = useState<string | null>(null);
  
  // Draggable Nav Position
  const [navPos, setNavPos] = useState(() => {
    const saved = localStorage.getItem('nav_position');
    return saved ? JSON.parse(saved) : { x: 24, y: 112 };
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const [profile, setProfile] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('user_profile_os_v2');
    return saved ? JSON.parse(saved) : {
      name: 'Guest',
      gender: 'Male',
      dob: '2000-01-01',
      location: 'Earth',
      onboarded: true
    };
  });

  const [schedule, setSchedule] = useState<ScheduleItem[]>(() => {
    const saved = localStorage.getItem('future_os_schedule_v2');
    return saved ? JSON.parse(saved) : INITIAL_SCHEDULE;
  });
  
  const [backlog, setBacklog] = useState<string[]>(() => {
    const saved = localStorage.getItem('future_os_backlog_v2');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const handleStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('future_os_schedule_v2', JSON.stringify(schedule));
  }, [schedule]);

  useEffect(() => {
    localStorage.setItem('future_os_backlog_v2', JSON.stringify(backlog));
  }, [backlog]);

  useEffect(() => {
    localStorage.setItem('app_language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('app_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('app_nav_size', navSize);
  }, [navSize]);

  useEffect(() => {
    localStorage.setItem('app_dock_items', JSON.stringify(dockItems));
  }, [dockItems]);

  useEffect(() => {
    if (profile) localStorage.setItem('user_profile_os_v2', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('nav_position', JSON.stringify(navPos));
  }, [navPos]);

  // Dragging Handlers
  const onMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    setIsDragging(true);
    dragOffset.current = {
      x: clientX - navPos.x,
      y: clientY - navPos.y
    };
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      
      const nextX = Math.max(10, Math.min(clientX - dragOffset.current.x, window.innerWidth - 80));
      const nextY = Math.max(10, Math.min(clientY - dragOffset.current.y, window.innerHeight - 300));
      
      setNavPos({ x: nextX, y: nextY });
    };

    const onMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchmove', onMouseMove);
      window.addEventListener('touchend', onMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onMouseMove);
      window.removeEventListener('touchend', onMouseUp);
    };
  }, [isDragging]);

  const generateDailyBriefing = async () => {
    if (!isOnline) return;
    setIsBriefingLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Provide a 2-sentence inspirational morning briefing for a user named ${profile?.name}. 
        They have ${schedule.length} categories planned for today. Theme is ${theme}. Language: ${language}.`,
      });
      setBriefing(response.text || null);
    } catch (e) {
      console.error(e);
    }
    setIsBriefingLoading(false);
  };

  const moveDockItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...dockItems];
    if (direction === 'up' && index > 0) {
        [newItems[index], newItems[index - 1]] = [newItems[index - 1], newItems[index]];
    } else if (direction === 'down' && index < newItems.length - 1) {
        [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    }
    setDockItems(newItems);
  };

  const toggleDockItem = (index: number) => {
    const newItems = [...dockItems];
    newItems[index].isVisible = !newItems[index].isVisible;
    setDockItems(newItems);
  };

  if (!profile || !profile.onboarded) {
    return <Onboarding onComplete={setProfile} />;
  }

  const handleToggleSubtask = (itemId: number, subIndex: number) => {
    setSchedule(prev => prev.map(item => {
      if (item.id === itemId) {
        const newSubtasks = [...item.subtasks];
        newSubtasks[subIndex] = { ...newSubtasks[subIndex], completed: !newSubtasks[subIndex].completed };
        return { ...item, subtasks: newSubtasks };
      }
      return item;
    }));
  };

  const handleToggleAlarm = (itemId: number) => {
    setSchedule(prev => prev.map(item => item.id === itemId ? { ...item, alarmEnabled: !item.alarmEnabled } : item));
  };

  const totalSubtasks = schedule.reduce((acc, curr) => acc + curr.subtasks.length, 0);
  const completedSubtasks = schedule.reduce((acc, curr) => acc + curr.subtasks.filter(s => s.completed).length, 0);
  const progressPercent = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  // Theme Gradient Mapping
  const themeGradients: Record<AppTheme, string> = {
    'Standard': 'radial-gradient(at 0% 0%, hsla(253,16%,7%,1) 0, transparent 50%), radial-gradient(at 50% 0%, hsla(225,39%,30%,1) 0, transparent 50%), radial-gradient(at 100% 0%, hsla(339,49%,30%,1) 0, transparent 50%)',
    'Ramadan': 'radial-gradient(at 0% 0%, hsla(140,40%,10%,1) 0, transparent 50%), radial-gradient(at 50% 0%, hsla(150,50%,15%,1) 0, transparent 50%), radial-gradient(at 100% 0%, hsla(160,60%,20%,1) 0, transparent 50%)',
    'Eid': 'radial-gradient(at 0% 0%, hsla(280,40%,10%,1) 0, transparent 50%), radial-gradient(at 50% 0%, hsla(300,50%,20%,1) 0, transparent 50%), radial-gradient(at 100% 0%, hsla(320,60%,15%,1) 0, transparent 50%)',
    'Hajj': 'radial-gradient(at 0% 0%, hsla(210,30%,15%,1) 0, transparent 50%), radial-gradient(at 50% 0%, hsla(200,40%,25%,1) 0, transparent 50%), radial-gradient(at 100% 0%, hsla(190,50%,20%,1) 0, transparent 50%)',
    'Nocturnal': 'radial-gradient(at 50% 50%, hsla(0,0%,0%,1) 0, hsla(0,0%,5%,1) 100%)'
  };

  // Dynamic Styles based on NavSize
  const navConfig = {
    Small: { 
      container: 'p-1 rounded-2xl', 
      btn: 'w-9 h-9 rounded-xl', 
      icon: 'text-xs', 
      activeIndicator: '-left-1 w-1 h-2' 
    },
    Medium: { 
      container: 'p-1.5 rounded-3xl', 
      btn: 'w-12 h-12 rounded-2xl', 
      icon: 'text-sm', 
      activeIndicator: '-left-1.5 w-1 h-3' 
    },
    Large: { 
      container: 'p-2 rounded-[2rem]', 
      btn: 'w-16 h-16 rounded-3xl', 
      icon: 'text-xl', 
      activeIndicator: '-left-2 w-1.5 h-4' 
    }
  };
  const currentNav = navConfig[navSize];

  return (
    <div 
      className={`min-h-screen flex flex-col relative overflow-hidden transition-all duration-1000 ${activeTab === Tab.Focus ? 'bg-[#050505]' : ''}`}
      style={{ 
        background: activeTab !== Tab.Focus ? themeGradients[theme] : '#050505',
        backgroundColor: activeTab !== Tab.Focus ? (theme === 'Nocturnal' ? '#000' : '#0c0c0e') : '#050505'
      }}
    >
      
      {activeTab !== Tab.Focus && <Header progress={progressPercent} language={language} profile={profile} />}

      {/* Nav Toggle at Bottom for Quick Panel */}
      <button 
        onClick={() => setIsQuickPanelOpen(true)}
        className="fixed bottom-0 left-1/2 -translate-x-1/2 z-[140] w-32 h-10 bg-white/5 backdrop-blur-3xl rounded-t-3xl border border-white/10 flex items-center justify-center group transition-all hover:h-12 hover:bg-white/10"
      >
        <div className="w-8 h-1 bg-white/20 rounded-full group-hover:bg-white/40 transition-all"></div>
      </button>

      {/* Movable Main Bar (Resizable) */}
      <nav 
        className="fixed z-[100] group touch-none"
        style={{ left: navPos.x, top: navPos.y }}
      >
        <div className={`glass-panel-dark flex flex-col items-center gap-1 shadow-2xl border border-white/10 backdrop-blur-3xl transition-all duration-300 ${currentNav.container} ${isDragging ? 'scale-105 ring-2 ring-white/40 opacity-80' : 'hover:ring-2 hover:ring-white/20'}`}>
          <div 
            onMouseDown={onMouseDown} 
            onTouchStart={onMouseDown}
            className="w-full flex justify-center py-2 cursor-grab active:cursor-grabbing text-white/20 hover:text-white/50"
          >
            <i className={`fa-solid fa-grip-lines ${navSize === 'Small' ? 'text-[8px]' : 'text-[10px]'}`}></i>
          </div>

          {dockItems.filter(item => item.isVisible).map(btn => (
            <button 
              key={btn.id}
              onClick={() => { setActiveTab(btn.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className={`relative flex items-center justify-center transition-all duration-300 ${currentNav.btn} ${activeTab === btn.id ? 'bg-white text-black shadow-xl scale-105' : 'text-white/40 hover:text-white/70 hover:bg-white/5'}`}
              title={t(btn.id, language)}
            >
              <i className={`fa-solid ${btn.icon} ${currentNav.icon}`}></i>
              {activeTab === btn.id && <span className={`absolute bg-white rounded-full ${currentNav.activeIndicator}`}></span>}
            </button>
          ))}

          <div className="w-8 h-px bg-white/5 my-1"></div>

          <button 
            onClick={() => setIsSettingsOpen(true)}
            className={`transition-all duration-300 ${currentNav.btn} ${isSettingsOpen ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' : 'text-white/40 hover:text-white/70 hover:bg-white/5'}`}
            title={t('settings', language)}
          >
            <i className={`fa-solid fa-gear ${currentNav.icon}`}></i>
          </button>
        </div>
      </nav>

      {/* AI Briefing Modal */}
      {briefing && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center px-4 bg-black/60 backdrop-blur-xl animate-fade-in" onClick={() => setBriefing(null)}>
            <div className="glass-panel p-8 rounded-[3rem] max-w-sm w-full border border-white/50 shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="absolute -right-20 -top-20 w-60 h-60 bg-indigo-500 rounded-full filter blur-[100px] opacity-20"></div>
                <div className="relative z-10">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2">
                            <i className="fa-solid fa-sparkles text-indigo-500"></i>
                            <h3 className="text-xl font-black text-slate-800">Briefing</h3>
                        </div>
                        <button onClick={() => setBriefing(null)} className="text-slate-400 hover:text-slate-600 transition-all"><i className="fa-solid fa-xmark"></i></button>
                    </div>
                    <p className="text-lg font-bold text-slate-700 leading-relaxed mb-6 italic">"{briefing}"</p>
                    <button onClick={() => setBriefing(null)} className="w-full bg-slate-900 text-white py-4 rounded-3xl font-black text-sm active:scale-95 transition-all">Dismiss</button>
                </div>
            </div>
        </div>
      )}

      {/* Quick Panel Slider */}
      <QuickPanel 
        isOpen={isQuickPanelOpen}
        onClose={() => setIsQuickPanelOpen(false)}
        language={language}
        currentTheme={theme}
        onThemeChange={setTheme}
        onBriefing={generateDailyBriefing}
        isBriefingLoading={isBriefingLoading}
      />

      <main className="flex-1 relative z-10 w-full max-w-md mx-auto pt-4 pl-4 pr-4 sm:pl-24">
        {activeTab === Tab.Timeline && (
          <Timeline schedule={schedule} profile={profile} language={language} onUpdateSchedule={setSchedule} onToggleSubtask={handleToggleSubtask} onToggleAlarm={handleToggleAlarm} />
        )}
        {activeTab === Tab.Focus && <FocusMode language={language} />}
        {activeTab === Tab.Studio && <AIStudio language={language} />}
        {activeTab === Tab.Quran && <QuranReader language={language} />}
        {activeTab === Tab.Hadith && <HadithExplorer language={language} />}
        {activeTab === Tab.History && <IslamicHistory language={language} />}
        {activeTab === Tab.Hub && <Hub backlog={backlog} setBacklog={setBacklog} language={language} />}
      </main>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center px-4 bg-black/80 backdrop-blur-xl animate-fade-in" onClick={() => setIsSettingsOpen(false)}>
          <div className="bg-[#0c0c0e] rounded-[3rem] p-8 max-w-sm w-full border border-white/10 shadow-2xl overflow-y-auto max-h-[90vh] custom-scroll" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-white">{t('settings', language)}</h3>
              <button onClick={() => setIsSettingsOpen(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all"><i className="fa-solid fa-xmark"></i></button>
            </div>

            {/* Profile Settings */}
            <div className="mb-8">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-3">{t('profile', language)}</label>
              <div className="space-y-3">
                <input 
                  type="text" 
                  value={profile?.name || ''}
                  onChange={(e) => setProfile(prev => prev ? ({...prev, name: e.target.value}) : null)}
                  placeholder="Name"
                  className="w-full bg-white/5 border border-white/5 rounded-2xl px-4 py-3 text-sm text-white focus:border-white/20 outline-none transition-all placeholder:text-white/20"
                />
                <input 
                  type="text" 
                  value={profile?.location || ''}
                  onChange={(e) => setProfile(prev => prev ? ({...prev, location: e.target.value}) : null)}
                  placeholder="Location"
                  className="w-full bg-white/5 border border-white/5 rounded-2xl px-4 py-3 text-sm text-white focus:border-white/20 outline-none transition-all placeholder:text-white/20"
                />
              </div>
            </div>
            
            {/* Dock Size Selector */}
            <div className="mb-8">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-3">{t('nav_size', language)}</label>
              <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/5">
                {(['Small', 'Medium', 'Large'] as NavSize[]).map((size) => (
                  <button 
                    key={size}
                    onClick={() => setNavSize(size)}
                    className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${navSize === size ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white'}`}
                  >
                    {t(size.toLowerCase(), language)}
                  </button>
                ))}
              </div>
            </div>

            {/* Dock Customization */}
            <div className="mb-8">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-3">{t('customize_dock', language)}</label>
              <div className="space-y-2">
                {dockItems.map((item, idx) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.isVisible ? 'bg-white text-black' : 'bg-white/5 text-white/30'}`}>
                        <i className={`fa-solid ${item.icon}`}></i>
                      </div>
                      <span className={`text-xs font-bold ${item.isVisible ? 'text-white' : 'text-white/30'}`}>{t(item.id, language)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => toggleDockItem(idx)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${item.isVisible ? 'text-green-400 bg-green-400/10' : 'text-white/20 bg-white/5'}`}
                      >
                        <i className={`fa-solid ${item.isVisible ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                      </button>
                      <button 
                        disabled={idx === 0}
                        onClick={() => moveDockItem(idx, 'up')}
                        className="w-8 h-8 rounded-lg bg-white/5 text-white/40 hover:bg-white/10 hover:text-white flex items-center justify-center disabled:opacity-20 disabled:cursor-not-allowed"
                      >
                        <i className="fa-solid fa-chevron-up"></i>
                      </button>
                      <button 
                        disabled={idx === dockItems.length - 1}
                        onClick={() => moveDockItem(idx, 'down')}
                        className="w-8 h-8 rounded-lg bg-white/5 text-white/40 hover:bg-white/10 hover:text-white flex items-center justify-center disabled:opacity-20 disabled:cursor-not-allowed"
                      >
                        <i className="fa-solid fa-chevron-down"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Language Selector */}
            <div className="mb-8">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-3">{t('language', language)}</label>
              <div className="grid grid-cols-2 gap-2">
                {SUPPORTED_LANGUAGES.map(lang => (
                  <button 
                    key={lang}
                    onClick={() => { setLanguage(lang); }}
                    className={`p-3 rounded-2xl text-[10px] font-bold transition-all border ${language === lang ? 'bg-blue-600 border-blue-400 text-white' : 'bg-white/5 border-white/5 text-white/30'}`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme Selector */}
            <div className="mb-8">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-3">{t('theme', language)}</label>
              <div className="space-y-2">
                {SUPPORTED_THEMES.map(tOption => (
                  <button 
                    key={tOption.id}
                    onClick={() => setTheme(tOption.id)}
                    className={`w-full p-4 rounded-2xl flex items-center justify-between border transition-all ${theme === tOption.id ? 'bg-white/10 border-white/40' : 'bg-white/5 border-transparent'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${tOption.color}`}></div>
                      <span className={`text-xs font-bold ${theme === tOption.id ? 'text-white' : 'text-white/40'}`}>{tOption.label}</span>
                    </div>
                    {theme === tOption.id && <i className="fa-solid fa-check text-blue-400"></i>}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={() => setIsSettingsOpen(false)} className="w-full bg-white text-black py-4 rounded-3xl font-black text-sm shadow-xl transition-all">{t('save', language)}</button>
          </div>
        </div>
      )}

      {/* Ambient background particles (Theme based) */}
      <div className={`fixed top-20 -left-20 w-80 h-80 rounded-full mix-blend-screen filter blur-[120px] opacity-10 pointer-events-none transition-all duration-1000 ${theme === 'Ramadan' ? 'bg-emerald-600' : theme === 'Eid' ? 'bg-purple-600' : 'bg-blue-600'}`}></div>
      <div className={`fixed bottom-20 -right-20 w-80 h-80 rounded-full mix-blend-screen filter blur-[120px] opacity-10 pointer-events-none transition-all duration-1000 ${theme === 'Ramadan' ? 'bg-emerald-400' : theme === 'Eid' ? 'bg-pink-600' : 'bg-purple-600'}`}></div>
    </div>
  );
};

export default App;
