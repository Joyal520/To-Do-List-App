import React, { useState, useEffect } from 'react';
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
import { Task, TaskStatus } from './types';
import { TaskInput } from './components/TaskInput';
import { Column } from './components/Column';
import { AuthModal } from './components/AuthModal';
import { UserMenu } from './components/UserMenu';
import {
  CheckSquare2,
  Database,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
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

  // Monitor auth state changes
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  // Listen for tasks in Firestore
  useEffect(() => {
    if (authLoading) return;

    setTasksLoading(true);
    setError(null);

    const tasksRef = collection(db, 'tasks');
    // If user is authenticated, query their tasks. Otherwise query tasks marked for guest
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
            status: (data.status as TaskStatus) || 'todo',
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt || new Date().toISOString(),
            userId: data.userId,
            userEmail: data.userEmail,
          };
        });

        // Client-side sort to guarantee newest tasks first without requiring a Firestore composite index
        fetchedTasks.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

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
    } catch (err: any) {
      console.error('Google Sign-in error:', err);
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        setError(err.message || 'Could not sign in with Google.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Add task to Firestore
  const handleAddTask = async (title: string): Promise<boolean> => {
    try {
      const now = new Date().toISOString();
      const currentUid = currentUser ? currentUser.uid : 'guest';
      const currentEmail = currentUser ? currentUser.email || '' : '';

      await addDoc(collection(db, 'tasks'), {
        title,
        status: 'todo',
        userId: currentUid,
        userEmail: currentEmail,
        createdAt: now,
        updatedAt: now,
      });
      return true;
    } catch (err) {
      console.error('Error adding task:', err);
      alert('Could not add task. Please check your connection.');
      return false;
    }
  };

  // Update task status in Firestore
  const handleUpdateStatus = async (taskId: string, newStatus: TaskStatus): Promise<void> => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Error updating task status:', err);
      alert('Could not update task status.');
    }
  };

  // Delete task from Firestore
  const handleDeleteTask = async (taskId: string): Promise<void> => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await deleteDoc(taskRef);
    } catch (err) {
      console.error('Error deleting task:', err);
      alert('Could not delete task.');
    }
  };

  const openAuth = (mode: 'signup' | 'signin') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  // Group tasks by status
  const todoTasks = tasks.filter((t) => t.status === 'todo');
  const inProgressTasks = tasks.filter((t) => t.status === 'in-progress');
  const doneTasks = tasks.filter((t) => t.status === 'done');

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans selection:bg-sky-100 selection:text-sky-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200/90 sticky top-0 z-20 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center text-white shadow-sm shadow-sky-600/20">
              <CheckSquare2 className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-tight">
                  TaskFlow
                </h1>
                {currentUser && (
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Synced
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Simple, reliable task tracking
              </p>
            </div>
          </div>

          {/* Right Action / Auth Controls */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200/80 text-xs font-medium text-slate-600">
              <Database className="w-3.5 h-3.5 text-sky-600" />
              <span>Firestore</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            </div>

            <UserMenu user={currentUser} onOpenAuth={openAuth} />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col">
        {/* Guest Announcement / Sign-up Callout */}
        {!currentUser && !authLoading && (
          <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-sky-50 via-white to-indigo-50/40 border border-sky-100 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center text-sky-600 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-semibold text-slate-800">
                  Save and sync your tasks across devices
                </h2>
                <p className="text-xs text-slate-500">
                  Sign up with Google to keep your To Do, In Progress, and Done boards saved permanently in the cloud.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0">
              {/* Continue with Google Quick Button */}
              <button
                type="button"
                onClick={handleQuickGoogleSignIn}
                disabled={isGoogleLoading}
                className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl border border-slate-300 hover:border-slate-400 shadow-xs transition-colors cursor-pointer disabled:opacity-60"
              >
                {isGoogleLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-sky-600" />
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
                className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-sky-700 hover:text-sky-800 px-2 py-2 cursor-pointer"
              >
                <span>Other options</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-3 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Task Entry Bar */}
        <TaskInput onAddTask={handleAddTask} />

        {/* Loading state indicator */}
        {tasksLoading || authLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
            <RefreshCw className="w-7 h-7 animate-spin text-sky-600" />
            <p className="text-sm font-medium">Syncing with Firestore...</p>
          </div>
        ) : (
          /* Kanban Columns */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 items-start">
            <Column
              id="todo"
              title="TO DO"
              tasks={todoTasks}
              onUpdateStatus={handleUpdateStatus}
              onDelete={handleDeleteTask}
            />

            <Column
              id="in-progress"
              title="IN PROGRESS"
              tasks={inProgressTasks}
              onUpdateStatus={handleUpdateStatus}
              onDelete={handleDeleteTask}
            />

            <Column
              id="done"
              title="DONE"
              tasks={doneTasks}
              onUpdateStatus={handleUpdateStatus}
              onDelete={handleDeleteTask}
            />
          </div>
        )}

        {/* Summary Footer bar */}
        {!tasksLoading && !authLoading && (
          <div className="mt-12 text-center text-xs text-slate-400 font-medium flex items-center justify-center gap-3">
            <span>
              Total {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} • {doneTasks.length} completed
            </span>
            {currentUser && (
              <>
                <span>•</span>
                <span className="text-slate-500">
                  Signed in as <strong className="font-semibold">{currentUser.email || currentUser.displayName}</strong>
                </span>
              </>
            )}
          </div>
        )}
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultMode={authModalMode}
      />
    </div>
  );
}
