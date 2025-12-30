
import React, { useState } from 'react';
import { exploreHistory } from '../services/geminiService';
import { HistoryEra, AppLanguage } from '../types';

const ERAS: HistoryEra[] = [
  { 
    id: 'creation', 
    title: 'Prophets & Creation', 
    period: 'Start of Time', 
    icon: 'fa-mountain-sun', 
    color: 'text-amber-400', 
    bg: 'bg-amber-500',
    imageUrl: 'https://images.unsplash.com/photo-1518081461904-9d8f136351c2?q=80&w=1000&auto=format&fit=crop'
  },
  { 
    id: 'seerah', 
    title: 'Life of Prophet (PBUH)', 
    period: '570 - 632 CE', 
    icon: 'fa-kaaba', 
    color: 'text-emerald-400', 
    bg: 'bg-emerald-500',
    imageUrl: 'https://images.unsplash.com/photo-1564121211835-e88c852648ab?q=80&w=1000&auto=format&fit=crop'
  },
  { 
    id: 'rashidun', 
    title: 'Rashidun Caliphate', 
    period: '632 - 661 CE', 
    icon: 'fa-shield-halved', 
    color: 'text-blue-400', 
    bg: 'bg-blue-500',
    imageUrl: 'https://images.unsplash.com/photo-1580418827493-f2e223d97b33?q=80&w=1000&auto=format&fit=crop'
  },
  { 
    id: 'umayyad', 
    title: 'Umayyad Empire', 
    period: '661 - 750 CE', 
    icon: 'fa-fort-awesome', 
    color: 'text-purple-400', 
    bg: 'bg-purple-500',
    imageUrl: 'https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=1000&auto=format&fit=crop'
  },
  { 
    id: 'abbasid', 
    title: 'Abbasid Golden Age', 
    period: '750 - 1258 CE', 
    icon: 'fa-flask-vial', 
    color: 'text-teal-400', 
    bg: 'bg-teal-500',
    imageUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=1000&auto=format&fit=crop'
  },
  { 
    id: 'ottoman', 
    title: 'The Ottoman State', 
    period: '1299 - 1922 CE', 
    icon: 'fa-landmark', 
    color: 'text-red-400', 
    bg: 'bg-red-500',
    imageUrl: 'https://images.unsplash.com/photo-1527668752968-14dc70a27c73?q=80&w=1000&auto=format&fit=crop'
  },
];

interface IslamicHistoryProps {
  language: AppLanguage;
}

const IslamicHistory: React.FC<IslamicHistoryProps> = ({ language }) => {
  const [selectedEra, setSelectedEra] = useState<HistoryEra | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleExplore = async (era: HistoryEra) => {
    setSelectedEra(era);
    setLoading(true);
    setContent(null);
    const data = await exploreHistory(era.title, language);
    setContent(data);
    setLoading(false);
  };

  const isRTL = ['Urdu', 'Arabic', 'Pashto', 'Hindi', 'Bengali'].includes(language);

  return (
    <div className="flex flex-col h-full animate-fade-in text-white px-4 pb-24">
      <div className="mb-8 pt-4">
        <h2 className="text-3xl font-black mb-2 text-amber-500">Islamic History</h2>
        <p className="text-white/50 text-sm font-medium">Interactive Timeline in {language}</p>
      </div>

      <div className="relative border-l-2 border-white/5 ml-4 pl-8 space-y-8 pb-10">
        {ERAS.map((era) => (
          <div key={era.id} className="relative group">
            {/* Timeline Dot */}
            <div className={`absolute -left-[41px] top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-4 border-[#0c0c0e] shadow-xl transition-all duration-300 group-hover:scale-150 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] ${era.color.replace('text', 'bg')}`}></div>
            
            <div 
                onClick={() => handleExplore(era)}
                className="relative overflow-hidden rounded-[2rem] h-32 border border-white/10 cursor-pointer active:scale-[0.98] transition-all duration-300 group-hover:border-white/30 group-hover:shadow-2xl"
            >
              {/* Background Image with Gradient */}
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                style={{ backgroundImage: `url(${era.imageUrl})` }}
              ></div>
              <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent"></div>

              {/* Content */}
              <div className="relative z-10 p-6 h-full flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-1">
                    <i className={`fa-solid ${era.icon} ${era.color} text-xl drop-shadow-md`}></i>
                    <h3 className="text-xl font-black text-white drop-shadow-md tracking-tight">{era.title}</h3>
                </div>
                <p className="text-xs font-bold text-white/60 uppercase tracking-widest pl-8">{era.period}</p>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-x-4 group-hover:translate-x-0">
                    <i className="fa-solid fa-chevron-right text-white text-xl"></i>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedEra && (
        <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center sm:px-4 bg-black/80 backdrop-blur-xl animate-fade-in">
          <div className="bg-[#0c0c0e] sm:rounded-[3rem] rounded-t-[3rem] w-full max-w-lg h-[90vh] sm:h-[85vh] overflow-hidden border border-white/10 shadow-2xl relative flex flex-col">
            
            {/* Modal Hero Image */}
            <div className="relative h-64 shrink-0">
                <div 
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${selectedEra.imageUrl})` }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0e] to-transparent"></div>
                
                <button 
                    onClick={() => setSelectedEra(null)}
                    className="absolute top-6 right-6 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-white hover:text-black transition-all border border-white/10 z-20"
                >
                    <i className="fa-solid fa-xmark"></i>
                </button>

                <div className="absolute bottom-6 left-8 z-10">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10 mb-2 ${selectedEra.color}`}>
                        <i className={`fa-solid ${selectedEra.icon} text-xs`}></i>
                        <span className="text-[10px] font-black uppercase tracking-wider">{selectedEra.period}</span>
                    </div>
                    <h3 className="text-3xl font-black text-white leading-none drop-shadow-lg">{selectedEra.title}</h3>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-8 custom-scroll">
                {loading ? (
                <div className="py-10 text-center">
                    <div className={`w-12 h-12 border-4 border-white/10 rounded-full animate-spin mx-auto mb-4 border-t-amber-500`}></div>
                    <p className="text-white/40 font-medium animate-pulse text-sm">Consulting historical archives...</p>
                </div>
                ) : content ? (
                <div className={`prose prose-invert prose-sm max-w-none animate-fade-in ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
                    <div className="text-white/80 leading-relaxed whitespace-pre-wrap font-medium text-base">
                        {content}
                    </div>
                </div>
                ) : null}
            </div>

            {/* Footer Action */}
            <div className="p-6 bg-[#0c0c0e]/90 backdrop-blur-md border-t border-white/5">
                <button 
                onClick={() => setSelectedEra(null)}
                className="w-full bg-white text-black py-4 rounded-2xl font-black text-sm shadow-lg active:scale-95 transition-all"
                >
                Close
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IslamicHistory;
