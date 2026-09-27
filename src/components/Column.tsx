import React from 'react';
import { Task, TaskStatus } from '../types';
import { TaskCard } from './TaskCard';
import {
  CheckCircle2,
  Circle,
  Clock,
  Plus,
  Inbox,
  Flame,
  Sparkles,
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
      badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
      iconContainer: 'bg-amber-100 text-amber-700',
      borderTop: 'border-t-3 border-t-amber-500',
      icon: <Circle className="w-3.5 h-3.5 text-amber-600" />,
      emptyText: 'No pending tasks',
      emptySubtext: 'Click + to add a new task to queue',
      emptyIcon: <Inbox className="w-7 h-7 text-amber-400" />,
    },
    'in-progress': {
      badgeBg: 'bg-sky-100 text-sky-800 border-sky-200',
      iconContainer: 'bg-sky-100 text-sky-700',
      borderTop: 'border-t-3 border-t-sky-500',
      icon: <Clock className="w-3.5 h-3.5 text-sky-600" />,
      emptyText: 'Nothing in progress',
      emptySubtext: 'Move a task here when you start working',
      emptyIcon: <Flame className="w-7 h-7 text-sky-400" />,
    },
    done: {
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      iconContainer: 'bg-emerald-100 text-emerald-700',
      borderTop: 'border-t-3 border-t-emerald-500',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
      emptyText: 'No completed tasks yet',
      emptySubtext: 'Tasks marked as done will appear here',
      emptyIcon: <Sparkles className="w-7 h-7 text-emerald-400" />,
    },
  }[id];

  const percentage = totalTasksCount > 0 ? Math.round((tasks.length / totalTasksCount) * 100) : 0;

  return (
    <div
      className={`flex-1 flex flex-col min-w-[280px] bg-slate-100/90 rounded-2xl border border-slate-200 p-3.5 sm:p-4 shadow-2xs ${columnStyles.borderTop}`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-md flex items-center justify-center ${columnStyles.iconContainer}`}>
            {columnStyles.icon}
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold tracking-wide text-slate-800 uppercase">
              {title}
            </h2>
            <p className="text-[10px] text-slate-500 font-medium">
              {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} • {percentage}%
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {id === 'done' && tasks.length > 0 && onClearColumn && (
            <button
              onClick={() => onClearColumn('done')}
              className="text-[11px] font-medium text-slate-500 hover:text-rose-600 px-2 py-0.5 rounded hover:bg-rose-50 transition-colors cursor-pointer"
              title="Clear all completed tasks"
            >
              Clear
            </button>
          )}

          {onQuickAdd && (
            <button
              onClick={() => onQuickAdd(id)}
              className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-white transition-colors cursor-pointer"
              title={`Add task to ${title}`}
            >
              <Plus className="w-4 h-4" />
            </button>
          )}

          <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${columnStyles.badgeBg}`}>
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 flex flex-col gap-2.5 min-h-[160px]">
        {tasks.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-slate-200 rounded-xl bg-white/70">
            <div className="mb-1.5">{columnStyles.emptyIcon}</div>
            <p className="text-xs font-semibold text-slate-700">
              {columnStyles.emptyText}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {columnStyles.emptySubtext}
            </p>
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
