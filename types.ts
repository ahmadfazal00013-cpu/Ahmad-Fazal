
export interface Subtask {
  text: string;
  completed: boolean;
}

export interface ScheduleItem {
  id: number;
  title: string;
  time: string;
  icon: string;
  color: string;
  bg: string;
  subtasks: Subtask[];
  alarmEnabled?: boolean;
}

export interface MCQ {
  q: string;
  options: string[];
  ans: number;
}

export interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

export interface Ayah {
  number: number;
  text: string;
  urText?: string;
}

export interface HadithResult {
  arabic: string;
  translation: string;
  reference: string;
  explanation: string;
}

export interface HistoryEra {
  id: string;
  title: string;
  period: string;
  icon: string;
  color: string;
  bg: string;
  imageUrl: string;
}

export enum Tab {
  Timeline = 'timeline',
  Focus = 'focus',
  Quran = 'quran',
  Hadith = 'hadith',
  History = 'history',
  Hub = 'hub',
  Studio = 'studio'
}

export interface DockItem {
  id: Tab;
  icon: string;
  isVisible: boolean;
}

export type AppLanguage = 'English' | 'Urdu' | 'Arabic' | 'Pashto' | 'Spanish' | 'French' | 'German' | 'Hindi' | 'Bengali' | 'Chinese' | 'Russian' | 'Portuguese' | 'Turkish';

export const SUPPORTED_LANGUAGES: AppLanguage[] = [
  'English', 'Urdu', 'Arabic', 'Pashto', 'Spanish', 'French', 'German', 'Hindi', 'Bengali', 'Chinese', 'Russian', 'Portuguese', 'Turkish'
];

export type AppTheme = 'Standard' | 'Ramadan' | 'Eid' | 'Hajj' | 'Nocturnal';

export const SUPPORTED_THEMES: {id: AppTheme, label: string, color: string}[] = [
  { id: 'Standard', label: 'Modern Dark', color: 'bg-indigo-600' },
  { id: 'Ramadan', label: 'Blessed Ramadan', color: 'bg-emerald-600' },
  { id: 'Eid', label: 'Festive Eid', color: 'bg-purple-600' },
  { id: 'Hajj', label: 'Pure Hajj', color: 'bg-blue-400' },
  { id: 'Nocturnal', label: 'Deep Night', color: 'bg-black' }
];

export type NavSize = 'Small' | 'Medium' | 'Large';

export interface UserProfile {
  name: string;
  gender: 'Male' | 'Female' | 'Other';
  dob: string;
  location: string;
  onboarded: boolean;
}

export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
export type ImageSize = '1K' | '2K' | '4K';
