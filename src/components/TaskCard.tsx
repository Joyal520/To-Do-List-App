import React, { useState } from 'react';
import { Task, TaskStatus } from '../types';
import { Trash2, ArrowRight, ArrowLeft, Clock, Calendar } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onUpdateStatus: (taskId: string, newStatus: TaskStatus) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onUpdateStatus,
  onDelete,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMoving, setIsMoving] = useState(false);

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
      await onUpdateStatus(task.id, nextStatus);
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

  // Human friendly status badge config
  const statusBadge = {
    todo: {
      label: 'To Do',
      classes: 'bg-amber-50 text-amber-700 border-amber-200/60',
      dot: 'bg-amber-400',
    },
    'in-progress': {
      label: 'In Progress',
      classes: 'bg-sky-50 text-sky-700 border-sky-200/60',
      dot: 'bg-sky-500 animate-pulse',
    },
    done: {
      label: 'Done',
      classes: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
      dot: 'bg-emerald-500',
    },
  }[task.status];

  // Format date helper
  const formattedDate = (() => {
    try {
      const d = new Date(task.createdAt);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  })();

  return (
    <div
      className={`group bg-white rounded-xl p-4.5 border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between gap-3 ${
        isDeleting ? 'opacity-50 pointer-events-none' : ''
      }`}
    >
      {/* Card Header & Title */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusBadge.classes}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
            {statusBadge.label}
          </span>

          <button
            onClick={handleDelete}
            disabled={isDeleting}
            title="Delete task"
            className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
            aria-label="Delete task"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <p
          className={`text-slate-800 text-sm font-medium leading-relaxed break-words ${
            task.status === 'done' ? 'line-through text-slate-500' : ''
          }`}
        >
          {task.title}
        </p>
      </div>

      {/* Date info & Movement controls */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 text-[11px] text-slate-400 select-none">
          <Clock className="w-3 h-3 text-slate-400" />
          <span>{formattedDate}</span>
        </div>

        <div className="flex items-center gap-1.5">
          {prevStatus && (
            <button
              onClick={handlePrev}
              disabled={isMoving}
              title={`Move back to ${prevStatus === 'todo' ? 'To Do' : 'In Progress'}`}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
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
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-slate-800 hover:bg-slate-900 rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              <span className="hidden sm:inline">
                {nextStatus === 'in-progress' ? 'Start' : 'Complete'}
              </span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
