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

  // Priority badge styling
  const priorityConfig: Record<TaskPriority, { label: string; badge: string; dot: string }> = {
    low: {
      label: 'Low',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
    },
    medium: {
      label: 'Medium',
      badge: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-500',
    },
    high: {
      label: 'High',
      badge: 'bg-orange-50 text-orange-700 border-orange-200',
      dot: 'bg-orange-500',
    },
    urgent: {
      label: 'Urgent',
      badge: 'bg-rose-50 text-rose-700 border-rose-200',
      dot: 'bg-rose-500',
    },
  };

  const priority = task.priority || 'medium';
  const pConf = priorityConfig[priority];
  const dueDateInfo = formatDueDate(task.dueDate);
  const isDone = task.status === 'done';

  return (
    <div
      className={`group bg-white rounded-xl p-3.5 border transition-all duration-150 flex flex-col justify-between gap-3 shadow-2xs hover:shadow-sm ${
        isDone
          ? 'border-slate-200 bg-slate-50/60 opacity-80'
          : 'border-slate-200 hover:border-slate-300'
      } ${isDeleting ? 'opacity-40 pointer-events-none' : ''}`}
    >
      {/* Top Meta Bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Priority Chip */}
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${pConf.badge}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${pConf.dot}`} />
            {pConf.label}
          </span>

          {/* Category Tag */}
          {task.tag && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
              <Tag className="w-2.5 h-2.5 opacity-60" />
              <span>{task.tag}</span>
            </span>
          )}

          {/* Due Date Alert */}
          {dueDateInfo.text && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${
                dueDateInfo.isOverdue
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : dueDateInfo.isToday
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
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

        {/* Action icons */}
        <div className="flex items-center gap-1">
          {onEdit && (
            <button
              onClick={() => onEdit(task)}
              title="Edit task"
              className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={handleDelete}
            disabled={isDeleting}
            title="Delete task"
            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Task Body */}
      <div className="flex items-start gap-2.5">
        {/* Checkbox */}
        <button
          type="button"
          onClick={handleToggleComplete}
          disabled={isMoving}
          title={isDone ? 'Mark active' : 'Mark done'}
          className={`mt-0.5 w-4.5 h-4.5 rounded flex items-center justify-center transition-all cursor-pointer shrink-0 border ${
            isDone
              ? 'bg-emerald-600 text-white border-emerald-600'
              : 'border-slate-300 bg-white hover:border-emerald-500 text-transparent hover:text-emerald-600'
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
              className="w-full px-2 py-1 text-sm bg-slate-50 border border-indigo-400 rounded text-slate-900 focus:outline-none"
            />
          ) : (
            <p
              onDoubleClick={() => setIsEditingInline(true)}
              className={`text-sm font-medium leading-snug break-words cursor-pointer ${
                isDone
                  ? 'line-through text-slate-400'
                  : 'text-slate-800 hover:text-indigo-600 transition-colors'
              }`}
            >
              {task.title}
            </p>
          )}

          {task.description && (
            <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 text-[11px] text-slate-400 select-none">
          <Clock className="w-3 h-3" />
          <span>{formatCreatedDate(task.createdAt)}</span>
        </div>

        {/* Movement Controls */}
        <div className="flex items-center gap-1.5">
          {prevStatus && (
            <button
              onClick={handlePrev}
              disabled={isMoving}
              title={`Move to ${prevStatus === 'todo' ? 'To Do' : 'In Progress'}`}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded transition-colors cursor-pointer"
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
              className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded transition-colors shadow-2xs cursor-pointer ${
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
