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
import { onAuthStateChanged, User } from 'firebase/auth';
import { db, auth } from './firebase';
import { Task, TaskStatus, TaskPriority, FilterPriority, SortOption } from './types';
import { TaskInput } from './components/TaskInput';
import { Column } from './components/Column';
import { AuthModal } from './components/AuthModal';
import { UserMenu } from './components/UserMenu';
import { TaskEditModal } from './components/TaskEditModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import {
  CheckSquare2,
  Database,
  Search,
  SlidersHorizontal,
  Keyboard,
  X,
  Sparkles,
} from 'lucide-react';

const LOCAL_STORAGE_TASKS_KEY = 'taskflow_tasks_v2';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signup' | 'signin'>('signup');

  // Instant local state initialization
  const [tasks, setTasks] = useState<Task[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_TASKS_KEY);
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.error('Error loading tasks:', e);
      }
    }
    return [
      {
        id: 'sample-1',
        title: 'Explore the liquid glassmorphism design',
        status: 'todo',
        priority: 'high',
        tag: 'Design',
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

  // Search, Filter & Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<FilterPriority>('all');
  const [sortOption, setSortOption] = useState<SortOption>('newest');

  // Modals & Interactive State
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sync tasks to local storage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_TASKS_KEY, JSON.stringify(tasks));
    } catch (e) {
      console.error('Error writing to localStorage:', e);
    }
  }, [tasks]);

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
    }, 3000);
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

  // Listen for Tasks in Firestore (with offline fallback)
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

          if (fetchedTasks.length > 0) {
            setTasks(fetchedTasks);
          }
        },
        (err) => {
          console.warn('Firestore sync notice (local storage mode active):', err);
          setIsFirestoreConnected(false);
        }
      );

      return () => unsubscribeTasks();
    } catch (e) {
      console.warn('Firestore fallback to local storage:', e);
      setIsFirestoreConnected(false);
    }
  }, [currentUser, authLoading]);

  // Add Task
  const handleAddTask = async (
    title: string,
    options?: {
      priority?: TaskPriority;
      tag?: string;
      dueDate?: string;
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
      status: options?.status || 'todo',
      priority: options?.priority || 'medium',
      tag: options?.tag || '',
      dueDate: options?.dueDate,
      createdAt: now,
      updatedAt: now,
      userId: currentUid,
      userEmail: currentEmail,
    };

    setTasks((prev) => [newTask, ...prev]);
    addToast('success', `Added task "${trimmed}"`);

    try {
      const docRef = await addDoc(collection(db, 'tasks'), {
        title: newTask.title,
        status: newTask.status,
        priority: newTask.priority,
        tag: newTask.tag,
        dueDate: newTask.dueDate || null,
        userId: currentUid,
        userEmail: currentEmail,
        createdAt: now,
        updatedAt: now,
      });

      setTasks((prev) =>
        prev.map((t) => (t.id === tempId ? { ...t, id: docRef.id } : t))
      );
    } catch (err) {
      console.warn('Saved locally (cloud sync pending):', err);
    }

    return true;
  };

  // Update Task Status
  const handleUpdateStatus = async (taskId: string, newStatus: TaskStatus): Promise<void> => {
    const now = new Date().toISOString();

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus, updatedAt: now } : t))
    );

    const label = newStatus === 'done' ? 'Completed' : newStatus === 'in-progress' ? 'Started' : 'Moved to To Do';
    addToast('info', `Task ${label}`);

    try {
      if (!taskId.startsWith('task_') && !taskId.startsWith('sample-')) {
        const taskRef = doc(db, 'tasks', taskId);
        await updateDoc(taskRef, {
          status: newStatus,
          updatedAt: now,
        });
      }
    } catch (err) {
      console.warn('Updated locally:', err);
    }
  };

  // Save edits from TaskEditModal
  const handleSaveTaskDetails = async (taskId: string, updates: Partial<Task>): Promise<void> => {
    const now = new Date().toISOString();

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...updates, updatedAt: now } : t))
    );
    addToast('success', 'Task updated');

    try {
      if (!taskId.startsWith('task_') && !taskId.startsWith('sample-')) {
        const taskRef = doc(db, 'tasks', taskId);
        await updateDoc(taskRef, {
          ...updates,
          updatedAt: now,
        });
      }
    } catch (err) {
      console.warn('Saved locally:', err);
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
    addToast('info', 'Task deleted');

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

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.tag && t.tag.toLowerCase().includes(q)) ||
          (t.description && t.description.toLowerCase().includes(q))
      );
    }

    if (filterPriority !== 'all') {
      result = result.filter((t) => (t.priority || 'medium') === filterPriority);
    }

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
  }, [tasks, searchQuery, filterPriority, sortOption]);

  const todoTasks = filteredTasks.filter((t) => t.status === 'todo');
  const inProgressTasks = filteredTasks.filter((t) => t.status === 'in-progress');
  const doneTasks = filteredTasks.filter((t) => t.status === 'done');

  const totalCompletedCount = tasks.filter((t) => t.status === 'done').length;
  const completionPercentage = tasks.length > 0 ? Math.round((totalCompletedCount / tasks.length) * 100) : 0;

  const userFirst = currentUser?.displayName?.split(' ')[0] || (currentUser?.email ? currentUser.email.split('@')[0] : 'Guest');

  return (
    <div className="relative min-h-screen bg-[#f6f8fc] text-slate-900 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Ambient Liquid Glow Background Orbs */}
      <div className="liquid-blob-1" />
      <div className="liquid-blob-2" />
      <div className="liquid-blob-3" />

      {/* Floating Glass Navigation Header */}
      <div className="sticky top-0 z-30 px-4 sm:px-6 pt-3.5 pb-2">
        <header className="max-w-7xl mx-auto glass-panel rounded-2xl px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4 transition-all">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-700 via-indigo-600 to-sky-600 flex items-center justify-center text-white shadow-sm shadow-indigo-600/30">
              <CheckSquare2 className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-extrabold tracking-tight text-slate-950 leading-tight">
                  TaskFlow
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-900 border border-indigo-300">
                  v2.0
                </span>
              </div>
              <p className="text-[11px] text-slate-600 font-semibold">
                Modern Task Management
              </p>
            </div>
          </div>

          {/* Search Box (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-md mx-4 relative items-center">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks, tags... (Press /)"
              className="w-full pl-9 pr-8 py-2 bg-white/90 focus:bg-white border border-slate-300 focus:border-indigo-600 rounded-xl text-xs sm:text-sm text-slate-950 font-semibold placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/15 transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Cloud Sync Status Pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/95 border border-slate-200 text-xs font-bold text-slate-900 shadow-2xs">
              <Database className="w-3.5 h-3.5 text-indigo-700" />
              <span>{isFirestoreConnected ? 'Cloud Synced' : 'Local Storage'}</span>
              <span className={`w-2 h-2 rounded-full ${isFirestoreConnected ? 'bg-emerald-500 animate-pulse' : 'bg-emerald-500'}`}></span>
            </div>

            {/* Keyboard Shortcuts Trigger */}
            <button
              onClick={() => setIsShortcutsOpen(true)}
              className="hidden sm:inline-flex p-2 rounded-xl text-slate-700 hover:text-slate-950 bg-white/90 hover:bg-white border border-slate-300 transition-colors cursor-pointer shadow-2xs"
              title="Keyboard shortcuts (?)"
            >
              <Keyboard className="w-4 h-4" />
            </button>

            {/* User Menu & Auth */}
            <UserMenu
              user={currentUser}
              tasks={tasks}
              onOpenAuth={openAuth}
              onOpenShortcuts={() => setIsShortcutsOpen(true)}
            />
          </div>
        </header>
      </div>

      {/* Main Content */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-col">
        {/* Mobile Search */}
        <div className="md:hidden mb-4 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className="w-full pl-9 pr-8 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-950 placeholder-slate-400 focus:outline-none focus:border-indigo-600"
          />
        </div>

        {/* Welcome / Progress Hero Section */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-5 sm:p-6 rounded-3xl">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-950 flex items-center gap-2">
              <span>Hello, {userFirst}!</span>
              {completionPercentage === 100 && tasks.length > 0 && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-950 border border-emerald-300 font-extrabold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-700" /> All completed!
                </span>
              )}
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 mt-1 font-semibold">
              {tasks.length === 0
                ? "No tasks yet. Create your first task below!"
                : `${totalCompletedCount} of ${tasks.length} tasks completed (${completionPercentage}%) • Saved automatically`}
            </p>
          </div>

          {/* Progress Visualization & High Contrast Pills */}
          {tasks.length > 0 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 min-w-[280px]">
              {/* Refined Progress Bar */}
              <div className="w-full sm:w-44 bg-slate-200 rounded-full h-3 overflow-hidden border border-slate-300 p-0.5 shadow-inner">
                <div
                  className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 h-full rounded-full transition-all duration-500 ease-out shadow-xs"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>

              {/* Counter Pills */}
              <div className="flex items-center gap-2 text-xs font-extrabold">
                <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-950 border border-amber-300 shadow-2xs">
                  {tasks.filter((t) => t.status === 'todo').length} TO DO
                </span>
                <span className="px-3 py-1 rounded-full bg-sky-100 text-sky-950 border border-sky-300 shadow-2xs">
                  {tasks.filter((t) => t.status === 'in-progress').length} IN PROGRESS
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-950 border border-emerald-300 shadow-2xs">
                  {totalCompletedCount} DONE
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Add Task Area */}
        <TaskInput onAddTask={handleAddTask} />

        {/* Filter and Sort Controls */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Priority filter pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-700 font-bold mr-1 flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-700" /> Filter:
            </span>

            {(['all', 'urgent', 'high', 'medium', 'low'] as FilterPriority[]).map((p) => {
              const isSelected = filterPriority === p;
              return (
                <button
                  type="button"
                  key={p}
                  onClick={() => setFilterPriority(p)}
                  className={`px-3.5 py-1.5 rounded-full font-bold capitalize transition-all cursor-pointer border ${
                    isSelected
                      ? 'liquid-btn text-white border-transparent shadow-md'
                      : 'bg-white/90 hover:bg-white text-slate-800 border-slate-300 hover:text-slate-950 hover:border-slate-400 shadow-2xs'
                  }`}
                >
                  {p === 'all' ? 'All Priorities' : p}
                </button>
              );
            })}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <span className="text-slate-700 font-bold">Sort by:</span>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="bg-white border border-slate-300 rounded-full px-3.5 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600 cursor-pointer shadow-2xs"
            >
              <option value="newest">🕒 Newest first</option>
              <option value="oldest">⏳ Oldest first</option>
              <option value="priority">🔥 Highest priority</option>
              <option value="due-date">📅 Due date</option>
              <option value="alphabetical">🔤 Alphabetical</option>
            </select>
          </div>
        </div>

        {/* Kanban Board Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 items-start">
          <Column
            id="todo"
            title="TO DO"
            tasks={todoTasks}
            totalTasksCount={tasks.length}
            onUpdateStatus={handleUpdateStatus}
            onDelete={handleDeleteTask}
            onEditTask={(task) => setEditingTask(task)}
            onInlineUpdateTitle={handleInlineUpdateTitle}
            onQuickAdd={(status) => handleAddTask('New pending task', { status })}
          />

          <Column
            id="in-progress"
            title="IN PROGRESS"
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
            title="COMPLETED"
            tasks={doneTasks}
            totalTasksCount={tasks.length}
            onUpdateStatus={handleUpdateStatus}
            onDelete={handleDeleteTask}
            onEditTask={(task) => setEditingTask(task)}
            onInlineUpdateTitle={handleInlineUpdateTitle}
            onClearColumn={handleClearCompleted}
          />
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-xs text-slate-600 font-bold flex items-center justify-center gap-3 py-4">
          <span>
            Total {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} • {doneTasks.length} completed
          </span>
          {currentUser && (
            <>
              <span>•</span>
              <span className="text-slate-800">
                Signed in as <strong className="font-extrabold text-slate-950">{currentUser.email || currentUser.displayName}</strong>
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

      {/* Shortcuts Modal */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Toast Notification Layer */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
