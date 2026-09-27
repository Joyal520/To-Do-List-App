import React, { useState, useRef, useEffect } from 'react';
import { User, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import {
  LogOut,
  ChevronDown,
  Download,
  Keyboard,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Task } from '../types';

interface UserMenuProps {
  user: User | null;
  tasks: Task[];
  onOpenAuth: (mode: 'signup' | 'signin') => void;
  onOpenShortcuts: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({
  user,
  tasks,
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
          className="text-xs sm:text-sm font-bold text-slate-800 hover:text-slate-950 px-3.5 py-2 rounded-xl hover:bg-slate-100/90 transition-colors cursor-pointer"
        >
          Sign In
        </button>
        <button
          onClick={() => onOpenAuth('signup')}
          className="liquid-btn inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-white px-4 py-2 rounded-xl shadow-md cursor-pointer tracking-wide"
        >
          <Sparkles className="w-4 h-4" />
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
        className="flex items-center gap-2 p-1 sm:px-3 sm:py-1.5 rounded-xl hover:bg-white border border-slate-300 transition-all cursor-pointer text-left bg-white/80 shadow-2xs"
        aria-expanded={isOpen}
      >
        {photoURL ? (
          <img
            src={photoURL}
            alt={displayName}
            className="w-7 h-7 rounded-full object-cover ring-2 ring-indigo-500/30"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-700 to-sky-600 text-white flex items-center justify-center font-extrabold text-xs shadow-xs">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}

        <span className="hidden sm:block text-xs font-bold text-slate-900 max-w-[120px] truncate">
          {displayName}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 py-1.5 z-30 animate-in fade-in duration-150">
          {/* User Details */}
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-xs font-bold text-slate-950 truncate">{displayName}</p>
            {email && <p className="text-[11px] text-slate-600 truncate mt-0.5 font-medium">{email}</p>}
            <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
              <ShieldCheck className="w-3 h-3 text-emerald-700" />
              <span>Firebase Synced</span>
            </div>
          </div>

          {/* Actions */}
          <div className="py-1">
            <button
              onClick={handleExportJSON}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export Tasks Backup (JSON)</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                onOpenShortcuts();
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Keyboard className="w-3.5 h-3.5 text-slate-500" />
              <span>Keyboard Shortcuts</span>
            </button>
          </div>

          {/* Sign Out */}
          <div className="pt-1 border-t border-slate-100">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
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
