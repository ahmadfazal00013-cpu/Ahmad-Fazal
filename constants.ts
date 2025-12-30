
import { ScheduleItem, DockItem, Tab } from './types';

export const INITIAL_SCHEDULE: ScheduleItem[] = [
  { 
    id: 1, 
    title: "Morning Rituals", 
    time: "07:00 – 08:00", 
    icon: "fa-sun", 
    color: "text-amber-500", 
    bg: "bg-amber-50", 
    subtasks: [
      { text: "Wake up & Hydrate", completed: false },
      { text: "Gratitude & Mindfulness", completed: false }
    ] 
  }
];

export const DEFAULT_DOCK_ITEMS: DockItem[] = [
  { id: Tab.Timeline, icon: 'fa-calendar-day', isVisible: true },
  { id: Tab.Focus, icon: 'fa-clock', isVisible: true },
  { id: Tab.Studio, icon: 'fa-wand-magic-sparkles', isVisible: true }, // New AI Studio
  { id: Tab.Quran, icon: 'fa-book-quran', isVisible: true },
  { id: Tab.Hadith, icon: 'fa-scroll', isVisible: true },
  { id: Tab.History, icon: 'fa-landmark', isVisible: true },
  { id: Tab.Hub, icon: 'fa-layer-group', isVisible: true }
];
