
import React, { useState, useEffect } from 'react';
import { generateMCQ, generateStrategy } from '../services/geminiService';
import { MCQ, AppLanguage } from '../types';

interface HubProps {
  backlog: string[];
  setBacklog: React.Dispatch<React.SetStateAction<string[]>>;
  language: AppLanguage;
}

const Hub: React.FC<HubProps> = ({ backlog, setBacklog, language }) => {
  const [topic, setTopic] = useState('');
  const [mcq, setMcq] = useState<MCQ | null>(null);
  const [loadingMcq, setLoadingMcq] = useState(false);
  const [selectedAns, setSelectedAns] = useState<number | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const [backlogInput, setBacklogInput] = useState('');
  const [strategyTopic, setStrategyTopic] = useState<string | null>(null);
  const [strategySteps, setStrategySteps] = useState<string[] | null>(null);
  const [loadingStrategy, setLoadingStrategy] = useState(false);

  useEffect(() => {
    const handleStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, []);

  const handleGenerateMCQ = async () => {
    if (!topic.trim() || !isOnline) return;
    setLoadingMcq(true);
    setMcq(null);
    setSelectedAns(null);
    const result = await generateMCQ(topic, language);
    setMcq(result);
    setLoadingMcq(false);
  };

  const addBacklogItem = () => {
    if (!backlogInput.trim()) return;
    setBacklog(prev => [...prev, backlogInput.trim()]);
    setBacklogInput('');
  };

  const removeBacklogItem = (index: number) => {
    setBacklog(prev => prev.filter((_, i) => i !== index));
  };

  const handleGetStrategy = async (itemTopic: string) => {
    if (!isOnline) {
      alert("AI Study Strategies require an internet connection.");
      return;
    }
    setStrategyTopic(itemTopic);
    setStrategySteps(null);
    setLoadingStrategy(true);
    const steps = await generateStrategy(itemTopic, language);
    setStrategySteps(steps);
    setLoadingStrategy(false);
  };

  const isRTL = ['Urdu', 'Arabic', 'Pashto', 'Hindi', 'Bengali'].includes(language);

  return (
    <div className="space-y-6 px-4 pb-20 animate-fade-in">
      
      {/* Neural Drill (AI MCQs) */}
      <div className="glass-panel p-6 rounded-[2.5rem] relative overflow-hidden group">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500 rounded-full mix-blend-multiply filter blur-2xl opacity-10"></div>
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-pink-500 rounded-full mix-blend-multiply filter blur-2xl opacity-10"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                Neural Drill <span className="bg-gradient-to-r from-purple-500 to-indigo-500 text-transparent bg-clip-text text-[10px] font-extrabold border border-indigo-200 rounded-md px-1.5 py-0.5">AI BETA</span>
              </h3>
              <p className="text-xs text-slate-500">Multi-lingual Learning ({language})</p>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isOnline ? 'bg-indigo-50' : 'bg-slate-100'}`}>
              <i className={`fa-solid ${isOnline ? 'fa-brain text-indigo-500' : 'fa-plug-circle-xmark text-slate-400'}`}></i>
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            <input 
              type="text" 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={`Topic in ${language}?`} 
              disabled={!isOnline}
              className="w-full bg-white/50 border border-black/5 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all disabled:opacity-50"
            />
          </div>
          
          <div className="space-y-3">
            {loadingMcq && (
              <div className="py-8 text-center">
                <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-xs text-slate-500 animate-pulse font-medium">Generating in {language}...</p>
              </div>
            )}

            {!loadingMcq && mcq && (
              <div className="animate-fade-in">
                <p className={`text-slate-800 font-semibold leading-relaxed mb-4 text-sm ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
                    {mcq.q}
                </p>
                <div className="grid gap-2">
                  {mcq.options.map((opt, idx) => {
                    const isCorrect = idx === mcq.ans;
                    const isSelected = selectedAns === idx;
                    let btnClass = "w-full text-left bg-white/60 p-3 rounded-xl text-sm font-medium transition border border-black/5 flex justify-between items-center ";
                    
                    if (selectedAns !== null) {
                      if (isCorrect) btnClass += "bg-green-100 text-green-700 border-green-300 ";
                      else if (isSelected) btnClass += "bg-red-100 text-red-700 border-red-300 ";
                      else btnClass += "opacity-50 ";
                    } else {
                      btnClass += "hover:bg-white active:scale-95 ";
                    }

                    return (
                      <button 
                        key={idx}
                        disabled={selectedAns !== null}
                        onClick={() => setSelectedAns(idx)}
                        className={btnClass}
                        dir={isRTL ? 'rtl' : 'ltr'}
                      >
                        <span className="flex-1">{opt}</span>
                        {selectedAns !== null && isCorrect && <i className="fa-solid fa-check ml-2"></i>}
                        {selectedAns !== null && isSelected && !isCorrect && <i className="fa-solid fa-xmark ml-2"></i>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <button 
              onClick={handleGenerateMCQ}
              disabled={loadingMcq || !isOnline}
              className="w-full mt-4 bg-slate-900 text-white py-3.5 rounded-2xl font-bold shadow-lg active:scale-95 transition-all flex justify-center items-center gap-2 hover:bg-black disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <span>{loadingMcq ? 'Thinking...' : `Generate in ${language}`}</span>
              {!loadingMcq && <i className="fa-solid fa-wand-magic-sparkles text-yellow-300"></i>}
            </button>
          </div>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-[2.5rem] border border-black/5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-slate-800">Study Backlog</h3>
          <span className="bg-red-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full">{backlog.length}</span>
        </div>
        
        <div className="flex gap-2 mb-6">
          <input 
            type="text" 
            value={backlogInput}
            onChange={(e) => setBacklogInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addBacklogItem()}
            placeholder="Add weak topic..." 
            className="flex-1 bg-white/50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-inner"
          />
          <button 
            onClick={addBacklogItem}
            className="bg-indigo-600 text-white w-12 h-12 rounded-xl hover:bg-indigo-700 transition active:scale-90 flex items-center justify-center shadow-lg"
          >
            <i className="fa-solid fa-plus"></i>
          </button>
        </div>
        
        <ul className="space-y-2">
          {backlog.length === 0 ? (
            <li className="text-center text-slate-400 text-sm py-4 italic">No pending backlog.</li>
          ) : (
            backlog.map((item, idx) => (
              <li 
                key={idx} 
                className="flex justify-between items-center bg-white/40 px-4 py-3 rounded-2xl text-sm border border-black/5 animate-fade-in"
              >
                <span className="truncate font-semibold text-slate-700 flex-1">{item}</span>
                <div className="flex items-center gap-2 ml-4">
                  <button 
                    onClick={() => handleGetStrategy(item)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-all ${isOnline ? 'text-indigo-500 hover:bg-white' : 'text-slate-300 cursor-not-allowed opacity-50'}`}
                    title="Get AI Strategy"
                  >
                    <i className="fa-solid fa-bolt text-yellow-500 text-xs"></i>
                  </button>
                  <button 
                    onClick={() => removeBacklogItem(idx)}
                    className="text-slate-300 hover:text-red-500 w-8 h-8 rounded-full flex items-center justify-center transition-all"
                  >
                    <i className="fa-solid fa-circle-xmark text-lg"></i>
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      {strategyTopic && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/40 backdrop-blur-md animate-fade-in"
          onClick={() => setStrategyTopic(null)}
        >
          <div 
            className="bg-white rounded-[2.5rem] p-7 max-w-sm w-full shadow-2xl relative"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-5">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <i className="fa-solid fa-bolt text-yellow-500"></i> AI Strategy ({language})
                </h3>
              </div>
              <button 
                onClick={() => setStrategyTopic(null)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="space-y-3">
              {loadingStrategy ? (
                <div className="py-12 text-center">
                  <div className="w-8 h-8 border-4 border-slate-100 border-t-indigo-500 rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-xs text-slate-400 font-medium">Thinking in {language}...</p>
                </div>
              ) : strategySteps ? (
                strategySteps.map((step, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 animate-fade-in" dir={isRTL ? 'rtl' : 'ltr'}>
                    <span className="bg-indigo-600 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shrink-0 mt-0.5">{i+1}</span>
                    <p className={`text-sm text-slate-700 font-medium leading-relaxed ${isRTL ? 'text-right' : 'text-left'}`}>{step}</p>
                  </div>
                ))
              ) : null}
            </div>

            <button 
              onClick={() => setStrategyTopic(null)}
              className="w-full mt-6 bg-slate-900 text-white py-3.5 rounded-2xl font-bold shadow-lg transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Hub;
