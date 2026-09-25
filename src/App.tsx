import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  format, 
  isSameDay, 
  differenceInDays, 
  parseISO, 
  subDays,
  startOfDay
} from 'date-fns';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  RoutineItem, 
  TaskItem as TaskItemType, 
  DailyProgress, 
  Tab, 
  Theme, 
  CardItem, 
  CustomTheme 
} from './types/index';
import { DEFAULT_ROUTINE, THEME_PRESETS } from './utils/constants';
import { timeToMinutes } from './utils/time';
import { extractColorsFromImage, applyDynamicThemeColors } from './utils/themeColorExtractor';

// Components
import { DashboardStats } from './features/dashboard/DashboardStats';
import { ProgressChart } from './features/dashboard/ProgressChart';
import { StudyCalendar } from './features/dashboard/StudyCalendar';
import { TaskForm } from './features/tasks/TaskForm';
import { TaskList } from './features/tasks/TaskList';
import { RoutineList } from './features/routine/RoutineList';
import { DeveloperProfile } from './components/layout/DeveloperProfile';
import { AILoadingOverlay } from './features/ai/AILoadingOverlay';
import { ThemeDesigner } from './features/theme/ThemeDesigner';
import { Navigation } from './components/layout/Navigation';
import { Header } from './components/layout/Header';
import { ThemeSwitcher } from './components/layout/ThemeSwitcher';
import { GoalCard } from './features/goals/GoalCard';
import { DreamCard } from './features/dreams/DreamCard';
import { ThreeDBackground } from './features/theme/ThreeDBackground';

// Auth & Admin Modules
import { useAuth } from './hooks/useAuth';
import { AuthModal, UserProfileModal, PendingApprovalPage } from './components/auth';
import { AdminConsoleModal } from './features/admin';
import { backupLocalDataToCloud } from './services/cloudSync';

const checkIsKingRoute = () => {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  return path === '/king' || path.startsWith('/king/') || hash.includes('/king');
};

