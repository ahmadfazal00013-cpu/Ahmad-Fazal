
import React, { useState, useEffect, useRef } from 'react';
import { AppLanguage } from '../types';
import { t } from '../i18n';

interface FocusModeProps {
  language: AppLanguage;
}

const FocusMode: React.FC<FocusModeProps> = ({ language }) => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const timerRef = useRef<number | null>(null);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setIsBreak(false);
    setTimeLeft(25 * 60);
  };

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000) as unknown as number;
    } else if (timeLeft === 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch(() => {});
      alert(isBreak ? t('back_to_focus', language) : t('session_complete', language));
      
      const nextMode = !isBreak;
      setIsBreak(nextMode);
      setTimeLeft(nextMode ? 5 * 60 : 25 * 60);
      setIsActive(false);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft, isBreak, language]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = isBreak ? (timeLeft / (5 * 60)) : (timeLeft / (25 * 60));

  return (
    <div className="px-6 py-10 flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
      <div className="relative w-64 h-64 mb-10">
        <svg className="w-full h-full -rotate-90">
          <circle
            cx="128"
            cy="128"
            r="120"
            fill="transparent"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="8"
          />
          <circle
            cx="128"
            cy="128"
            r="120"
            fill="transparent"
            stroke={isBreak ? "#34C759" : "#007AFF"}
            strokeWidth="8"
            strokeDasharray={2 * Math.PI * 120}
            strokeDashoffset={2 * Math.PI * 120 * (1 - progress)}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
          <span className="text-xs font-bold uppercase tracking-widest text-white/40 mb-1">
            {isBreak ? t('short_break', language) : t('deep_focus', language)}
          </span>
          <span className="text-6xl font-black tabular-nums">
            {minutes}:{seconds.toString().padStart(2, '0')}
          </span>
        </div>
      </div>

      <div className="flex gap-4 w-full max-w-xs">
        <button 
          onClick={toggleTimer}
          className={`flex-1 py-4 rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition-all ${isActive ? 'bg-white/10 text-white border border-white/20' : 'bg-white text-slate-900'}`}
        >
          {isActive ? t('pause', language) : t('start_focus', language)}
        </button>
        <button 
          onClick={resetTimer}
          className="w-16 h-16 rounded-2xl bg-white/10 text-white border border-white/20 flex items-center justify-center active:scale-90 transition-all"
        >
          <i className="fa-solid fa-rotate-left"></i>
        </button>
      </div>
    </div>
  );
};

export default FocusMode;
