import React from 'react';
import { X, Command, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'N', description: 'Focus quick task creator' },
    { key: '/', description: 'Quick search tasks' },
    { key: 'D', description: 'Toggle Dark / Light mode' },
    { key: '?', description: 'Open this keyboard guide' },
    { key: 'Esc', description: 'Close modal or cancel editing' },
    { key: '↵ Enter', description: 'Submit new task / save changes' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Keyboard className="w-4 h-4" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-zinc-100">
              Keyboard Shortcuts
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 divide-y divide-slate-100 dark:divide-zinc-800/80">
          {shortcuts.map((s) => (
            <div key={s.key} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
              <span className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400">
                {s.description}
              </span>
              <kbd className="px-2.5 py-1 text-xs font-semibold text-slate-800 dark:text-zinc-200 bg-slate-100 dark:bg-zinc-800 border border-slate-300/80 dark:border-zinc-700 rounded-md shadow-xs">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="px-6 py-3.5 bg-slate-50 dark:bg-zinc-900/50 border-t border-slate-100 dark:border-zinc-800 text-center">
          <p className="text-xs text-slate-400 dark:text-zinc-500">
            Press <kbd className="px-1.5 py-0.5 text-[10px] bg-slate-200 dark:bg-zinc-800 rounded">Esc</kbd> anytime to dismiss
          </p>
        </div>
      </div>
    </div>
  );
};
