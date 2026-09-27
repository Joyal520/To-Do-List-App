import React, { useState, useEffect } from 'react';
import { Task, TaskPriority, TaskStatus } from '../types';
import { X, Calendar, Tag, CheckCircle2, Flag } from 'lucide-react';

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

  const priorityColors: Record<TaskPriority, { label: string; bg: string }> = {
    low: { label: 'Low', bg: 'bg-emerald-100 text-emerald-950 border-emerald-400 font-bold' },
    medium: { label: 'Medium', bg: 'bg-amber-100 text-amber-950 border-amber-400 font-bold' },
    high: { label: 'High', bg: 'bg-orange-100 text-orange-950 border-orange-400 font-bold' },
    urgent: { label: 'Urgent', bg: 'bg-rose-100 text-rose-950 border-rose-400 font-bold' },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-950">
            Edit Task Details
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5">
              Task Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Design homepage layout"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-950 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5">
              Notes / Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add additional context or notes..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-100 resize-none"
            />
          </div>

          {/* Priority & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5 flex items-center gap-1">
                <Flag className="w-3.5 h-3.5 text-indigo-700" />
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
                      className={`px-2.5 py-1.5 rounded-lg text-xs border transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                        isSelected
                          ? `${priorityColors[p].bg} shadow-2xs`
                          : 'bg-white text-slate-700 font-semibold border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {priorityColors[p].label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-700" />
                <span>Stage</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-600 cursor-pointer"
              >
                <option value="todo">📋 To Do</option>
                <option value="in-progress">⚡ In Progress</option>
                <option value="done">✅ Completed</option>
              </select>
            </div>
          </div>

          {/* Tag & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-indigo-700" />
                <span>Tag</span>
              </label>
              <input
                type="text"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="e.g. Design, Work"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-950 placeholder-slate-400 focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-700" />
                <span>Due Date</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-950 focus:outline-none focus:border-indigo-600 cursor-pointer"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-bold text-slate-700 hover:text-slate-950 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || isSubmitting}
              className="liquid-btn px-5 py-2.5 text-xs sm:text-sm font-bold text-white rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-40"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
