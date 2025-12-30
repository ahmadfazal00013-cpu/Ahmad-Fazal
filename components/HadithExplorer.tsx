
import React, { useState } from 'react';
import { searchHadith } from '../services/geminiService';
import { HadithResult, AppLanguage } from '../types';

interface HadithExplorerProps {
  language: AppLanguage;
}

const HadithExplorer: React.FC<HadithExplorerProps> = ({ language }) => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<HadithResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    const data = await searchHadith(query, language);
    setResult(data);
    setLoading(false);
  };

  const isRTL = ['Urdu', 'Arabic', 'Pashto', 'Hindi', 'Bengali'].includes(language);

  return (
    <div className="flex flex-col h-full animate-fade-in text-white px-4 pb-24">
      <div className="mb-6 pt-4">
        <h2 className="text-3xl font-black mb-2 text-teal-400">Hadith Explorer</h2>
        <p className="text-white/50 text-sm font-medium">Authentic traditions in {language}</p>
      </div>

      <form onSubmit={handleSearch} className="glass-panel-dark rounded-2xl mb-8 p-1 flex items-center border border-teal-500/20 shadow-lg shadow-teal-500/5">
        <div className="pl-4 text-teal-400/50"><i className="fa-solid fa-book-open"></i></div>
        <input 
          type="text" 
          placeholder="Topic? (e.g. Kindness, Charity, Science)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="bg-transparent border-none text-white p-3.5 text-sm focus:ring-0 w-full outline-none"
        />
        <button 
          type="submit"
          disabled={loading}
          className="bg-teal-600 text-white px-5 py-2.5 rounded-xl mr-1 font-bold active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-magnifying-glass"></i>}
        </button>
      </form>

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-12 h-12 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-teal-400 font-medium animate-pulse">Consulting Scholars...</p>
        </div>
      ) : result ? (
        <div className="animate-fade-in space-y-6">
          <div className="glass-panel-dark p-7 rounded-[2.5rem] border border-teal-500/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <i className="fa-solid fa-quote-right text-6xl text-teal-400"></i>
            </div>
            
            <p className="text-3xl text-right font-arabic leading-[1.8] text-white/95 mb-6" dir="rtl">
              {result.arabic}
            </p>
            
            <div className="h-px w-full bg-teal-500/10 mb-6"></div>
            
            <div className="space-y-4">
                <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-teal-400 mb-1 block">{language} Translation</span>
                    <p className={`text-xl ${isRTL ? 'text-right' : 'text-left'} text-teal-100 font-medium leading-relaxed`} dir={isRTL ? 'rtl' : 'ltr'}>
                        {result.translation}
                    </p>
                </div>
            </div>
          </div>

          <div className="glass-panel-dark p-6 rounded-3xl border border-white/5 bg-teal-900/10">
            <h4 className="text-teal-400 text-xs font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                <i className="fa-solid fa-circle-info"></i> Source & Explanation
            </h4>
            <p className="text-sm font-bold text-teal-100 mb-2">{result.reference}</p>
            <p className={`text-xs text-white/60 leading-relaxed ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
                {result.explanation}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 opacity-30 text-center">
            <i className="fa-solid fa-scroll text-6xl mb-4"></i>
            <p className="text-sm font-medium">Search to explore Hadiths in any language.</p>
        </div>
      )}
    </div>
  );
};

export default HadithExplorer;
