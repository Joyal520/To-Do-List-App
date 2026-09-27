import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { onAuthStateChanged, User, signInWithPopup } from 'firebase/auth';
import { db, auth, googleProvider } from './firebase';
import { Task, TaskStatus, TaskPriority, FilterPriority, SortOption, ThemeMode } from './types';
import { TaskInput } from './components/TaskInput';
import { Column } from './components/Column';
import { AuthModal } from './components/AuthModal';
import { UserMenu } from './components/UserMenu';
import { TaskEditModal } from './components/TaskEditModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { fireConfetti } from './utils/confetti';
import {
  CheckSquare2,
  Database,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Search,
  SlidersHorizontal,
  Moon,
  Sun,
  Keyboard,
  CheckCircle2,
  X,
  ShieldCheck,
  Laptop,
} from 'lucide-react';

const LOCAL_STORAGE_TASKS_KEY = 'taskflow_tasks_v2';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signup' | 'signin'>('signup');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Initialize tasks from local storage immediately so there is never a blank screen
  const [tasks, setTasks] = useState<Task[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_TASKS_KEY);
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.error('Error loading tasks from localStorage:', e);
      }
    }
    return [
      {
        id: 'sample-1',
        title: 'Explore the new TaskFlow 2.0 interface',
        status: 'todo',
        priority: 'high',
        tag: 'Welcome',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'sample-2',
        title: 'Complete your first task to test confetti',
        status: 'in-progress',
        priority: 'medium',
        tag: 'QuickStart',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  });

  const [isFirestoreConnected, setIsFirestoreConnected] = useState(false);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search, Filter & Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<FilterPriority>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | TaskStatus>('all');
  const [sortOption, setSortOption] = useState<SortOption>('newest');

  // Modals & Interactive State
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Default theme is explicitly 'light' for clean, bright styling
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('taskflow_theme') as ThemeMode;
      if (saved) return saved;
    }
    return 'light';
  });

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sync tasks to local storage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_TASKS_KEY, JSON.stringify(tasks));
    } catch (e) {
      console.error('Error writing to localStorage:', e);
    }
  }, [tasks]);

  // Apply Theme Mode
  useEffect(() => {
    const root = document.documentElement;
    const applyDark = (isDark: boolean) => {
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyDark(mediaQuery.matches);

      const handler = (e: MediaQueryListEvent) => applyDark(e.matches);
      mediaQuery.addEventListener('change', handler);
      localStorage.removeItem('taskflow_theme');
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      applyDark(theme === 'dark');
      localStorage.setItem('taskflow_theme', theme);
    }
  }, [theme]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        if (e.key === 'Escape') target.blur();
        return;
      }

      if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === '?') {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
      } else if (e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Toast Helper
  const addToast = (type: ToastMessage['type'], message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Monitor Auth State
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  // Listen for Tasks in Firestore (with graceful offline fallback)
  useEffect(() => {
    if (authLoading) return;

    try {
      const tasksRef = collection(db, 'tasks');
      const targetUserId = currentUser ? currentUser.uid : 'guest';
      const q = query(tasksRef, where('userId', '==', targetUserId));

      const unsubscribeTasks = onSnapshot(
        q,
        (snapshot) => {
          setIsFirestoreConnected(true);
          const fetchedTasks: Task[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              title: data.title || '',
              description: data.description || '',
              status: (data.status as TaskStatus) || 'todo',
              priority: (data.priority as TaskPriority) || 'medium',
              tag: data.tag || '',
              dueDate: data.dueDate || undefined,
              createdAt: data.createdAt || new Date().toISOString(),
              updatedAt: data.updatedAt || new Date().toISOString(),
              userId: data.userId,
              userEmail: data.userEmail,
            };
          });

          // If Firestore returns tasks, update local state
          if (fetchedTasks.length > 0) {
            setTasks(fetchedTasks);
          }
        },
        (err) => {
          console.warn('Firestore real-time sync is offline or restricted. Running in local storage mode:', err);
          setIsFirestoreConnected(false);
        }
      );

      return () => unsubscribeTasks();
    } catch (e) {
      console.warn('Firestore initialization notice (running with local storage persistence):', e);
      setIsFirestoreConnected(false);
    }
  }, [currentUser, authLoading]);

  // Quick Google Sign-In helper
  const handleQuickGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      addToast('success', 'Signed in successfully with Google!');
    } catch (err: any) {
      console.error('Google Sign-in error:', err);
      if (err.code === 'auth/unauthorized-domain') {
        openAuth('signin');
      } else if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        setError(err.message || 'Could not sign in with Google.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Add Task (Always saves to Local State + syncs to Firestore if available)
  const handleAddTask = async (
    title: string,
    options?: {
      priority?: TaskPriority;
      tag?: string;
      dueDate?: string;
      description?: string;
      status?: TaskStatus;
    }
  ): Promise<boolean> => {
    const trimmed = title.trim();
    if (!trimmed) return false;

    const now = new Date().toISOString();
    const tempId = 'task_' + Math.random().toString(36).substring(2, 11);
    const currentUid = currentUser ? currentUser.uid : 'guest';
    const currentEmail = currentUser ? currentUser.email || '' : '';

    const newTask: Task = {
      id: tempId,
      title: trimmed,
      description: options?.description || '',
      status: options?.status || 'todo',
      priority: options?.priority || 'medium',
      tag: options?.tag || '',
      dueDate: options?.dueDate,
      createdAt: now,
      updatedAt: now,
      userId: currentUid,
      userEmail: currentEmail,
    };

    // 1. Immediately update UI & LocalStorage
    setTasks((prev) => [newTask, ...prev]);
    addToast('success', `Added task "${trimmed}"`);

    // 2. Sync to Firestore in background
    try {
      const docRef = await addDoc(collection(db, 'tasks'), {
        title: newTask.title,
        description: newTask.description,
        status: newTask.status,
        priority: newTask.priority,
        tag: newTask.tag,
        dueDate: newTask.dueDate || null,
        userId: currentUid,
        userEmail: currentEmail,
        createdAt: now,
        updatedAt: now,
      });

      // Update local task with real Firestore ID
      setTasks((prev) =>
        prev.map((t) => (t.id === tempId ? { ...t, id: docRef.id } : t))
      );
    } catch (err) {
      console.warn('Task saved locally (Firestore cloud sync pending):', err);
    }

    return true;
  };

  // Update Task Status
  const handleUpdateStatus = async (taskId: string, newStatus: TaskStatus): Promise<void> => {
    const now = new Date().toISOString();

    // 1. Immediate local update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus, updatedAt: now } : t))
    );

    const label = newStatus === 'done' ? 'Completed' : newStatus === 'in-progress' ? 'Started' : 'Moved to To Do';
    addToast('info', `Task ${label}`);

    // 2. Firestore sync
    try {
      if (!taskId.startsWith('task_') && !taskId.startsWith('sample-')) {
        const taskRef = doc(db, 'tasks', taskId);
        await updateDoc(taskRef, {
          status: newStatus,
          updatedAt: now,
        });
      }
    } catch (err) {
      console.warn('Updated locally (Firestore sync pending):', err);
    }
  };

  // Save full edits from TaskEditModal
  const handleSaveTaskDetails = async (taskId: string, updates: Partial<Task>): Promise<void> => {
    const now = new Date().toISOString();

    // 1. Immediate local update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...updates, updatedAt: now } : t))
    );
    addToast('success', 'Task details updated');

    // 2. Firestore sync
    try {
      if (!taskId.startsWith('task_') && !taskId.startsWith('sample-')) {
        const taskRef = doc(db, 'tasks', taskId);
        await updateDoc(taskRef, {
          ...updates,
          updatedAt: now,
        });
      }
    } catch (err) {
      console.warn('Saved locally (Firestore sync pending):', err);
    }
  };

  // Inline rename title
  const handleInlineUpdateTitle = async (taskId: string, newTitle: string): Promise<void> => {
    const now = new Date().toISOString();

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, title: newTitle, updatedAt: now } : t))
    );
    addToast('success', 'Task renamed');

    try {
      if (!taskId.startsWith('task_') && !taskId.startsWith('sample-')) {
        const taskRef = doc(db, 'tasks', taskId);
        await updateDoc(taskRef, {
          title: newTitle,
          updatedAt: now,
        });
      }
    } catch (err) {
      console.warn('Renamed locally:', err);
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskId: string): Promise<void> => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    addToast('info', 'Task removed');

    try {
      if (!taskId.startsWith('task_') && !taskId.startsWith('sample-')) {
        const taskRef = doc(db, 'tasks', taskId);
        await deleteDoc(taskRef);
      }
    } catch (err) {
      console.warn('Deleted locally:', err);
    }
  };

  // Clear completed tasks
  const handleClearCompleted = async () => {
    const doneList = tasks.filter((t) => t.status === 'done');
    if (doneList.length === 0) return;
    if (!window.confirm(`Clear all ${doneList.length} completed tasks?`)) return;

    setTasks((prev) => prev.filter((t) => t.status !== 'done'));
    addToast('success', `Cleared ${doneList.length} completed tasks`);

    try {
      for (const t of doneList) {
        if (!t.id.startsWith('task_') && !t.id.startsWith('sample-')) {
          await deleteDoc(doc(db, 'tasks', t.id));
        }
      }
    } catch (err) {
      console.warn('Cleared locally:', err);
    }
  };

  const openAuth = (mode: 'signup' | 'signin') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  // Filter & Sort Tasks
  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    // Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.tag && t.tag.toLowerCase().includes(q)) ||
          (t.description && t.description.toLowerCase().includes(q))
      );
    }

    // Priority Filter
    if (filterPriority !== 'all') {
      result = result.filter((t) => (t.priority || 'medium') === filterPriority);
    }

    // Status Filter
    if (filterStatus !== 'all') {
      result = result.filter((t) => t.status === filterStatus);
    }

    // Sorting
    const priorityWeight: Record<TaskPriority, number> = {
      urgent: 4,
      high: 3,
      medium: 2,
      low: 1,
    };

    result.sort((a, b) => {
      if (sortOption === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortOption === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortOption === 'priority') {
        const pa = priorityWeight[a.priority || 'medium'];
        const pb = priorityWeight[b.priority || 'medium'];
        return pb - pa;
      }
      if (sortOption === 'due-date') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      }
      if (sortOption === 'alphabetical') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    return result;
  }, [tasks, searchQuery, filterPriority, filterStatus, sortOption]);

  // Group filtered tasks by status
  const todoTasks = filteredTasks.filter((t) => t.status === 'todo');
  const inProgressTasks = filteredTasks.filter((t) => t.status === 'in-progress');
  const doneTasks = filteredTasks.filter((t) => t.status === 'done');

  const totalCompletedCount = tasks.filter((t) => t.status === 'done').length;
  const completionPercentage = tasks.length > 0 ? Math.round((totalCompletedCount / tasks.length) * 100) : 0;

  // Dynamic greeting
  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  const userFirst = currentUser?.displayName?.split(' ')[0] || (currentUser?.email ? currentUser.email.split('@')[0] : 'Guest');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 flex flex-col font-sans selection:bg-indigo-500/20 selection:text-indigo-600 dark:selection:bg-indigo-500/30 dark:selection:text-indigo-300 transition-colors duration-200">
      {/* Top Navigation Bar */}
      <header className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-slate-200/90 dark:border-zinc-800 sticky top-0 z-30 transition-colors shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-600/20">
              <CheckSquare2 className="w-5 h-5 stroke-[2.4]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                  TaskFlow
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60">
                  v2.0
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
                Modern Task & Board Management
              </p>
            </div>
          </div>

          {/* Search Input in Header (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-md mx-4 relative items-center">
            <Search className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks, tags... (Press /)"
              className="w-full pl-9 pr-8 py-1.5 bg-slate-100 dark:bg-zinc-800/70 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-500 border border-slate-200/80 dark:border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 p-0.5 rounded-md cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right Action / Auth Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Sync Status Badge */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700/60 text-xs font-semibold text-slate-700 dark:text-zinc-300">
              <Database className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>{isFirestoreConnected ? 'Cloud Synced' : 'Local Storage'}</span>
              <span className={`w-2 h-2 rounded-full ${isFirestoreConnected ? 'bg-emerald-500 animate-pulse' : 'bg-emerald-500'}`}></span>
            </div>

            {/* Keyboard Shortcuts button */}
            <button
              onClick={() => setIsShortcutsOpen(true)}
              className="hidden sm:inline-flex p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 transition-colors cursor-pointer"
              title="Keyboard shortcuts (?)"
            >
              <Keyboard className="w-4 h-4" />
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 transition-colors cursor-pointer"
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* User Profile Menu */}
            <UserMenu
              user={currentUser}
              tasks={tasks}
              theme={theme}
              onSetTheme={setTheme}
              onOpenAuth={openAuth}
              onOpenShortcuts={() => setIsShortcutsOpen(true)}
            />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col">
        {/* Mobile Search Bar */}
        <div className="md:hidden mb-4 relative">
          <Search className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks, tags..."
            className="w-full pl-9 pr-8 py-2.5 bg-white dark:bg-zinc-900 rounded-2xl text-sm text-slate-800 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-500 border border-slate-200 dark:border-zinc-800 focus:outline-none focus:border-indigo-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Productivity HUD & Welcome Banner */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-4 sm:p-5 rounded-3xl border border-slate-200/90 dark:border-zinc-800 shadow-xs">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>{greeting}, {userFirst}!</span>
              {completionPercentage === 100 && tasks.length > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-400 font-semibold">
                  All done! 🎉
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              {tasks.length === 0
                ? "No tasks on your board. Add your first task below!"
                : `${totalCompletedCount} of ${tasks.length} tasks completed (${completionPercentage}%) • Saved automatically`}
            </p>
          </div>

          {/* Progress Bar & Quick Stats */}
          {tasks.length > 0 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 min-w-[260px]">
              <div className="w-full sm:w-44 bg-slate-100 dark:bg-zinc-800 rounded-full h-2.5 overflow-hidden border border-slate-200/60 dark:border-zinc-700/60">
                <div
                  className="bg-indigo-600 dark:bg-indigo-500 h-2.5 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className="px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800/40">
                  {tasks.filter((t) => t.status === 'todo').length} To Do
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-sky-50 text-sky-800 border border-sky-200 dark:bg-sky-950/60 dark:text-sky-400 dark:border-sky-800/40">
                  {tasks.filter((t) => t.status === 'in-progress').length} In Prog
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800/40">
                  {totalCompletedCount} Done
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Task Creator Component */}
        <TaskInput onAddTask={handleAddTask} />

        {/* Filter & Sort Toolbar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Priority filter pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-500 dark:text-zinc-500 font-semibold mr-1 flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Filter:
            </span>

            {(['all', 'urgent', 'high', 'medium', 'low'] as FilterPriority[]).map((p) => {
              const isSelected = filterPriority === p;
              return (
                <button
                  type="button"
                  key={p}
                  onClick={() => setFilterPriority(p)}
                  className={`px-3 py-1 rounded-xl font-semibold capitalize transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-400 border border-slate-200/90 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  {p === 'all' ? 'All Priorities' : p}
                </button>
              );
            })}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-zinc-500 font-semibold">Sort by:</span>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 rounded-xl px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-zinc-300 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-2xs"
            >
              <option value="newest">🕒 Newest first</option>
              <option value="oldest">⏳ Oldest first</option>
              <option value="priority">🔥 Highest priority</option>
              <option value="due-date">📅 Due date</option>
              <option value="alphabetical">🔤 Alphabetical</option>
            </select>
          </div>
        </div>

        {/* Kanban Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 items-start">
          <Column
            id="todo"
            title="To Do"
            tasks={todoTasks}
            totalTasksCount={tasks.length}
            onUpdateStatus={handleUpdateStatus}
            onDelete={handleDeleteTask}
            onEditTask={(task) => setEditingTask(task)}
            onInlineUpdateTitle={handleInlineUpdateTitle}
            onQuickAdd={(status) => handleAddTask('New pending item', { status })}
          />

          <Column
            id="in-progress"
            title="In Progress"
            tasks={inProgressTasks}
            totalTasksCount={tasks.length}
            onUpdateStatus={handleUpdateStatus}
            onDelete={handleDeleteTask}
            onEditTask={(task) => setEditingTask(task)}
            onInlineUpdateTitle={handleInlineUpdateTitle}
            onQuickAdd={(status) => handleAddTask('New in-progress task', { status })}
          />

          <Column
            id="done"
            title="Completed"
            tasks={doneTasks}
            totalTasksCount={tasks.length}
            onUpdateStatus={handleUpdateStatus}
            onDelete={handleDeleteTask}
            onEditTask={(task) => setEditingTask(task)}
            onInlineUpdateTitle={handleInlineUpdateTitle}
            onClearColumn={handleClearCompleted}
          />
        </div>

        {/* Summary Footer */}
        <footer className="mt-12 text-center text-xs text-slate-500 dark:text-zinc-500 font-medium flex items-center justify-center gap-3 py-4">
          <span>
            Total {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} • {doneTasks.length} completed
          </span>
          {currentUser && (
            <>
              <span>•</span>
              <span className="text-slate-600 dark:text-zinc-400">
                Signed in as <strong className="font-semibold text-slate-800 dark:text-zinc-300">{currentUser.email || currentUser.displayName}</strong>
              </span>
            </>
          )}
        </footer>
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultMode={authModalMode}
      />

      {/* Task Edit Modal */}
      <TaskEditModal
        task={editingTask}
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        onSave={handleSaveTaskDetails}
      />

      {/* Keyboard Shortcuts Cheat Sheet Modal */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Toast Notification Layer */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
