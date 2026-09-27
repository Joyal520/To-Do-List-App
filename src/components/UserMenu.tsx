import React, { useState, useRef, useEffect } from 'react';
import { User, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { LogOut, User as UserIcon, ChevronDown, Check } from 'lucide-react';

interface UserMenuProps {
  user: User | null;
  onOpenAuth: (mode: 'signup' | 'signin') => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({ user, onOpenAuth }) => {
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

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => onOpenAuth('signin')}
          className="text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
        >
          Sign In
        </button>
        <button
          onClick={() => onOpenAuth('signup')}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold bg-sky-600 hover:bg-sky-700 text-white px-3.5 py-1.5 rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          Sign Up
        </button>
      </div>
    );
  }

  // Display user details
  const displayName = user.displayName || user.email?.split('@')[0] || 'User';
  const email = user.email || '';
  const photoURL = user.photoURL;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl hover:bg-slate-100 border border-slate-200/80 transition-colors cursor-pointer text-left"
        aria-expanded={isOpen}
      >
        {photoURL ? (
          <img
            src={photoURL}
            alt={displayName}
            className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="hidden sm:block text-xs font-semibold text-slate-800 max-w-[120px] truncate">
          {displayName}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-30 animate-in fade-in slide-in-from-top-1">
          <div className="px-4 py-2.5 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-800 truncate">{displayName}</p>
            {email && <p className="text-[11px] text-slate-400 truncate">{email}</p>}
          </div>

          <div className="px-4 py-2 text-[11px] text-emerald-600 flex items-center gap-1.5 bg-emerald-50/50">
            <Check className="w-3 h-3" />
            <span>Google Account Connected</span>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
};
