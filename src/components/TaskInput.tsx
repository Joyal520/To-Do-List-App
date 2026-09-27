import React, { useState, useRef } from 'react';
import { Plus, Loader2, Flag, Tag, Calendar, X, CheckSquare2 } from 'lucide-react';
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

  const priorityConfig: Record<TaskPriority, { label: string; bg: string; text: string; dot: string }> = {
    low: { label: 'Low', bg: 'bg-emerald-50 border-emerald-200 text-emerald-700', dot: 'bg-emerald-500' },
    medium: { label: 'Medium', bg: 'bg-amber-50 border-amber-200 text-amber-800', dot: 'bg-amber-500' },
    high: { label: 'High', bg: 'bg-orange-50 border-orange-200 text-orange-800', dot: 'bg-orange-500' },
    urgent: { label: 'Urgent', bg: 'bg-rose-50 border-rose-200 text-rose-800', dot: 'bg-rose-500' },
  };

  return (
    <div className="w-full max-w-3xl mx-auto mb-8">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl border border-slate-200 shadow-xs p-3 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all"
      >
        {/* Main Input Row */}
        <div className="flex items-center gap-2.5">
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add a new task (e.g. Update website hero, Review invoice)..."
            className="flex-1 px-3 py-2 bg-transparent text-slate-900 placeholder-slate-400 text-sm sm:text-base font-medium focus:outline-none"
            disabled={isSubmitting}
            autoFocus
          />

          <button
            type="submit"
            disabled={!title.trim() || isSubmitting}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-xs sm:text-sm rounded-lg shadow-xs transition-colors cursor-pointer disabled:cursor-not-allowed shrink-0"
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

        {/* Options Row: Priority, Tags, Due Date */}
        <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Priority selector */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-500 font-semibold text-[11px] mr-0.5">Priority:</span>
            {(['low', 'medium', 'high', 'urgent'] as TaskPriority[]).map((p) => {
              const isSelected = priority === p;
              return (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`px-2.5 py-1 rounded-md border text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? `${priorityConfig[p].bg} font-semibold shadow-2xs`
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
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
                  className={`px-2 py-0.5 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                    tag === t
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  #{t}
                </button>
              ))}
            </div>

            {/* Custom Tag Input */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-md px-2 py-1">
              <Tag className="w-3 h-3 text-slate-400" />
              <input
                type="text"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="Tag"
                className="w-16 bg-transparent text-xs text-slate-700 placeholder-slate-400 focus:outline-none"
              />
            </div>

            {/* Due Date */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-md px-2 py-1">
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
                  className="text-slate-400 hover:text-rose-500"
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
