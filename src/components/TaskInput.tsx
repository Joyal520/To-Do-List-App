import React, { useState, useRef } from 'react';
import { Plus, Loader2, Flag, Tag, Calendar, Sparkles, X } from 'lucide-react';
import { TaskPriority, TaskStatus } from '../types';

interface TaskInputProps {
  onAddTask: (
    title: string,
    options?: {
      priority?: TaskPriority;
      tag?: string;
      dueDate?: string;
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
    }
  };

  const priorityConfig: Record<TaskPriority, { label: string; activeClass: string; dot: string }> = {
    low: {
      label: 'Low',
      activeClass: 'bg-emerald-500/15 text-emerald-800 border-emerald-500/30 shadow-xs',
      dot: 'bg-emerald-500',
    },
    medium: {
      label: 'Medium',
      activeClass: 'bg-amber-500/15 text-amber-800 border-amber-500/30 shadow-xs',
      dot: 'bg-amber-500',
    },
    high: {
      label: 'High',
      activeClass: 'bg-orange-500/15 text-orange-800 border-orange-500/30 shadow-xs',
      dot: 'bg-orange-500',
    },
    urgent: {
      label: 'Urgent',
      activeClass: 'bg-rose-500/15 text-rose-800 border-rose-500/30 shadow-xs',
      dot: 'bg-rose-500 animate-pulse',
    },
  };

  return (
    <div className="w-full max-w-3xl mx-auto mb-8">
      <form
        onSubmit={handleSubmit}
        className="glass-card rounded-2xl border border-white/90 p-3 sm:p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_12px_36px_rgb(0,0,0,0.06)] transition-all duration-200"
      >
        {/* Main Input Row */}
        <div className="flex items-center gap-2.5">
          <div className="pl-2 text-indigo-600">
            <Sparkles className="w-5 h-5 opacity-80" />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add a new task (e.g. Design homepage hero, Review PR)..."
            className="flex-1 px-3 py-2.5 bg-slate-50/70 focus:bg-white rounded-xl text-slate-900 placeholder-slate-400 text-sm sm:text-base font-medium border border-slate-200/70 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-2xs"
            disabled={isSubmitting}
            autoFocus
          />

          <button
            type="submit"
            disabled={!title.trim() || isSubmitting}
            className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-indigo-600 via-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs hover:shadow-md transition-all active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed shrink-0"
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

        {/* Options Row */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          {/* Priority selector pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-400 font-semibold flex items-center gap-1 text-[11px]">
              <Flag className="w-3 h-3 text-slate-400" /> Priority:
            </span>
            {(['low', 'medium', 'high', 'urgent'] as TaskPriority[]).map((p) => {
              const isSelected = priority === p;
              return (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`px-2.5 py-1 rounded-full border text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? `${priorityConfig[p].activeClass}`
                      : 'border-slate-200/80 bg-white/60 text-slate-600 hover:bg-white hover:text-slate-900'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${priorityConfig[p].dot}`} />
                  {priorityConfig[p].label}
                </button>
              );
            })}
          </div>

          {/* Tags & Due Date */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick preset tags */}
            <div className="hidden sm:flex items-center gap-1">
              {presetTags.map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setTag(tag === t ? '' : t)}
                  className={`px-2.5 py-0.5 text-[11px] font-medium rounded-full transition-colors cursor-pointer border ${
                    tag === t
                      ? 'bg-indigo-600 text-white border-indigo-600 font-semibold shadow-2xs'
                      : 'bg-white/80 border-slate-200/80 text-slate-600 hover:bg-white hover:text-slate-900'
                  }`}
                >
                  #{t}
                </button>
              ))}
            </div>

            {/* Custom Tag Input */}
            <div className="flex items-center gap-1 bg-white/80 border border-slate-200/80 rounded-full px-2.5 py-1 shadow-2xs">
              <Tag className="w-3 h-3 text-slate-400" />
              <input
                type="text"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="Tag"
                className="w-16 bg-transparent text-xs text-slate-700 placeholder-slate-400 focus:outline-none"
              />
            </div>

            {/* Due Date Picker */}
            <div className="flex items-center gap-1 bg-white/80 border border-slate-200/80 rounded-full px-2.5 py-1 shadow-2xs">
              <Calendar className="w-3 h-3 text-slate-400" />
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="bg-transparent text-xs text-slate-700 focus:outline-none cursor-pointer"
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
