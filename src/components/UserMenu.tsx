import React, { useState, useRef, useEffect } from 'react';
import { User, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import {
  LogOut,
  User as UserIcon,
  ChevronDown,
  Check,
  Download,
  Moon,
  Sun,
  Laptop,
  Keyboard,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { ThemeMode, Task } from '../types';

interface UserMenuProps {
  user: User | null;
  tasks: Task[];
  theme: ThemeMode;
  onSetTheme: (theme: ThemeMode) => void;
  onOpenAuth: (mode: 'signup' | 'signin') => void;
  onOpenShortcuts: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({
  user,
  tasks,
  theme,
  onSetTheme,
  onOpenAuth,
  onOpenShortcuts,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setIsOpen(false);
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(tasks, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `taskflow-backup-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setIsOpen(false);
  };

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => onOpenAuth('signin')}
          className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          Sign In
        </button>
        <button
          onClick={() => onOpenAuth('signup')}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white px-3.5 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Sign Up</span>
        </button>
      </div>
    );
  }

  const displayName = user.displayName || user.email?.split('@')[0] || 'User';
  const email = user.email || '';
  const photoURL = user.photoURL;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200/80 dark:border-zinc-800 transition-colors cursor-pointer text-left group"
        aria-expanded={isOpen}
      >
        <div className="relative">
          {photoURL ? (
            <img
              src={photoURL}
              alt={displayName}
              className="w-7 h-7 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-zinc-700"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900"></span>
        </div>

        <span className="hidden sm:block text-xs font-semibold text-slate-800 dark:text-zinc-200 max-w-[110px] truncate">
          {displayName}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-zinc-300 transition-transform duration-200" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-slate-100 dark:border-zinc-800 py-1.5 z-30 animate-in fade-in slide-in-from-top-1">
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-slate-100 dark:border-zinc-800">
            <p className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate">{displayName}</p>
            {email && <p className="text-[11px] text-slate-400 dark:text-zinc-400 truncate mt-0.5">{email}</p>}
            <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
              <ShieldCheck className="w-3 h-3" />
              <span>Firebase Synced</span>
            </div>
          </div>

          {/* Theme Mode Selector */}
          <div className="px-4 py-2.5 border-b border-slate-100 dark:border-zinc-800">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-zinc-500 mb-1.5 block">
              Theme Mode
            </span>
            <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-zinc-800/80 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => onSetTheme('light')}
                className={`py-1 text-xs font-medium rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400'
                }`}
              >
                <Sun className="w-3 h-3" />
                <span>Light</span>
              </button>
              <button
                type="button"
                onClick={() => onSetTheme('dark')}
                className={`py-1 text-xs font-medium rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-zinc-900 text-white shadow-xs font-semibold'
                    : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400'
                }`}
              >
                <Moon className="w-3 h-3" />
                <span>Dark</span>
              </button>
              <button
                type="button"
                onClick={() => onSetTheme('system')}
                className={`py-1 text-xs font-medium rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  theme === 'system'
                    ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                    : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400'
                }`}
              >
                <Laptop className="w-3 h-3" />
                <span>Auto</span>
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="py-1">
            <button
              onClick={handleExportJSON}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Export Tasks Backup (JSON)</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                onOpenShortcuts();
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer"
            >
              <Keyboard className="w-3.5 h-3.5 text-slate-400" />
              <span>Keyboard Shortcuts</span>
            </button>
          </div>

          {/* Sign Out */}
          <div className="pt-1 border-t border-slate-100 dark:border-zinc-800">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
