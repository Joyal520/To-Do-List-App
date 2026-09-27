import React, { useState, useEffect } from 'react';
import { Task, TaskPriority, TaskStatus } from '../types';
import { X, Calendar, Tag, AlertCircle, CheckCircle2, AlignLeft, Flag } from 'lucide-react';

interface TaskEditModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskId: string, updates: Partial<Task>) => Promise<void>;
}

export const TaskEditModal: React.FC<TaskEditModalProps> = ({
  task,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen || !task) return null;

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [priority, setPriority] = useState<TaskPriority>(task.priority || 'medium');
  const [tag, setTag] = useState(task.tag || '');
  const [dueDate, setDueDate] = useState(task.dueDate || '');
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setPriority(task.priority || 'medium');
      setTag(task.tag || '');
      setDueDate(task.dueDate || '');
      setStatus(task.status);
    }
  }, [task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSave(task.id, {
        title: title.trim(),
        description: description.trim(),
        priority,
        tag: tag.trim(),
        dueDate: dueDate || undefined,
        status,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const priorityColors: Record<TaskPriority, { label: string; bg: string; text: string; ring: string }> = {
    low: { label: 'Low', bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-400', ring: 'border-emerald-300 dark:border-emerald-700' },
    medium: { label: 'Medium', bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-400', ring: 'border-amber-300 dark:border-amber-700' },
    high: { label: 'High', bg: 'bg-orange-50 dark:bg-orange-950/40', text: 'text-orange-700 dark:text-orange-400', ring: 'border-orange-300 dark:border-orange-700' },
    urgent: { label: 'Urgent', bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-700 dark:text-rose-400', ring: 'border-rose-300 dark:border-rose-700' },
  };

  const presetTags = ['Work', 'Personal', 'Feature', 'Bug', 'Design', 'Urgent'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800">
          <h3 className="text-base font-semibold text-slate-900 dark:text-zinc-100">
            Edit Task Details
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5">
              Task Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Design homepage layout"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm font-medium text-slate-900 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5">
              Notes / Description (Optional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add additional context, links, or sub-checklist details..."
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 resize-none"
            />
          </div>

          {/* Priority & Status Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5 flex items-center gap-1">
                <Flag className="w-3.5 h-3.5 text-indigo-500" />
                <span>Priority</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {(['low', 'medium', 'high', 'urgent'] as TaskPriority[]).map((p) => {
                  const isSelected = priority === p;
                  return (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setPriority(p)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        isSelected
                          ? `${priorityColors[p].bg} ${priorityColors[p].text} ${priorityColors[p].ring} shadow-xs font-semibold`
                          : 'bg-slate-50 dark:bg-zinc-800/50 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700/60 hover:bg-slate-100'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        p === 'low' ? 'bg-emerald-500' : p === 'medium' ? 'bg-amber-500' : p === 'high' ? 'bg-orange-500' : 'bg-rose-500'
                      }`} />
                      {priorityColors[p].label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
                <span>Stage / Column</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs sm:text-sm font-medium text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="todo">📋 To Do</option>
                <option value="in-progress">⚡ In Progress</option>
                <option value="done">✅ Done</option>
              </select>
            </div>
          </div>

          {/* Tag / Category & Due Date Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-indigo-500" />
                <span>Category Tag</span>
              </label>
              <input
                type="text"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="e.g. Design, Work, Personal"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
              {/* Quick Tag pills */}
              <div className="flex flex-wrap gap-1 mt-1.5">
                {presetTags.map((pt) => (
                  <button
                    type="button"
                    key={pt}
                    onClick={() => setTag(pt)}
                    className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
                  >
                    #{pt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                <span>Due Date</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
              />
              {dueDate && (
                <button
                  type="button"
                  onClick={() => setDueDate('')}
                  className="mt-1 text-[11px] text-rose-500 hover:underline cursor-pointer"
                >
                  Clear due date
                </button>
              )}
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || isSubmitting}
              className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-sm transition-all cursor-pointer"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
