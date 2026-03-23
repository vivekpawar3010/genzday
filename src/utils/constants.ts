import { Theme, RoutineItem } from '../types/index';

export interface ThemePreset {
  id: Theme;
  name: string;
  color: string;
  bgUrl: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  { id: "default", name: "Classic Alpine", color: "bg-blue-400", bgUrl: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=2000&q=80" },
  { id: "green-leaves", name: "Amazonia", color: "bg-emerald-500", bgUrl: "https://images.unsplash.com/photo-1501004318641-729e8e26abd0?auto=format&fit=crop&w=2000&q=80" },
  { id: "aroma-coffee", name: "Espresso", color: "bg-orange-800", bgUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=2000&q=80" },
  { id: "honeycomb", name: "Amber Glow", color: "bg-yellow-500", bgUrl: "https://images.unsplash.com/photo-1558449028-b53a39d100fc?auto=format&fit=crop&w=2000&q=80" },
  { id: "blue-winter", name: "Arctic Fox", color: "bg-sky-300", bgUrl: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=2000&q=80" },
  { id: "dark-night", name: "Nebula", color: "bg-slate-900", bgUrl: "https://images.unsplash.com/photo-1436891620584-47fd0e565afb?auto=format&fit=crop&w=2000&q=80" },
  { id: "midnight-lavender", name: "Lavender", color: "bg-purple-600", bgUrl: "https://images.unsplash.com/photo-1499002238440-d264edd596ec?auto=format&fit=crop&w=2000&q=80" },
  { id: "sahara-sunset", name: "Sahara", color: "bg-rose-500", bgUrl: "https://images.unsplash.com/photo-1509316785289-025f54846b6e?auto=format&fit=crop&w=2000&q=80" },
  { id: "3d-green", name: "3D Emerald", color: "bg-emerald-600", bgUrl: "3d" }
];

export const DEFAULT_ROUTINE: RoutineItem[] = [
  { id: 'r1', label: 'Morning Ritual', duration: 45 },
  { id: 'r2', label: 'Deep Work Focus', duration: 120 },
  { id: 'r3', label: 'Lunch & Relax', duration: 60 },
  { id: 'r4', label: 'Skill Building', duration: 90 },
  { id: 'r5', label: 'Evening Review', duration: 30 },
];
