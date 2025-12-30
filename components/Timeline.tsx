
import React, { useState, useEffect } from 'react';
import { ScheduleItem, AppLanguage, UserProfile } from '../types';
import { generateDailySchedule, generateCategorySubtasks, generateDailySuggestions } from '../services/geminiService';
import { t } from '../i18n';

interface TimelineProps {
  schedule: ScheduleItem[];
  language: AppLanguage;
  profile: UserProfile | null;
  onUpdateSchedule: (newSchedule: ScheduleItem[]) => void;
  onToggleSubtask: (itemId: number, subIndex: number) => void;
  onToggleAlarm: (itemId: number) => void;
}

const Timeline: React.FC<TimelineProps> = ({ schedule, language, profile, onUpdateSchedule, onToggleSubtask, onToggleAlarm }) => {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  useEffect(() => {
    if (profile && schedule.length > 0) {
      handleFetchSuggestions();
    }
  }, [profile, language]);

  const handleFetchSuggestions = async () => {
    setLoadingSuggestions(true);
    const result = await generateDailySuggestions(profile, schedule, language);
    if (result) setSuggestions(result);
    setLoadingSuggestions(false);
  };

  const toggleExpand = (id: number) => setExpandedId(prev => (prev === id ? null : id));

  const handleAiPlan = async () => {
    if (!aiPrompt.trim()) return;
    setLoading(true);
    const newSchedule = await generateDailySchedule(aiPrompt, language);
    if (newSchedule) {
      onUpdateSchedule(newSchedule);
      setIsAiModalOpen(false);
      setAiPrompt('');
    } else {
      alert("Failed to generate schedule. Please try again.");
    }
    setLoading(false);
  };

  const handleAiSubtasks = async (id: number, title: string) => {
    setLoading(true);
    const suggestions = await generateCategorySubtasks(title, language);
    if (suggestions) {
      const updated = schedule.map(item => {
        if (item.id === id) {
          const newSubtasks = suggestions.map(s => ({ text: s, completed: false }));
          return { ...item, subtasks: [...item.subtasks, ...newSubtasks] };
        }
        return item;
      });
      onUpdateSchedule(updated);
    }
    setLoading(false);
  };

  const deleteCategory = (id: number) => {
    onUpdateSchedule(schedule.filter(s => s.id !== id));
  };

  const addManualCategory = () => {
    const newItem: ScheduleItem = {
      id: Date.now(),
      title: t('new_category', language),
      time: "12:00 – 13:00",
      icon: "fa-book",
      color: "text-blue-500",
      bg: "bg-blue-50",
      subtasks: [{ text: "Tap to edit tasks", completed: false }]
    };
    onUpdateSchedule([...schedule, newItem]);
  };

  const isRTL = ['Urdu', 'Arabic', 'Pashto'].includes(language);

  return (
    <div className="space-y-4 px-4 pb-24 relative" dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* Suggestions Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3 px-2">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40">Daily Insights</h4>
          <button onClick={handleFetchSuggestions} className="text-[10px] font-black uppercase text-indigo-400 hover:text-indigo-300 transition-all">
            {loadingSuggestions ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-rotate"></i>}
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scroll-hide">
          {suggestions.length > 0 ? (
            suggestions.map((s, idx) => (
              <div key={idx} className="glass-panel-dark min-w-[200px] max-w-[200px] p-4 rounded-3xl border border-white/5 shadow-xl animate-fade-in shrink-0">
                <i className={`fa-solid ${idx === 0 ? 'fa-mosque text-emerald-400' : idx === 1 ? 'fa-bolt text-amber-400' : 'fa-heart-pulse text-rose-400'} mb-2 text-sm opacity-50`}></i>
                <p className="text-[11px] font-bold text-white/80 leading-relaxed line-clamp-3">{s}</p>
              </div>
            ))
          ) : !loadingSuggestions && (
            <p className="text-xs text-white/20 italic px-2">Loading your daily insights...</p>
          )}
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button 
          onClick={() => setIsAiModalOpen(true)}
          className="flex-1 bg-indigo-600 text-white py-3.5 rounded-2xl font-black text-sm shadow-lg shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <i className="fa-solid fa-wand-magic-sparkles text-yellow-300"></i>
          {t('smart_plan', language)}
        </button>
        <button 
          onClick={addManualCategory}
          className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl text-white flex items-center justify-center active:scale-95 transition-all"
        >
          <i className="fa-solid fa-plus"></i>
        </button>
      </div>

      <div className="space-y-3">
        {schedule.map((item) => {
          const completedCount = item.subtasks.filter(s => s.completed).length;
          const totalCount = item.subtasks.length;
          const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
          const isExpanded = expandedId === item.id;

          return (
            <div 
              key={item.id} 
              className={`glass-panel rounded-[2rem] overflow-hidden transition-all duration-300 shadow-xl ${isExpanded ? 'ring-2 ring-white/30' : ''}`}
            >
              <div className="p-4 flex items-center gap-4 cursor-pointer relative select-none" onClick={() => toggleExpand(item.id)}>
                <div className={`w-12 h-12 rounded-2xl ${item.bg} flex items-center justify-center shrink-0 shadow-inner`}>
                  <i className={`fa-solid ${item.icon} ${item.color} text-xl`}></i>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg text-slate-800 leading-tight">{item.title}</h3>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onToggleAlarm(item.id); }}
                      className={`transition-colors duration-200 ${item.alarmEnabled ? 'text-orange-500' : 'text-slate-300'} hover:text-orange-400`}
                    >
                      <i className={`fa-solid ${item.alarmEnabled ? 'fa-bell' : 'fa-bell-slash'} text-[10px]`}></i>
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-black text-slate-400 bg-white/50 px-2 py-0.5 rounded-md border border-slate-100 uppercase">{item.time}</span>
                  </div>
                </div>

                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-400">
                  <i className={`fa-solid fa-chevron-down text-[10px] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}></i>
                </div>

                <div className="absolute bottom-0 left-0 h-1 bg-green-500 transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
              </div>

              <div className={`transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden bg-white/40`}>
                <div className="py-2 px-4 space-y-1">
                  {item.subtasks.map((sub, idx) => (
                    <div key={idx} className="flex items-center justify-between py-3 border-b border-black/5 last:border-0 pl-14 pr-2">
                      <span className={`text-sm font-semibold transition-all ${sub.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                        {sub.text}
                      </span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onToggleSubtask(item.id, idx); }}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${sub.completed ? 'bg-green-500 border-green-500 text-white' : 'bg-transparent border-slate-200 text-transparent'}`}
                      >
                        <i className="fa-solid fa-check text-[10px]"></i>
                      </button>
                    </div>
                  ))}
                  
                  <div className="flex gap-2 py-4 mt-2">
                    <button 
                      onClick={() => handleAiSubtasks(item.id, item.title)}
                      disabled={loading}
                      className="flex-1 bg-white border border-indigo-200 text-indigo-600 py-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {loading ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-sparkles"></i>}
                      {t('ai_suggestions', language)}
                    </button>
                    <button 
                      onClick={() => deleteCategory(item.id)}
                      className="w-12 h-11 bg-red-50 text-red-500 border border-red-100 rounded-xl flex items-center justify-center active:scale-95 transition-all"
                    >
                      <i className="fa-solid fa-trash-can text-sm"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isAiModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/60 backdrop-blur-xl animate-fade-in" onClick={() => setIsAiModalOpen(false)}>
          <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full border border-white/10 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-slate-800">{t('ai_architect', language)}</h3>
              <button onClick={() => setIsAiModalOpen(false)} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <textarea 
              className="w-full h-32 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-400 outline-none resize-none mb-6 font-medium"
              placeholder="..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
            />
            <button 
              onClick={handleAiPlan}
              disabled={loading || !aiPrompt.trim()}
              className="w-full bg-indigo-600 text-white py-4 rounded-3xl font-black text-sm shadow-xl shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-wand-magic-sparkles"></i>}
              {t('generate', language)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timeline;
