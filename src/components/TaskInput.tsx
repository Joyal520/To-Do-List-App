import React, { useState, useRef, useEffect } from 'react';
import { Plus, Loader2, Flag, Tag, Calendar, ChevronDown, Sparkles, X } from 'lucide-react';
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
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [tag, setTag] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Quick preset categories
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
      description: description.trim() || undefined,
      status: defaultStatus,
    });
    setIsSubmitting(false);

    if (success) {
      setTitle('');
      setDescription('');
      setTag('');
      setDueDate('');
      setPriority('medium');
      setIsExpanded(false);
    }
  };

  const priorityColors: Record<TaskPriority, { label: string; activeClass: string; dotClass: string }> = {
    low: {
      label: 'Low',
      activeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700/60',
      dotClass: 'bg-emerald-500',
    },
    medium: {
      label: 'Medium',
      activeClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700/60',
      dotClass: 'bg-amber-500',
    },
    high: {
      label: 'High',
      activeClass: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-700/60',
      dotClass: 'bg-orange-500',
    },
    urgent: {
      label: 'Urgent',
      activeClass: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-700/60',
      dotClass: 'bg-rose-500 animate-pulse',
    },
  };

  return (
    <div className="w-full max-w-3xl mx-auto mb-8">
      <form
        onSubmit={handleSubmit}
        className={`bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-2xl border transition-all duration-200 shadow-md ${
          isExpanded
            ? 'border-indigo-500/80 ring-3 ring-indigo-500/10 shadow-indigo-500/5'
            : 'border-slate-200/90 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700'
        }`}
      >
        {/* Main Input Row */}
        <div className="flex items-center gap-2 p-2 sm:p-2.5">
          <div className="pl-2 sm:pl-3 text-indigo-600 dark:text-indigo-400">
            <Sparkles className="w-5 h-5 opacity-75" />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            placeholder="Add a new task... (e.g., Launch beta version, Review feedback)"
            className="flex-1 px-2.5 py-2.5 bg-transparent text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 text-sm sm:text-base font-medium focus:outline-none"
            disabled={isSubmitting}
          />

          {/* Quick Expand Toggle on Mobile */}
          {!isExpanded && (
            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              className="text-xs text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 hidden sm:inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Options</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!title.trim() || isSubmitting}
            className="inline-flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 disabled:from-slate-200 disabled:to-slate-200 dark:disabled:from-zinc-800 dark:disabled:to-zinc-800 disabled:text-slate-400 dark:disabled:text-zinc-600 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-all active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span className="hidden sm:inline">Add Task</span>
              </>
            )}
          </button>
        </div>

        {/* Expanded Options Tray */}
        {isExpanded && (
          <div className="px-3 pb-3 sm:px-4 sm:pb-4 pt-1 border-t border-slate-100 dark:border-zinc-800/80 animate-in fade-in slide-in-from-top-1 duration-150 space-y-3">
            {/* Optional Description / Sub-notes */}
            <div>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional notes or context..."
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-zinc-800/50 rounded-lg text-xs text-slate-700 dark:text-zinc-300 placeholder-slate-400 dark:placeholder-zinc-500 border border-slate-200/60 dark:border-zinc-700/50 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Attributes Selector Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              {/* Priority Selector */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-slate-400 dark:text-zinc-500 font-medium mr-1 flex items-center gap-1">
                  <Flag className="w-3 h-3" /> Priority:
                </span>
                {(['low', 'medium', 'high', 'urgent'] as TaskPriority[]).map((p) => {
                  const isSelected = priority === p;
                  return (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setPriority(p)}
                      className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? `${priorityColors[p].activeClass} shadow-xs font-semibold`
                          : 'border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${priorityColors[p].dotClass}`} />
                      {priorityColors[p].label}
                    </button>
                  );
                })}
              </div>

              {/* Due Date & Tag Pickers */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Due Date */}
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60 rounded-lg px-2.5 py-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
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
                      className="text-slate-400 hover:text-rose-500"
                      title="Clear date"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Tag Input */}
                <div className="flex items-center gap-1 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60 rounded-lg px-2.5 py-1">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    placeholder="Tag (e.g. Work)"
                    className="w-20 bg-transparent text-xs text-slate-700 dark:text-zinc-300 placeholder-slate-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Quick Tag presets */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-slate-400 dark:text-zinc-500">Quick tags:</span>
                {presetTags.map((t) => (
                  <button
                    type="button"
                    key={t}
                    onClick={() => setTag(t)}
                    className={`px-2 py-0.5 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                      tag === t
                        ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                        : 'bg-slate-100 dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    #{t}
                  </button>
                ))}
              </div>

              <div className="text-[11px] text-slate-400 dark:text-zinc-500 hidden sm:block">
                Press <kbd className="font-mono bg-slate-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-[10px]">↵ Enter</kbd> to add
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
