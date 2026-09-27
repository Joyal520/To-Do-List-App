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
  AlertTriangle,
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

  // Soft low-saturation glass priority badges
  const priorityConfig: Record<TaskPriority, { label: string; badge: string; dot: string }> = {
    low: {
      label: 'Low',
      badge: 'bg-emerald-500/10 text-emerald-800 border-emerald-500/20',
      dot: 'bg-emerald-500',
    },
    medium: {
      label: 'Medium',
      badge: 'bg-amber-500/10 text-amber-800 border-amber-500/20',
      dot: 'bg-amber-500',
    },
    high: {
      label: 'High',
      badge: 'bg-orange-500/10 text-orange-800 border-orange-500/20',
      dot: 'bg-orange-500',
    },
    urgent: {
      label: 'Urgent',
      badge: 'bg-rose-500/10 text-rose-800 border-rose-500/20',
      dot: 'bg-rose-500 animate-pulse',
    },
  };

  const priority = task.priority || 'medium';
  const pConf = priorityConfig[priority];
  const dueDateInfo = formatDueDate(task.dueDate);
  const isDone = task.status === 'done';

  return (
    <div
      className={`group relative bg-white/88 backdrop-blur-md rounded-2xl p-4 border transition-all duration-200 flex flex-col justify-between gap-3.5 shadow-[0_4px_20px_-2px_rgba(31,38,135,0.04)] hover:shadow-[0_12px_28px_-4px_rgba(31,38,135,0.08)] hover:-translate-y-0.5 hover:bg-white/96 ${
        isDone
          ? 'border-white/80 bg-white/60 opacity-80 shadow-none'
          : 'border-white/95'
      } ${isDeleting ? 'opacity-40 pointer-events-none scale-98' : ''}`}
    >
      {/* Top Meta Bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Priority Pill */}
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${pConf.badge}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${pConf.dot}`} />
            {pConf.label}
          </span>

          {/* Category Tag */}
          {task.tag && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100/80 text-slate-600 border border-slate-200/60">
              <Tag className="w-2.5 h-2.5 text-slate-400" />
              <span>{task.tag}</span>
            </span>
          )}

          {/* Due Date Indicator */}
          {dueDateInfo.text && (
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                dueDateInfo.isOverdue
                  ? 'bg-rose-500/10 text-rose-800 border-rose-500/20'
                  : dueDateInfo.isToday
                  ? 'bg-amber-500/10 text-amber-800 border-amber-500/20'
                  : 'bg-slate-100/80 text-slate-600 border-slate-200/60'
              }`}
            >
              {dueDateInfo.isOverdue ? (
                <AlertTriangle className="w-2.5 h-2.5 text-rose-500" />
              ) : (
                <Calendar className="w-2.5 h-2.5 text-slate-400" />
              )}
              <span>{dueDateInfo.text}</span>
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button
              onClick={() => onEdit(task)}
              title="Edit task"
              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/70 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={handleDelete}
            disabled={isDeleting}
            title="Delete task"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50/70 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Task Content */}
      <div className="flex items-start gap-3">
        {/* Instant Circular Checkbox */}
        <button
          type="button"
          onClick={handleToggleComplete}
          disabled={isMoving}
          title={isDone ? 'Mark as incomplete' : 'Mark as completed'}
          className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 border ${
            isDone
              ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs'
              : 'border-slate-300 bg-white hover:border-emerald-500 text-transparent hover:text-emerald-500 shadow-2xs'
          }`}
        >
          <Check className="w-3 h-3 stroke-[3]" />
        </button>

        {/* Title */}
        <div className="flex-1 min-w-0">
          {isEditingInline ? (
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
              className="w-full px-2.5 py-1 text-sm bg-white border border-indigo-400 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100 shadow-2xs"
            />
          ) : (
            <p
              onDoubleClick={() => setIsEditingInline(true)}
              className={`text-sm font-semibold leading-relaxed break-words cursor-pointer ${
                isDone
                  ? 'line-through text-slate-400 font-normal'
                  : 'text-slate-900 hover:text-indigo-600 transition-colors'
              }`}
            >
              {task.title}
            </p>
          )}

          {task.description && (
            <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed font-normal">
              {task.description}
            </p>
          )}
        </div>
      </div>

      {/* Footer Meta & Stepper */}
      <div className="pt-2.5 border-t border-slate-100/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 select-none">
          <Clock className="w-3 h-3 text-slate-400" />
          <span>{formatCreatedDate(task.createdAt)}</span>
        </div>

        {/* Stepper Movement Controls */}
        <div className="flex items-center gap-1.5">
          {prevStatus && (
            <button
              onClick={handlePrev}
              disabled={isMoving}
              title={`Move to ${prevStatus === 'todo' ? 'To Do' : 'In Progress'}`}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-100/80 hover:bg-slate-200/80 hover:text-slate-900 rounded-lg transition-colors cursor-pointer border border-slate-200/40"
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
              className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg transition-all shadow-xs hover:shadow cursor-pointer ${
                nextStatus === 'done'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white'
                  : 'bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white'
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
