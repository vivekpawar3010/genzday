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

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('vtm_theme_v6') as Theme) || 'default');
  const [wakeUpTime, setWakeUpTime] = useState(() => localStorage.getItem('vtm_wakeup_v6') || '06:00 AM');
  
  // Theme Customization State
  const [customBgUrl, setCustomBgUrl] = useState(() => localStorage.getItem('vtm_custom_bg_v6') || '');
  const [customBaseStyle, setCustomBaseStyle] = useState<Theme>(() => (localStorage.getItem('vtm_custom_base_v6') as Theme) || 'default');
  const [savedThemes, setSavedThemes] = useState<CustomTheme[]>(() => JSON.parse(localStorage.getItem('vtm_saved_themes_v6') || '[]'));
  const [showDesigner, setShowDesigner] = useState(false);
  const [themeDraftName, setThemeDraftName] = useState('');
  const [isAILoading, setIsAILoading] = useState(false);
  const [isProfilePinned, setIsProfilePinned] = useState(false);

  const designerRef = useRef<HTMLDivElement>(null);

  // Core Data
  const [tasks, setTasks] = useState<TaskItemType[]>(() => JSON.parse(localStorage.getItem('vtm_tasks_v6') || '[]'));
  const [routine, setRoutine] = useState<RoutineItem[]>(() => JSON.parse(localStorage.getItem('vtm_routine_v6') || JSON.stringify(DEFAULT_ROUTINE)));
  const [progressData, setProgressData] = useState<DailyProgress[]>(() => JSON.parse(localStorage.getItem('vtm_progress_v6') || '[]'));
  const [goals, setGoals] = useState<CardItem[]>(() => JSON.parse(localStorage.getItem('vtm_goals_v6') || '[]'));
  const [dreams, setDreams] = useState<CardItem[]>(() => JSON.parse(localStorage.getItem('vtm_dreams_v6') || '[]'));

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
      />
    </div>
  );
};

export default App;
