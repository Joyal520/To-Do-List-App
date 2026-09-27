import React, { useState } from 'react';
import { Task, TaskPriority, TaskStatus } from '../types';
import {
  Trash2,
  ArrowRight,
  ArrowLeft,
  Clock,
  Calendar,
  Tag,
  Edit3,
  Check,
  AlignLeft,
  AlertTriangle,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { formatDueDate, formatCreatedDate } from '../utils/date';
import { fireConfetti } from '../utils/confetti';

interface TaskCardProps {
  task: Task;
  onUpdateStatus: (taskId: string, newStatus: TaskStatus) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
  onEdit?: (task: Task) => void;
  onInlineUpdateTitle?: (taskId: string, newTitle: string) => Promise<void>;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onUpdateStatus,
  onDelete,
  onEdit,
  onInlineUpdateTitle,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [isEditingInline, setIsEditingInline] = useState(false);
  const [inlineTitle, setInlineTitle] = useState(task.title);

  const getPreviousStatus = (status: TaskStatus): TaskStatus | null => {
    if (status === 'in-progress') return 'todo';
    if (status === 'done') return 'in-progress';
    return null;
  };

  const getNextStatus = (status: TaskStatus): TaskStatus | null => {
    if (status === 'todo') return 'in-progress';
    if (status === 'in-progress') return 'done';
    return null;
  };

  const prevStatus = getPreviousStatus(task.status);
  const nextStatus = getNextStatus(task.status);

  const handlePrev = async () => {
    if (!prevStatus || isMoving) return;
    setIsMoving(true);
    try {
      await onUpdateStatus(task.id, prevStatus);
    } finally {
      setIsMoving(false);
    }
  };

  const handleNext = async () => {
    if (!nextStatus || isMoving) return;
    setIsMoving(true);
    try {
      if (nextStatus === 'done') {
        fireConfetti();
      }
      await onUpdateStatus(task.id, nextStatus);
    } finally {
      setIsMoving(false);
    }
  };

  const handleToggleComplete = async () => {
    if (isMoving) return;
    setIsMoving(true);
    try {
      if (task.status === 'done') {
        await onUpdateStatus(task.id, 'todo');
      } else {
        fireConfetti();
        await onUpdateStatus(task.id, 'done');
      }
    } finally {
      setIsMoving(false);
    }
  };

  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await onDelete(task.id);
    } catch {
      setIsDeleting(false);
    }
  };

  const handleInlineSave = async () => {
    const trimmed = inlineTitle.trim();
    if (!trimmed || trimmed === task.title) {
      setIsEditingInline(false);
      setInlineTitle(task.title);
      return;
    }
    if (onInlineUpdateTitle) {
      await onInlineUpdateTitle(task.id, trimmed);
    }
    setIsEditingInline(false);
  };

  // Priority badge styling
  const priorityConfig: Record<TaskPriority, { label: string; badge: string; dot: string }> = {
    low: {
      label: 'Low',
      badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40',
      dot: 'bg-emerald-500',
    },
    medium: {
      label: 'Medium',
      badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/40',
      dot: 'bg-amber-500',
    },
    high: {
      label: 'High',
      badge: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800/40',
      dot: 'bg-orange-500',
    },
    urgent: {
      label: 'Urgent',
      badge: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/40',
      dot: 'bg-rose-500 animate-pulse',
    },
  };

  const priority = task.priority || 'medium';
  const pConf = priorityConfig[priority];
  const dueDateInfo = formatDueDate(task.dueDate);
  const isDone = task.status === 'done';

  return (
    <div
      className={`group relative bg-white dark:bg-zinc-900/90 rounded-2xl p-4 border transition-all duration-200 flex flex-col justify-between gap-3.5 shadow-sm hover:shadow-md hover:-translate-y-0.5 ${
        isDone
          ? 'border-slate-200/60 dark:border-zinc-800/60 opacity-80 hover:opacity-100 bg-slate-50/50 dark:bg-zinc-900/40'
          : 'border-slate-200/90 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700'
      } ${isDeleting ? 'opacity-40 scale-95 pointer-events-none' : ''}`}
    >
      {/* Top Meta Bar: Priority + Tag + Actions */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Priority Chip */}
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${pConf.badge}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${pConf.dot}`} />
            {pConf.label}
          </span>

          {/* Category Tag */}
          {task.tag && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200/60 dark:border-zinc-700/60">
              <Tag className="w-2.5 h-2.5 opacity-60" />
              <span>{task.tag}</span>
            </span>
          )}

          {/* Due Date Alert */}
          {dueDateInfo.text && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                dueDateInfo.isOverdue
                  ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-800/50'
                  : dueDateInfo.isToday
                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800/50'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-slate-200/60 dark:border-zinc-700/60'
              }`}
            >
              {dueDateInfo.isOverdue ? (
                <AlertTriangle className="w-2.5 h-2.5 text-rose-500" />
              ) : (
                <Calendar className="w-2.5 h-2.5 opacity-60" />
              )}
              <span>{dueDateInfo.text}</span>
            </span>
          )}
        </div>

        {/* Action icons (Edit & Delete) */}
        <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button
              onClick={() => onEdit(task)}
              title="Edit full task details"
              className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={handleDelete}
            disabled={isDeleting}
            title="Delete task"
            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Task Body: Checkbox + Title + Description */}
      <div className="flex items-start gap-2.5">
        {/* Quick Done Checkbox */}
        <button
          type="button"
          onClick={handleToggleComplete}
          disabled={isMoving}
          title={isDone ? 'Mark as active' : 'Mark as done'}
          className={`mt-0.5 w-5 h-5 rounded-lg flex items-center justify-center transition-all cursor-pointer shrink-0 border ${
            isDone
              ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs'
              : 'border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-transparent hover:text-emerald-500'
          }`}
        >
          <Check className="w-3.5 h-3.5 stroke-[3]" />
        </button>

        {/* Title / Inline edit */}
        <div className="flex-1 min-w-0">
          {isEditingInline ? (
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                autoFocus
                value={inlineTitle}
                onChange={(e) => setInlineTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleInlineSave();
                  if (e.key === 'Escape') {
                    setIsEditingInline(false);
                    setInlineTitle(task.title);
                  }
                }}
                onBlur={handleInlineSave}
                className="w-full px-2 py-1 text-sm bg-slate-50 dark:bg-zinc-800 border border-indigo-400 rounded-lg text-slate-900 dark:text-zinc-100 focus:outline-none"
              />
            </div>
          ) : (
            <p
              onDoubleClick={() => setIsEditingInline(true)}
              className={`text-sm font-medium leading-snug break-words cursor-pointer ${
                isDone
                  ? 'line-through text-slate-400 dark:text-zinc-500'
                  : 'text-slate-800 dark:text-zinc-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors'
              }`}
            >
              {task.title}
            </p>
          )}

          {/* Description snippet if present */}
          {task.description && (
            <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}
        </div>
      </div>

      {/* Footer: Date & Movement Controls */}
      <div className="pt-2.5 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-zinc-500 select-none">
          <Clock className="w-3 h-3 opacity-60" />
          <span>{formatCreatedDate(task.createdAt)}</span>
        </div>

        {/* Stepper Controls */}
        <div className="flex items-center gap-1.5">
          {prevStatus && (
            <button
              onClick={handlePrev}
              disabled={isMoving}
              title={`Move to ${prevStatus === 'todo' ? 'To Do' : 'In Progress'}`}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-lg transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3 h-3" />
              <span className="hidden sm:inline">Back</span>
            </button>
          )}

          {nextStatus && (
            <button
              onClick={handleNext}
              disabled={isMoving}
              title={`Move to ${nextStatus === 'in-progress' ? 'In Progress' : 'Done'}`}
              className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all shadow-xs cursor-pointer ${
                nextStatus === 'done'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              <span className="hidden sm:inline">
                {nextStatus === 'in-progress' ? 'Start' : 'Done'}
              </span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
