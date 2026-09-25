
export interface RoutineItem {
  id: string;
  label: string;
  duration: number; // in minutes
  isFixed?: boolean;
  fixedStartTime?: number; // minutes from start of day
}

export interface TaskItem {
  id: string;
  text: string;
  completed: boolean;
  hours?: number;
  repeatInterval: number; // 1 to 12 days
  startDate: string; // ISO date
  isDaily?: boolean;
  isAlert?: boolean;
  createdAt?: string; // ISO date
}

export interface DailyProgress {
  date: string; // YYYY-MM-DD
  totalHours: number;
  completedTasks: string[]; // Task IDs
}

export interface CardItem {
  id: string;
  title: string;
  image: string;
  info: string;
  progress?: number; // percentage achieved (0-100)
}

export interface CustomTheme {
  id: string;
  name: string;
  bgUrl: string;
  baseStyle: Theme;
}

export type Tab = 'dashboard' | 'routine' | 'tasks' | 'goals' | 'dreams';
export type Theme = 'default' | 'green-leaves' | 'aroma-coffee' | 'honeycomb' | 'blue-winter' | 'dark-night' | 'midnight-lavender' | 'sahara-sunset' | '3d-green' | 'custom';
export type WeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6; // Sunday = 0, Monday = 1...

export type AccountStatus = 'pending' | 'active' | 'suspended';
export type UserRole = 'user' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  status: AccountStatus;
  assignedScopeId: string | null;
  assignedScopeTag: string | null;
  createdAt: string;
  verifiedAt?: string | null;
  hasMigratedLocalData?: boolean;
  adminRequestStatus?: 'none' | 'pending' | 'rejected';
  adminRequestedBy?: string;
  adminRequestReason?: string;
  adminRequestedAt?: string;
}

