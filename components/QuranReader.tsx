
import React, { useState, useEffect } from 'react';
import { Surah, Ayah, AppLanguage } from '../types';
import { t } from '../i18n';

interface QuranReaderProps {
  language: AppLanguage;
}

// Map AppLanguage to Al Quran Cloud Edition Codes
const LANGUAGE_TO_EDITION: Record<string, string> = {
  'English': 'en.sahih',
  'Urdu': 'ur.jalandhry',
  'Pashto': 'ps.abdulwali',
  'Arabic': 'ar.jalalayn', // Tafsir in Arabic
  'Spanish': 'es.asad',
  'French': 'fr.hamidullah',
  'German': 'de.aburida',
  'Hindi': 'hi.hindi',
  'Bengali': 'bn.bengali',
  'Chinese': 'zh.jian',
  'Russian': 'ru.kuliev',
  'Portuguese': 'pt.elhayek',
  'Turkish': 'tr.ates'
};

const QuranReader: React.FC<QuranReaderProps> = ({ language }) => {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [selectedSurah, setSelectedSurah] = useState<number | null>(null);
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSurahs();
  }, []);

  const fetchSurahs = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://api.alquran.cloud/v1/surah');
      const data = await response.json();
      setSurahs(data.data);
    } catch (error) {
      console.error("Error fetching Surahs:", error);
    }
    setLoading(false);
  };

  const fetchSurahContent = async (number: number) => {
    setLoading(true);
    try {
      const edition = LANGUAGE_TO_EDITION[language] || 'en.sahih';
      
      const [arRes, trRes] = await Promise.all([
        fetch(`https://api.alquran.cloud/v1/surah/${number}/quran-uthmani`),
        fetch(`https://api.alquran.cloud/v1/surah/${number}/${edition}`)
      ]);
      const arData = await arRes.json();
      const trData = await trRes.json();

      const combined: Ayah[] = arData.data.ayahs.map((ayah: any, index: number) => ({
        number: ayah.numberInSurah,
        text: ayah.text,
        urText: trData.data.ayahs[index].text // We reuse urText prop for current selected translation
      }));

      setAyahs(combined);
      setSelectedSurah(number);
    } catch (error) {
      console.error("Error fetching content:", error);
    }
    setLoading(false);
  };

  const filteredSurahs = surahs.filter(s => 
    s.englishName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.number.toString().includes(searchQuery)
  );

  const isRTL = ['Urdu', 'Arabic', 'Pashto'].includes(language);

  if (selectedSurah) {
    const currentSurah = surahs.find(s => s.number === selectedSurah);
    return (
      <div className="flex flex-col h-full animate-fade-in text-white pb-24" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="sticky top-0 z-30 glass-panel-dark p-4 flex items-center gap-4 mb-4 rounded-b-3xl border-b border-white/10">
          <button 
            onClick={() => setSelectedSurah(null)}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
          >
            <i className={`fa-solid ${isRTL ? 'fa-arrow-right' : 'fa-arrow-left'}`}></i>
          </button>
          <div>
            <h2 className="text-xl font-bold">{currentSurah?.englishName}</h2>
            <p className="text-xs text-emerald-400">{currentSurah?.name} • {currentSurah?.numberOfAyahs} {t('verses', language)}</p>
          </div>
        </div>

        <div className="px-4 space-y-6">
          {loading ? (
            <div className="py-20 text-center">
              <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
            </div>
          ) : (
            ayahs.map((ayah) => (
              <div key={ayah.number} className="glass-panel-dark p-6 rounded-[2rem] border border-white/5 space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center justify-center border border-emerald-500/20">
                    {ayah.number}
                  </span>
                </div>
                <p className="text-3xl text-right font-arabic leading-[1.8] text-white/90" dir="rtl">
                  {ayah.text}
                </p>
                <div className="h-px w-full bg-white/5"></div>
                <p className={`text-lg ${isRTL ? 'text-right' : 'text-left'} text-emerald-100/70 font-medium leading-relaxed`} dir={isRTL ? 'rtl' : 'ltr'}>
                  {ayah.urText}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-fade-in text-white px-4 pb-24" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="mb-6 pt-4">
        <h2 className="text-3xl font-black mb-2">{t('quran', language)}</h2>
        <p className="text-white/50 text-sm font-medium">{t('spiritual_guidance', language)} ({language})</p>
      </div>

      <div className="glass-panel-dark rounded-2xl mb-6 p-1 flex items-center border border-white/10">
        <div className="pl-4 text-white/30"><i className="fa-solid fa-magnifying-glass"></i></div>
        <input 
          type="text" 
          placeholder={t('search_surah', language)}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent border-none text-white p-3 text-sm focus:ring-0 w-full outline-none"
        />
      </div>

      <div className="grid grid-cols-1 gap-3">
        {loading ? (
          <div className="py-20 text-center">
             <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto"></div>
          </div>
        ) : (
          filteredSurahs.map((surah) => (
            <button 
              key={surah.number}
              onClick={() => fetchSurahContent(surah.number)}
              className="glass-panel-dark p-4 rounded-2xl border border-white/5 flex items-center gap-4 hover:bg-white/10 transition-all text-left active:scale-95 group"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold group-hover:bg-emerald-500 group-hover:text-white transition-all">
                {surah.number}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg">{surah.englishName}</h3>
                <p className="text-xs text-white/40 font-medium">{surah.englishNameTranslation}</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-arabic text-emerald-400">{surah.name}</p>
                <p className="text-[10px] text-white/30 uppercase font-bold">{surah.numberOfAyahs} {t('verses', language)}</p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default QuranReader;
