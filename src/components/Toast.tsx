import React from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((t) => {
        const icons = {
          success: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />,
          info: <Info className="w-4 h-4 text-sky-500 shrink-0" />,
          warning: <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />,
          error: <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />,
        };

        const borders = {
          success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200',
          info: 'border-sky-500/30 bg-sky-500/10 text-sky-950 dark:text-sky-200',
          warning: 'border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-200',
          error: 'border-rose-500/30 bg-rose-500/10 text-rose-950 dark:text-rose-200',
        };

        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border shadow-lg shadow-black/5 dark:shadow-black/20 ${borders[t.type]} transition-all animate-in fade-in slide-in-from-bottom-2 duration-200`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {icons[t.type]}
              <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-zinc-200 truncate">
                {t.message}
              </p>
            </div>
            <button
              onClick={() => onDismiss(t.id)}
              className="text-slate-400 hover:text-slate-600 dark:text-zinc-400 dark:hover:text-zinc-200 p-0.5 rounded-md transition-colors"
              aria-label="Dismiss toast"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
