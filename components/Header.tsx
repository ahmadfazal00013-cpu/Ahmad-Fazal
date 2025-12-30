
import React, { useState, useEffect } from 'react';
import WeatherWidget from './WeatherWidget';
import { AppLanguage, UserProfile } from '../types';
import { t } from '../i18n';

interface HeaderProps {
  progress: number;
  language: AppLanguage;
  profile: UserProfile | null;
}

const Header: React.FC<HeaderProps> = ({ progress, language, profile }) => {
  const [time, setTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      clearInterval(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const dateStr = time.toLocaleDateString(language === 'Arabic' ? 'ar-SA' : 'en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });

  // Calculate Hijri Date using Intl API
  const hijriDateStr = new Intl.DateTimeFormat(language === 'Arabic' || language === 'Urdu' || language === 'Pashto' ? 'ar-SA-u-ca-islamic' : 'en-US-u-ca-islamic', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(time);
  
  const timeStr = time.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true 
  });

  const isRTL = ['Urdu', 'Arabic', 'Pashto'].includes(language);

  return (
    <>
      <div className="fixed top-0 w-full z-50 flex justify-between px-6 py-2 text-white text-[10px] font-bold mix-blend-overlay pointer-events-none">
        <span>{timeStr}</span>
        <div className="flex gap-1.5 items-center">
          {!isOnline && (
            <span className="bg-red-500 text-[8px] px-1.5 rounded-full animate-pulse mr-2">OFFLINE</span>
          )}
          <WeatherWidget />
        </div>
      </div>

      <header className={`pt-16 pb-4 px-6 relative z-10 text-white ${isRTL ? 'text-right' : 'text-left'} sm:pl-28`} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="flex justify-between items-end mb-2">
          <span className="text-xs font-black tracking-[0.2em] text-white/40 uppercase">PLWI</span>
          <div className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-2 border border-white/10 shadow-lg">
            <div className={`w-2 h-2 rounded-full ${progress === 100 ? 'bg-green-400' : 'bg-blue-400'} animate-pulse`}></div>
            <span className="text-[10px] font-black uppercase tracking-tighter">{progress}% {t('done', language)}</span>
          </div>
        </div>
        <h1 className="text-5xl font-black tracking-tighter leading-none mb-1">
          {t('today', language)}
        </h1>
        <div className="flex flex-col gap-0.5 mt-2">
          <p className="text-white/60 text-sm font-bold uppercase tracking-widest">{dateStr}</p>
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 text-xs font-black uppercase tracking-widest">{hijriDateStr}</span>
            {profile && <span className="text-blue-400 text-xs font-black uppercase tracking-widest">• {profile.name}</span>}
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
