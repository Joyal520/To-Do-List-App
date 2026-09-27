import React, { useState, useRef } from 'react';
import { Plus, Loader2, Flag, Tag, Calendar, Sparkles, X, Check } from 'lucide-react';
import { TaskPriority, TaskStatus } from '../types';

interface TaskInputProps {
  onAddTask: (
    title: string,
    options?: {
      priority?: TaskPriority;
      tag?: string;
      dueDate?: string;
      description?: string;
      status?: TaskStatus;
    }
  ) => Promise<boolean>;
  defaultStatus?: TaskStatus;
}

export const TaskInput: React.FC<TaskInputProps> = ({ onAddTask, defaultStatus = 'todo' }) => {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [tag, setTag] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [showExtras, setShowExtras] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const presetTags = ['Work', 'Personal', 'Feature', 'Design', 'Urgent'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    const success = await onAddTask(trimmed, {
      priority,
      tag: tag.trim() || undefined,
      dueDate: dueDate || undefined,
      status: defaultStatus,
    });
    setIsSubmitting(false);

    if (success) {
      setTitle('');
      setTag('');
      setDueDate('');
      setPriority('medium');
      setShowExtras(false);
    }
  };

  const priorityConfig: Record<TaskPriority, { label: string; activeClass: string; dot: string }> = {
    low: {
      label: 'Low',
      activeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700',
      dot: 'bg-emerald-500',
    },
    medium: {
      label: 'Medium',
      activeClass: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700',
      dot: 'bg-amber-500',
    },
    high: {
      label: 'High',
      activeClass: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-700',
      dot: 'bg-orange-500',
    },
    urgent: {
      label: 'Urgent',
      activeClass: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-700',
      dot: 'bg-rose-500 animate-pulse',
    },
  };

  return (
    <div className="w-full max-w-3xl mx-auto mb-8">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/90 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all duration-200 p-2.5 sm:p-3 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10"
      >
        {/* Main Input & Submit Button */}
        <div className="flex items-center gap-2">
          <div className="pl-2 text-indigo-600 dark:text-indigo-400">
            <Sparkles className="w-5 h-5 opacity-80" />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add a new task (e.g., Design logo, Review pull request)..."
            className="flex-1 px-2 py-2 bg-transparent text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 text-sm sm:text-base font-medium focus:outline-none"
            disabled={isSubmitting}
            autoFocus
          />

          <button
            type="submit"
            disabled={!title.trim() || isSubmitting}
            className="inline-flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-600 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-all active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed shrink-0"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Add Task</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Options Bar: Priority + Tag + Due Date */}
        <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          {/* Priority Selection */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-400 dark:text-zinc-500 font-semibold flex items-center gap-1 text-[11px]">
              <Flag className="w-3 h-3" /> Priority:
            </span>
            {(['low', 'medium', 'high', 'urgent'] as TaskPriority[]).map((p) => {
              const isSelected = priority === p;
              return (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? `${priorityConfig[p].activeClass} shadow-2xs`
                      : 'border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/80'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${priorityConfig[p].dot}`} />
                  {priorityConfig[p].label}
                </button>
              );
            })}
          </div>

          {/* Tag & Date Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick preset tags */}
            <div className="hidden sm:flex items-center gap-1">
              {presetTags.map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setTag(tag === t ? '' : t)}
                  className={`px-2 py-0.5 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                    tag === t
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  #{t}
                </button>
              ))}
            </div>

            {/* Custom Tag Input */}
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/60 rounded-lg px-2 py-1">
              <Tag className="w-3 h-3 text-slate-400" />
              <input
                type="text"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="Tag"
                className="w-16 sm:w-20 bg-transparent text-xs text-slate-700 dark:text-zinc-300 placeholder-slate-400 focus:outline-none"
              />
            </div>

            {/* Due Date Picker */}
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/60 rounded-lg px-2 py-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="bg-transparent text-xs text-slate-700 dark:text-zinc-300 focus:outline-none cursor-pointer"
              />
              {dueDate && (
                <button
                  type="button"
                  onClick={() => setDueDate('')}
                  className="text-slate-400 hover:text-rose-500 ml-0.5"
                  title="Clear date"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
