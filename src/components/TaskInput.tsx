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
      activeClass: 'bg-emerald-100/90 text-emerald-950 border-emerald-400 font-bold shadow-xs',
      dot: 'bg-emerald-600',
    },
    medium: {
      label: 'Medium',
      activeClass: 'bg-amber-100/90 text-amber-950 border-amber-400 font-bold shadow-xs',
      dot: 'bg-amber-600',
    },
    high: {
      label: 'High',
      activeClass: 'bg-orange-100/90 text-orange-950 border-orange-400 font-bold shadow-xs',
      dot: 'bg-orange-600',
    },
    urgent: {
      label: 'Urgent',
      activeClass: 'bg-rose-100/90 text-rose-950 border-rose-400 font-bold shadow-xs',
      dot: 'bg-rose-600 animate-pulse',
    },
  };

  return (
    <div className="w-full max-w-3xl mx-auto mb-8">
      <form
        onSubmit={handleSubmit}
        className="glass-panel rounded-2xl p-3.5 sm:p-4 shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_12px_36px_rgb(0,0,0,0.08)] transition-all duration-200 border border-white/90"
      >
        {/* Main Input Row */}
        <div className="flex items-center gap-2.5">
          <div className="pl-2 text-indigo-600">
            <Sparkles className="w-5 h-5" />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add a new task (e.g. Design homepage hero, Review pull request)..."
            className="flex-1 px-3.5 py-2.5 bg-slate-50/90 focus:bg-white rounded-xl text-slate-950 placeholder-slate-500 text-sm sm:text-base font-semibold border border-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/15 transition-all shadow-2xs"
            disabled={isSubmitting}
            autoFocus
          />

          {/* Liquid Animated Submit Button */}
          <button
            type="submit"
            disabled={!title.trim() || isSubmitting}
            className="liquid-btn inline-flex items-center justify-center gap-1.5 px-5 py-2.5 disabled:opacity-40 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md cursor-pointer disabled:cursor-not-allowed shrink-0 tracking-wide"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Add Task</span>
              </>
            )}
          </button>
        </div>

        {/* Options Row */}
        <div className="mt-3 pt-3 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          {/* Priority selector pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-700 font-bold flex items-center gap-1 text-[11px]">
              <Flag className="w-3.5 h-3.5 text-slate-600" /> Priority:
            </span>
            {(['low', 'medium', 'high', 'urgent'] as TaskPriority[]).map((p) => {
              const isSelected = priority === p;
              return (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`px-3 py-1 rounded-full border text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? `${priorityConfig[p].activeClass}`
                      : 'border-slate-300/80 bg-white/90 text-slate-700 font-semibold hover:bg-white hover:text-slate-950 hover:border-slate-400'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${priorityConfig[p].dot}`} />
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
                  className={`px-2.5 py-0.5 text-[11px] rounded-full transition-all cursor-pointer border ${
                    tag === t
                      ? 'bg-indigo-700 text-white border-indigo-700 font-bold shadow-2xs'
                      : 'bg-white/90 border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 hover:text-slate-950'
                  }`}
                >
                  #{t}
                </button>
              ))}
            </div>

            {/* Custom Tag Input */}
            <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-full px-2.5 py-1 shadow-2xs">
              <Tag className="w-3 h-3 text-slate-500" />
              <input
                type="text"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="Tag"
                className="w-16 bg-transparent text-xs text-slate-900 font-semibold placeholder-slate-400 focus:outline-none"
              />
            </div>

            {/* Due Date Picker */}
            <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-full px-2.5 py-1 shadow-2xs">
              <Calendar className="w-3 h-3 text-slate-500" />
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="bg-transparent text-xs text-slate-900 font-semibold focus:outline-none cursor-pointer"
              />
              {dueDate && (
                <button
                  type="button"
                  onClick={() => setDueDate('')}
                  className="text-slate-400 hover:text-rose-600 ml-0.5"
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