function safeJsonParse<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (err) {
    console.warn(`Error parsing localStorage key "${key}":`, err);
    return fallback;
  }
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('vtm_theme_v6') as Theme) || 'default');
  const [wakeUpTime, setWakeUpTime] = useState(() => localStorage.getItem('vtm_wakeup_v6') || '06:00 AM');
  
  // Theme Customization State
  const [customBgUrl, setCustomBgUrl] = useState(() => localStorage.getItem('vtm_custom_bg_v6') || '');
  const [customBaseStyle, setCustomBaseStyle] = useState<Theme>(() => (localStorage.getItem('vtm_custom_base_v6') as Theme) || 'default');
  const [savedThemes, setSavedThemes] = useState<CustomTheme[]>(() => safeJsonParse('vtm_saved_themes_v6', []));
  const [showDesigner, setShowDesigner] = useState(false);
  const [themeDraftName, setThemeDraftName] = useState('');
  const [isAILoading, setIsAILoading] = useState(false);
  const [isProfilePinned, setIsProfilePinned] = useState(false);

  const designerRef = useRef<HTMLDivElement>(null);

  // Auth & Admin State
  const { user, isMaster, isAdmin, signInWithGoogle, signInWithEmail, signUpWithEmail, logout, refreshUserProfile } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAdminConsole, setShowAdminConsole] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [covertClickCount, setCovertClickCount] = useState(0);

  // Dedicated /king Route & Pending Approval State
  const [isKingRoute, setIsKingRoute] = useState<boolean>(checkIsKingRoute);
  const [dismissPendingNotice, setDismissPendingNotice] = useState(false);

  useEffect(() => {
    const handleLocationChange = () => {
      const isKing = checkIsKingRoute();
      setIsKingRoute(isKing);
      if (isKing) {
        setShowAdminConsole(true);
      }
    };
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const handleCloseAdminConsole = () => {
    setShowAdminConsole(false);
    if (window.location.hash.includes('/king')) {
      window.location.hash = '';
    }
    if (window.location.pathname.toLowerCase().startsWith('/king')) {
      window.history.pushState({}, '', '/');
    }
    setIsKingRoute(false);
  };

  // Core Data with safe parsing
  const [tasks, setTasks] = useState<TaskItemType[]>(() => safeJsonParse('vtm_tasks_v6', []));
  const [routine, setRoutine] = useState<RoutineItem[]>(() => safeJsonParse('vtm_routine_v6', DEFAULT_ROUTINE));
  const [progressData, setProgressData] = useState<DailyProgress[]>(() => safeJsonParse('vtm_progress_v6', []));
  const [goals, setGoals] = useState<CardItem[]>(() => safeJsonParse('vtm_goals_v6', []));
  const [dreams, setDreams] = useState<CardItem[]>(() => safeJsonParse('vtm_dreams_v6', []));

  // Profile Pinning Logic (Hide on scroll)
  useEffect(() => {
    const handleScroll = () => {
      if (isProfilePinned) setIsProfilePinned(false);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isProfilePinned]);

  // Monthly Reset Logic
  useEffect(() => {
    const currentMonthKey = format(new Date(), 'yyyy-MM');
    const storedMonthKey = localStorage.getItem('vtm_month_key');

    if (storedMonthKey && storedMonthKey !== currentMonthKey) {
      setProgressData([]);
      localStorage.setItem('vtm_progress_v6', '[]');
    }
    localStorage.setItem('vtm_month_key', currentMonthKey);
  }, []);

  // Persistence
  useEffect(() => {
    localStorage.setItem('vtm_theme_v6', theme);
    localStorage.setItem('vtm_wakeup_v6', wakeUpTime);
    localStorage.setItem('vtm_tasks_v6', JSON.stringify(tasks));
    localStorage.setItem('vtm_routine_v6', JSON.stringify(routine));
    localStorage.setItem('vtm_progress_v6', JSON.stringify(progressData));
    localStorage.setItem('vtm_goals_v6', JSON.stringify(goals));
    localStorage.setItem('vtm_dreams_v6', JSON.stringify(dreams));
    localStorage.setItem('vtm_custom_bg_v6', customBgUrl);
    localStorage.setItem('vtm_custom_base_v6', customBaseStyle);
    localStorage.setItem('vtm_saved_themes_v6', JSON.stringify(savedThemes));

    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'custom') {
      document.documentElement.setAttribute('data-base', customBaseStyle === 'custom' ? 'default' : customBaseStyle);
      document.documentElement.style.setProperty('--custom-url', `url('${customBgUrl}')`);
    } else {
      document.documentElement.removeAttribute('data-base');
    }
  }, [theme, wakeUpTime, tasks, routine, progressData, goals, dreams, customBgUrl, customBaseStyle, savedThemes]);

  // Dynamic Background Image Text & Card Color Adaptation
  useEffect(() => {
    let isMounted = true;
    const currentImageUrl = theme === 'custom' 
      ? customBgUrl 
      : THEME_PRESETS.find(p => p.id === theme)?.bgUrl || '';

    extractColorsFromImage(currentImageUrl, theme === 'custom' ? customBaseStyle : theme).then(colors => {
      if (isMounted) {
        applyDynamicThemeColors(colors);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [theme, customBgUrl, customBaseStyle]);

  // Auto-migrate local data when an active user logs in
  useEffect(() => {
    if (user && user.status === 'active' && !user.hasMigratedLocalData) {
      backupLocalDataToCloud(user);
    }
  }, [user]);

  // Covert master shortcut listener (Ctrl + Shift + U)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'u') {
        if (isMaster || isAdmin) {
          setShowAdminConsole(prev => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMaster, isAdmin]);

  const handleCovertClick = () => {
    if (!isMaster) return;
    setCovertClickCount(prev => {
      const next = prev + 1;
      if (next >= 5) {
        setShowAdminConsole(true);
        return 0;
      }
      return next;
    });
  };

  // Task Filtering Logic
  const todayTasks = useMemo(() => {
    const today = startOfDay(new Date());
    return tasks.filter(task => {
      const start = startOfDay(parseISO(task.startDate));
      const diff = differenceInDays(today, start);
      return diff >= 0 && diff % task.repeatInterval === 0;
    });
  }, [tasks]);

  const overdueTasks = useMemo(() => {
    const today = startOfDay(new Date());
    return tasks.filter(task => {
      const start = startOfDay(parseISO(task.startDate));
      const diff = differenceInDays(today, start);
      // It's overdue if it was scheduled for any day before today and is not completed
      // For recurring tasks, this is a bit simplified: if it's not completed and the start date is in the past
      return diff > 0 && !task.completed;
    });
  }, [tasks]);

  // Scheduled Routine Calculation
  const scheduledRoutine = useMemo(() => {
    let currentTime = timeToMinutes(wakeUpTime);
    return routine.map((item) => {
      const start = item.isFixed && item.fixedStartTime !== undefined ? item.fixedStartTime : currentTime;
      const end = start + item.duration;
      currentTime = end;
      return { item, start, end };
    }).sort((a, b) => a.start - b.start);
  }, [routine, wakeUpTime]);

  // Stats Calculations
  const totalHoursMonth = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    return progressData
      .filter(p => {
        const d = parseISO(p.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((acc, curr) => acc + curr.totalHours, 0);
  }, [progressData]);

  const streaks = useMemo(() => {
    const sortedDates = progressData
      .filter(p => p.totalHours > 0)
      .map(p => p.date)
      .sort((a, b) => b.localeCompare(a));

    if (sortedDates.length === 0) return { current: 0, longest: 0 };

    let current = 0;
    let longest = 0;
    let tempStreak = 0;
    const today = format(new Date(), 'yyyy-MM-dd');
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

    if (sortedDates[0] === today || sortedDates[0] === yesterday) {
      let checkDate = parseISO(sortedDates[0]);
      for (let i = 0; i < sortedDates.length; i++) {
        if (isSameDay(parseISO(sortedDates[i]), checkDate)) {
          current++;
          checkDate = subDays(checkDate, 1);
        } else {
          break;
        }
      }
    }

    let lastDate: Date | null = null;
    const allDatesSorted = [...sortedDates].sort((a, b) => a.localeCompare(b));
    for (const dateStr of allDatesSorted) {
      const date = parseISO(dateStr);
      if (lastDate && differenceInDays(date, lastDate) === 1) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
      longest = Math.max(longest, tempStreak);
      lastDate = date;
    }

    return { current, longest };
  }, [progressData]);

  // Handlers
  const handleAddTask = (taskData: Omit<TaskItemType, 'id' | 'completed' | 'createdAt'>) => {
    const newTask: TaskItemType = {
      ...taskData,
      id: Date.now().toString(),
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setTasks([...tasks, newTask]);
  };

  const handleUpdateTask = (id: string, updates: Partial<TaskItemType>) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, ...updates } : t));

    if (updates.completed !== undefined) {
      const today = format(new Date(), 'yyyy-MM-dd');
      const task = tasks.find(t => t.id === id);
      if (!task) return;

      setProgressData(prev => {
        const existing = prev.find(p => p.date === today);
        const taskHours = task.hours || 0;
        if (existing) {
          const newCompletedTasks = updates.completed 
            ? [...existing.completedTasks, id]
            : existing.completedTasks.filter(tid => tid !== id);
          
          const newTotalHours = updates.completed
            ? existing.totalHours + taskHours
            : existing.totalHours - taskHours;

          return prev.map(p => p.date === today ? { ...p, completedTasks: newCompletedTasks, totalHours: Math.max(0, newTotalHours) } : p);
        } else if (updates.completed) {
          return [...prev, { date: today, totalHours: taskHours, completedTasks: [id] }];
        }
        return prev;
      });
    }
  };

  const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const handleUpdateRoutine = (id: string, updates: Partial<RoutineItem>) => {
    setRoutine(routine.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const handleRemoveRoutine = (id: string) => {
    setRoutine(routine.filter(r => r.id !== id));
  };

  const handleAddRoutine = () => {
    const newItem: RoutineItem = {
      id: Date.now().toString(),
      label: '',
      duration: 30,
    };
    setRoutine([...routine, newItem]);
  };

  const handleReorderRoutine = (draggedIdx: number, targetIdx: number) => {
    const newRoutine = [...routine];
    const [removed] = newRoutine.splice(draggedIdx, 1);
    newRoutine.splice(targetIdx, 0, removed);
    setRoutine(newRoutine);
  };

  const handleSaveTheme = () => {
    if (!themeDraftName.trim()) return;
    const newTheme: CustomTheme = {
      id: Date.now().toString(),
      name: themeDraftName,
      bgUrl: customBgUrl,
      baseStyle: customBaseStyle
    };
    setSavedThemes([newTheme, ...savedThemes]);
    setThemeDraftName('');
  };

  const handleDeleteTheme = (id: string) => {
    setSavedThemes(savedThemes.filter(t => t.id !== id));
  };

  const handleAddGoal = () => {
    const newGoal: CardItem = {
      id: Date.now().toString(),
      title: '',
      image: '',
      info: '',
      progress: 0
    };
    setGoals([...goals, newGoal]);
  };

  const handleAddDream = () => {
    const newDream: CardItem = {
      id: Date.now().toString(),
      title: '',
      image: '',
      info: ''
    };
    setDreams([...dreams, newDream]);
  };

  const handleAiMagic = async (item: CardItem, isGoal: boolean) => {
    if (!item.title) return;
    setIsAILoading(true);

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `I have a ${isGoal ? 'goal' : 'dream'} titled: "${item.title}". Context: "${item.info}". 
        Provide an Unsplash image URL matching the theme. 
        Also, suggest EXACTLY THREE actionable tasks: 
        1. One task for today.
        2. One task for tomorrow.
        3. One task for later this week.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              imageUrl: { type: Type.STRING, description: 'Direct Unsplash image URL.' },
              todayTask: { type: Type.STRING, description: 'Task to do today.' },
              tomorrowTask: { type: Type.STRING, description: 'Task to do tomorrow.' },
              weekTask: { type: Type.STRING, description: 'Task for this week.' }
            },
            required: ["imageUrl", "todayTask", "tomorrowTask", "weekTask"]
          }
        }
      });

      const data = JSON.parse(response.text || '{}');
      
      const setter = isGoal ? setGoals : setDreams;
      const list = isGoal ? goals : dreams;
      setter(list.map(x => x.id === item.id ? { ...x, image: data.imageUrl } : x));

      const today = new Date().toISOString().split('T')[0];
      handleAddTask({ text: data.todayTask, hours: 1, repeatInterval: 1, startDate: today });
    } catch (error) {
      console.error('AI request failed', error);
    } finally {
      setIsAILoading(false);
    }
  };

  const toggleTheme = () => {
    const currentIndex = THEME_PRESETS.findIndex(p => p.id === theme);
    const nextIndex = (currentIndex + 1) % THEME_PRESETS.length;
    const nextTheme = THEME_PRESETS[nextIndex].id;
    setTheme(nextTheme);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleDesigner = () => {
    const newState = !showDesigner;
    setShowDesigner(newState);
    if (newState) {
      setTimeout(() => {
        designerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen pb-20 relative">
      {(theme === '3d-green' || (theme === 'custom' && customBaseStyle === '3d-green')) && <ThreeDBackground />}
      <AILoadingOverlay isLoading={isAILoading} />
      
      <DeveloperProfile 
        isProfilePinned={isProfilePinned} 
        setIsProfilePinned={setIsProfilePinned} 
      />

      <Header />

      {/* Non-intrusive Pending Status Banner */}
      {user && user.status === 'pending' && !dismissPendingNotice && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-6 animate-fadeIn">
          <div className="glass p-3.5 sm:p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-lg">
            <div className="flex items-center gap-2.5 text-amber-300">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shrink-0" />
              <span>
                <strong>Registration Pending Confirmation:</strong> Your cloud sync is awaiting administrator approval. You have full access to your routines and habits locally on this device.
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
              <button
                onClick={() => setShowPendingModal(true)}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-black uppercase text-[10px] tracking-wider transition-all shadow-md"
              >
                Check Status / Code
              </button>
              <button
                onClick={() => setDismissPendingNotice(true)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-all text-xs"
                title="Dismiss notice"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      <ThemeDesigner 
        showDesigner={showDesigner}
        setShowDesigner={setShowDesigner}
        designerRef={designerRef}
        customBgUrl={customBgUrl}
        setCustomBgUrl={setCustomBgUrl}
        customBaseStyle={customBaseStyle}
        setCustomBaseStyle={setCustomBaseStyle}
        themeDraftName={themeDraftName}
        setThemeDraftName={setThemeDraftName}
        handleSaveTheme={handleSaveTheme}
        savedThemes={savedThemes}
        handleDeleteTheme={handleDeleteTheme}
        setTheme={setTheme}
      />

      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="px-4 sm:px-6 max-w-7xl mx-auto">
        {activeTab === 'dashboard' && (
          <div className="animate-fadeIn">
            <div className="mb-8">
              <h2 className="text-2xl font-black text-[var(--text-main)] mb-1">Welcome Back</h2>
              <p className="text-xs text-[var(--text-muted)] opacity-60 uppercase tracking-widest font-bold">Your daily overview and performance metrics.</p>
            </div>
            <DashboardStats 
              totalHoursMonth={totalHoursMonth}
              currentStreak={streaks.current}
              longestStreak={streaks.longest}
            />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-8">
                {overdueTasks.length > 0 && (
                  <TaskList 
                    title="Missed Tasks"
                    tasks={overdueTasks}
                    onUpdateTask={handleUpdateTask}
                    onDeleteTask={handleDeleteTask}
                    isOverdueSection={true}
                  />
                )}
                <TaskList 
                  title="Today's Focus"
                  tasks={todayTasks}
                  onUpdateTask={handleUpdateTask}
                  onDeleteTask={handleDeleteTask}
                />
                <ProgressChart progressData={progressData} />
              </div>
              <div>
                <StudyCalendar progressData={progressData} allTasks={tasks} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="max-w-3xl mx-auto animate-fadeIn">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-black text-[var(--text-main)] mb-1">Task Manager</h2>
              <p className="text-xs text-[var(--text-muted)] opacity-60 uppercase tracking-widest font-bold">Organize your work, set recurring habits, and clear your mind.</p>
            </div>
            <TaskForm onAddTask={handleAddTask} />
            {overdueTasks.length > 0 && (
              <TaskList 
                title="Missed / Incomplete"
                tasks={overdueTasks}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
                isOverdueSection={true}
              />
            )}
            <TaskList 
              title="All Tasks"
              tasks={tasks}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
            />
          </div>
        )}

        {activeTab === 'routine' && (
          <div className="max-w-2xl mx-auto animate-fadeIn">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-black text-[var(--text-main)] mb-1">Daily Routine</h2>
              <p className="text-xs text-[var(--text-muted)] opacity-60 uppercase tracking-widest font-bold">Design your ideal day. Drag blocks to reorder and anchor fixed events.</p>
            </div>
            <div className="content-card p-6 sm:p-8 flex items-center justify-between shadow-xl mb-8">
              <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Wake Up Time</span>
              <input 
                type="text" 
                className="text-xl font-black text-[var(--accent)] text-right w-32 focus:outline-none"
                value={wakeUpTime}
                onChange={(e) => setWakeUpTime(e.target.value)}
              />
            </div>
            <RoutineList 
              scheduledRoutine={scheduledRoutine}
              onUpdate={handleUpdateRoutine}
              onRemove={handleRemoveRoutine}
              onAdd={handleAddRoutine}
              onReorder={handleReorderRoutine}
            />
          </div>
        )}

        {activeTab === 'goals' && (
          <div className="animate-fadeIn">
            <div className="mb-8">
              <h2 className="text-2xl font-black text-[var(--text-main)] mb-1">Strategic Goals</h2>
              <p className="text-xs text-[var(--text-muted)] opacity-60 uppercase tracking-widest font-bold">Break down big objectives into manageable progress. Use ✨ for AI guidance.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map(goal => (
              <GoalCard 
                key={goal.id}
                goal={goal}
                onUpdate={(id, updates) => setGoals(goals.map(g => g.id === id ? { ...g, ...updates } : g))}
                onDelete={(id) => setGoals(goals.filter(g => g.id !== id))}
                onAiMagic={handleAiMagic}
              />
            ))}
            <button onClick={handleAddGoal} className="content-card h-64 border-2 border-dashed border-[var(--border)] flex flex-col items-center justify-center gap-4 opacity-40 hover:opacity-100 transition-all group">
               <span className="text-4xl group-hover:scale-110 transition-transform">＋</span>
               <span className="text-[10px] font-black uppercase tracking-widest">New Goal</span>
            </button>
          </div>
        </div>
      )}

        {activeTab === 'dreams' && (
          <div className="animate-fadeIn">
            <div className="mb-8">
              <h2 className="text-2xl font-black text-[var(--text-main)] mb-1">Vision Board</h2>
              <p className="text-xs text-[var(--text-muted)] opacity-60 uppercase tracking-widest font-bold">Visualize your ultimate dreams. Keep them in sight to stay inspired.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dreams.map(dream => (
              <DreamCard 
                key={dream.id}
                dream={dream}
                onUpdate={(id, updates) => setDreams(dreams.map(d => d.id === id ? { ...d, ...updates } : d))}
                onDelete={(id) => setDreams(dreams.filter(d => d.id !== id))}
                onAiMagic={handleAiMagic}
              />
            ))}
            <button onClick={handleAddDream} className="content-card h-80 border-2 border-dashed border-[var(--border)] flex flex-col items-center justify-center gap-4 opacity-40 hover:opacity-100 transition-all group">
               <span className="text-4xl group-hover:scale-110 transition-transform">＋</span>
               <span className="text-[10px] font-black uppercase tracking-widest">New Vision</span>
            </button>
          </div>
        </div>
      )}
      </main>

      <ThemeSwitcher 
        showDesigner={showDesigner}
        toggleDesigner={toggleDesigner}
        toggleTheme={toggleTheme}
        user={user}
        onOpenAuth={() => setShowAuthModal(true)}
        onOpenProfile={() => setShowProfileModal(true)}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onGoogleSignIn={signInWithGoogle}
        onEmailSignIn={signInWithEmail}
        onEmailSignUp={signUpWithEmail}
      />

      {/* User Profile Modal */}
      {user && (
        <UserProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          user={user}
          isAdmin={isAdmin}
          onOpenAdminConsole={() => setShowAdminConsole(true)}
          onLogout={logout}
        />
      )}

      {/* Expansive Bigger Admin Console Modal */}
      <AdminConsoleModal
        isOpen={showAdminConsole || isKingRoute}
        onClose={handleCloseAdminConsole}
        currentUser={user}
        isMaster={isMaster}
        isAdmin={isAdmin}
        onOpenAuth={() => setShowAuthModal(true)}
      />

      {/* Pending Approval Modal (Non-blocking) */}
      {showPendingModal && user && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-md" 
            onClick={() => setShowPendingModal(false)} 
          />
          <div className="relative w-full max-w-xl z-10 animate-scaleIn">
            <PendingApprovalPage
              user={user}
              onRefreshUser={refreshUserProfile}
              onContinueLocal={() => setShowPendingModal(false)}
              onLogout={() => {
                logout();
                setShowPendingModal(false);
              }}
            />
          </div>
        </div>
      )}

      <footer className="pt-10 pb-6 text-center text-sm text-[var(--text-muted)] opacity-80">
        <p className="mx-auto max-w-2xl mb-2">
          “The more you focus within, the clearer everything around you becomes.”
        </p>
        <span 
          onClick={handleCovertClick}
          className="text-[9px] font-mono opacity-30 hover:opacity-80 transition-opacity cursor-default select-none inline-block"
          title="System Build"
        >
          v2.4.0-genzday
        </span>
      </footer>
    </div>
  );
};

export default App;
