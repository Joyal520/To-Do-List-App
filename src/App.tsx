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
  Layers,
  X,
  Plus,
  Flame,
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signup' | 'signin'>('signup');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
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

  // Theme Management
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('taskflow_theme') as ThemeMode;
      if (saved) return saved;
    }
    return 'system';
  });

  const searchInputRef = useRef<HTMLInputElement>(null);

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
      // Don't trigger if typing in an input or textarea
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        if (e.key === 'Escape') {
          target.blur();
        }
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

  // Listen for Tasks in Firestore
  useEffect(() => {
    if (authLoading) return;

    setTasksLoading(true);
    setError(null);

    const tasksRef = collection(db, 'tasks');
    const targetUserId = currentUser ? currentUser.uid : 'guest';
    const q = query(tasksRef, where('userId', '==', targetUserId));

    const unsubscribeTasks = onSnapshot(
      q,
      (snapshot) => {
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

        setTasks(fetchedTasks);
        setTasksLoading(false);
      },
      (err) => {
        console.error('Error fetching tasks from Firestore:', err);
        setError('Failed to connect to Firebase Firestore. Please check your network connection.');
        setTasksLoading(false);
      }
    );

    return () => unsubscribeTasks();
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
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        setError(err.message || 'Could not sign in with Google.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Add Task to Firestore
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
    try {
      const now = new Date().toISOString();
      const currentUid = currentUser ? currentUser.uid : 'guest';
      const currentEmail = currentUser ? currentUser.email || '' : '';

      await addDoc(collection(db, 'tasks'), {
        title,
        description: options?.description || '',
        status: options?.status || 'todo',
        priority: options?.priority || 'medium',
        tag: options?.tag || '',
        dueDate: options?.dueDate || null,
        userId: currentUid,
        userEmail: currentEmail,
        createdAt: now,
        updatedAt: now,
      });

      addToast('success', `Added task "${title}"`);
      return true;
    } catch (err) {
      console.error('Error adding task:', err);
      addToast('error', 'Could not add task. Please check your connection.');
      return false;
    }
  };

  // Update Task Status
  const handleUpdateStatus = async (taskId: string, newStatus: TaskStatus): Promise<void> => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });

      const label = newStatus === 'done' ? 'Completed' : newStatus === 'in-progress' ? 'Started' : 'Moved to To Do';
      addToast('info', `Task ${label}`);
    } catch (err) {
      console.error('Error updating task status:', err);
      addToast('error', 'Could not update task status.');
    }
  };

  // Save full edits from TaskEditModal
  const handleSaveTaskDetails = async (taskId: string, updates: Partial<Task>): Promise<void> => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
      addToast('success', 'Task details updated');
    } catch (err) {
      console.error('Error updating task details:', err);
      addToast('error', 'Failed to save changes.');
    }
  };

  // Inline rename title
  const handleInlineUpdateTitle = async (taskId: string, newTitle: string): Promise<void> => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, {
        title: newTitle,
        updatedAt: new Date().toISOString(),
      });
      addToast('success', 'Task renamed');
    } catch (err) {
      console.error('Error renaming task:', err);
      addToast('error', 'Failed to rename task.');
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskId: string): Promise<void> => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await deleteDoc(taskRef);
      addToast('info', 'Task removed');
    } catch (err) {
      console.error('Error deleting task:', err);
      addToast('error', 'Could not delete task.');
    }
  };

  // Clear completed tasks
  const handleClearCompleted = async () => {
    const doneList = tasks.filter((t) => t.status === 'done');
    if (doneList.length === 0) return;
    if (!window.confirm(`Clear all ${doneList.length} completed tasks?`)) return;

    try {
      for (const t of doneList) {
        await deleteDoc(doc(db, 'tasks', t.id));
      }
      addToast('success', `Cleared ${doneList.length} completed tasks`);
    } catch (err) {
      console.error('Error clearing tasks:', err);
      addToast('error', 'Failed to clear completed tasks.');
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

    // Status Filter (if used)
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
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 flex flex-col font-sans selection:bg-indigo-500/20 selection:text-indigo-600 dark:selection:bg-indigo-500/30 dark:selection:text-indigo-300 transition-colors duration-200 bg-grid-pattern">
      {/* Top Navigation Bar */}
      <header className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-zinc-800 sticky top-0 z-30 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-sky-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <CheckSquare2 className="w-5 h-5 stroke-[2.4]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                  TaskFlow
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60">
                  v2.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-zinc-400 font-medium">
                Modern Kanban & Cloud Sync
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
              placeholder="Search tasks, tags, notes... (Press /)"
              className="w-full pl-9 pr-8 py-1.5 bg-slate-100/80 dark:bg-zinc-800/70 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-500 border border-transparent focus:border-indigo-500/80 focus:bg-white dark:focus:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
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
            {/* Real-time Status Badge */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-zinc-800/80 border border-slate-200/70 dark:border-zinc-700/60 text-xs font-semibold text-slate-700 dark:text-zinc-300">
              <Database className="w-3.5 h-3.5 text-indigo-500" />
              <span>{currentUser ? 'Firestore Synced' : 'Guest Mode'}</span>
              <span className={`w-2 h-2 rounded-full ${currentUser ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`}></span>
            </div>

            {/* Keyboard Shortcuts button */}
            <button
              onClick={() => setIsShortcutsOpen(true)}
              className="hidden sm:inline-flex p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200/60 dark:border-zinc-800 transition-colors cursor-pointer"
              title="Keyboard shortcuts (?)"
            >
              <Keyboard className="w-4 h-4" />
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200/60 dark:border-zinc-800 transition-colors cursor-pointer"
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
            placeholder="Search tasks, tags, notes..."
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

        {/* Guest Announcement / Sign-up Callout */}
        {!currentUser && !authLoading && (
          <div className="mb-6 p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-indigo-500/10 via-sky-500/5 to-emerald-500/10 border border-indigo-200/80 dark:border-indigo-900/50 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4 backdrop-blur-xs">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-indigo-500/15 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-zinc-100">
                  Save and sync your tasks across all devices
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Sign in with Google to back up your boards permanently in Firebase cloud.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0">
              <button
                type="button"
                onClick={handleQuickGoogleSignIn}
                disabled={isGoogleLoading}
                className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2.5 px-4 py-2.5 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 dark:border-zinc-700 shadow-xs transition-all cursor-pointer disabled:opacity-60"
              >
                {isGoogleLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                ) : (
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>Continue with Google</span>
              </button>

              <button
                type="button"
                onClick={() => openAuth('signup')}
                className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 px-2.5 py-2 cursor-pointer"
              >
                <span>Other options</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center gap-3 text-xs sm:text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Productivity HUD & Welcome Banner */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-zinc-800 shadow-xs">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>{greeting}, {userFirst}!</span>
              {completionPercentage === 100 && tasks.length > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 font-semibold">
                  All done! 🎉
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              {tasks.length === 0
                ? "No tasks on your board. Create your first task below!"
                : `${totalCompletedCount} of ${tasks.length} tasks completed (${completionPercentage}%)`}
            </p>
          </div>

          {/* Progress Bar & Quick Stats */}
          {tasks.length > 0 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 min-w-[260px]">
              <div className="w-full sm:w-44 bg-slate-200 dark:bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-2.5 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40">
                  {tasks.filter((t) => t.status === 'todo').length} To Do
                </span>
                <span className="px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-200/60 dark:border-sky-800/40">
                  {tasks.filter((t) => t.status === 'in-progress').length} In Prog
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
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
            <span className="text-slate-400 dark:text-zinc-500 font-semibold mr-1 flex items-center gap-1">
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
                      : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-slate-200/80 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  {p === 'all' ? 'All Priorities' : p}
                </button>
              );
            })}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 dark:text-zinc-500 font-semibold">Sort by:</span>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-xl px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-zinc-300 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-xs"
            >
              <option value="newest">🕒 Newest first</option>
              <option value="oldest">⏳ Oldest first</option>
              <option value="priority">🔥 Highest priority</option>
              <option value="due-date">📅 Due date</option>
              <option value="alphabetical">🔤 Alphabetical</option>
            </select>
          </div>
        </div>

        {/* Loading State Indicator */}
        {tasksLoading || authLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-24 text-slate-400 dark:text-zinc-500 gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
            <p className="text-sm font-semibold">Syncing with Firestore...</p>
          </div>
        ) : (
          /* Kanban Columns */
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
        )}

        {/* Summary Footer */}
        {!tasksLoading && !authLoading && (
          <footer className="mt-12 text-center text-xs text-slate-400 dark:text-zinc-500 font-medium flex items-center justify-center gap-3 py-4">
            <span>
              Total {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} • {doneTasks.length} completed
            </span>
            {currentUser && (
              <>
                <span>•</span>
                <span className="text-slate-500 dark:text-zinc-400">
                  Signed in as <strong className="font-semibold text-slate-700 dark:text-zinc-300">{currentUser.email || currentUser.displayName}</strong>
                </span>
              </>
            )}
          </footer>
        )}
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
