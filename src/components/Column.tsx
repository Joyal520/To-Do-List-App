import React from 'react';
import { Task, TaskStatus } from '../types';
import { TaskCard } from './TaskCard';
import {
  CheckCircle2,
  Circle,
  Clock,
  Plus,
  Sparkles,
  Inbox,
  Flame,
  CheckCheck,
} from 'lucide-react';

interface ColumnProps {
  id: TaskStatus;
  title: string;
  tasks: Task[];
  totalTasksCount: number;
  onUpdateStatus: (taskId: string, newStatus: TaskStatus) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
  onEditTask?: (task: Task) => void;
  onInlineUpdateTitle?: (taskId: string, newTitle: string) => Promise<void>;
  onQuickAdd?: (status: TaskStatus) => void;
  onClearColumn?: (status: TaskStatus) => void;
}

export const Column: React.FC<ColumnProps> = ({
  id,
  title,
  tasks,
  totalTasksCount,
  onUpdateStatus,
  onDelete,
  onEditTask,
  onInlineUpdateTitle,
  onQuickAdd,
  onClearColumn,
}) => {
  const columnStyles = {
    todo: {
      headerGradient: 'from-amber-500/10 to-orange-500/5',
      badgeBg: 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60',
      iconContainer: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
      accentBorder: 'border-t-2 border-t-amber-500',
      icon: <Circle className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
      emptyText: 'No pending tasks',
      emptySubtext: 'Click + to queue up a new item to tackle',
      emptyIcon: <Inbox className="w-8 h-8 text-amber-400/60" />,
    },
    'in-progress': {
      headerGradient: 'from-sky-500/10 to-indigo-500/5',
      badgeBg: 'bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60',
      iconContainer: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
      accentBorder: 'border-t-2 border-t-sky-500',
      icon: <Clock className="w-4 h-4 text-sky-600 dark:text-sky-400" />,
      emptyText: 'Nothing in progress',
      emptySubtext: 'Move a task here when you start working on it',
      emptyIcon: <Flame className="w-8 h-8 text-sky-400/60" />,
    },
    done: {
      headerGradient: 'from-emerald-500/10 to-teal-500/5',
      badgeBg: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60',
      iconContainer: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
      accentBorder: 'border-t-2 border-t-emerald-500',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
      emptyText: 'No completed tasks yet',
      emptySubtext: 'Complete tasks to see them stack up here',
      emptyIcon: <Sparkles className="w-8 h-8 text-emerald-400/60" />,
    },
  }[id];

  const percentage = totalTasksCount > 0 ? Math.round((tasks.length / totalTasksCount) * 100) : 0;

  return (
    <div
      className={`flex-1 flex flex-col min-w-[280px] bg-slate-100/60 dark:bg-zinc-900/50 rounded-3xl border border-slate-200/80 dark:border-zinc-800/80 p-3.5 sm:p-4 backdrop-blur-xs shadow-xs ${columnStyles.accentBorder} transition-all duration-200`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between pb-3 mb-3.5 border-b border-slate-200/60 dark:border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${columnStyles.iconContainer}`}>
            {columnStyles.icon}
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold tracking-wide text-slate-800 dark:text-zinc-200 uppercase">
              {title}
            </h2>
            <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">
              {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} • {percentage}% of total
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Quick Action Button */}
          {id === 'done' && tasks.length > 0 && onClearColumn && (
            <button
              onClick={() => onClearColumn('done')}
              className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 px-2 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              title="Clear all completed tasks"
            >
              Clear
            </button>
          )}

          {onQuickAdd && (
            <button
              onClick={() => onQuickAdd(id)}
              className="p-1 rounded-lg text-slate-400 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title={`Add task to ${title}`}
            >
              <Plus className="w-4 h-4" />
            </button>
          )}

          {/* Badge Count */}
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${columnStyles.badgeBg}`}>
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Task list container */}
      <div className="flex-1 flex flex-col gap-3 min-h-[160px]">
        {tasks.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl bg-white/40 dark:bg-zinc-900/20">
            <div className="mb-2">{columnStyles.emptyIcon}</div>
            <p className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
              {columnStyles.emptyText}
            </p>
            <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">
              {columnStyles.emptySubtext}
            </p>
            {onQuickAdd && (
              <button
                type="button"
                onClick={() => onQuickAdd(id)}
                className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add a task</span>
              </button>
            )}
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onUpdateStatus={onUpdateStatus}
              onDelete={onDelete}
              onEdit={onEditTask}
              onInlineUpdateTitle={onInlineUpdateTitle}
            />
          ))
        )}
      </div>
    </div>
  );
};
