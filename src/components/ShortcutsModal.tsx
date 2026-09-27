import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: '/', description: 'Quick search tasks' },
    { key: '?', description: 'Open this keyboard guide' },
    { key: 'Esc', description: 'Close modal or blur input' },
    { key: '↵ Enter', description: 'Submit new task' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Keyboard className="w-4 h-4" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">
              Keyboard Shortcuts
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 divide-y divide-slate-100">
          {shortcuts.map((s) => (
            <div key={s.key} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
              <span className="text-xs sm:text-sm text-slate-600">
                {s.description}
              </span>
              <kbd className="px-2.5 py-1 text-xs font-semibold text-slate-800 bg-slate-100 border border-slate-300 rounded-md shadow-2xs font-mono">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400">
            Press <kbd className="px-1.5 py-0.5 text-[10px] bg-slate-200 rounded font-mono">Esc</kbd> anytime to dismiss
          </p>
        </div>
      </div>
    </div>
  );
};
