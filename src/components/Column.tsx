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
      borderTop: 'border-t-3 border-t-amber-500',
      badgeBg: 'bg-amber-100 text-amber-950 border-amber-300 font-extrabold',
      iconContainer: 'bg-amber-100 text-amber-800',
      icon: <Circle className="w-4 h-4 text-amber-700 stroke-[2.5]" />,
      emptyText: 'No pending tasks',
      emptySubtext: 'Add your next task to get started.',
      emptyIcon: <Inbox className="w-7 h-7 text-amber-600" />,
    },
    'in-progress': {
      borderTop: 'border-t-3 border-t-sky-500',
      badgeBg: 'bg-sky-100 text-sky-950 border-sky-300 font-extrabold',
      iconContainer: 'bg-sky-100 text-sky-800',
      icon: <Clock className="w-4 h-4 text-sky-700 stroke-[2.5]" />,
      emptyText: 'Nothing in progress',
      emptySubtext: 'Move a task here when you start working.',
      emptyIcon: <Flame className="w-7 h-7 text-sky-600" />,
    },
    done: {
      borderTop: 'border-t-3 border-t-emerald-500',
      badgeBg: 'bg-emerald-100 text-emerald-950 border-emerald-300 font-extrabold',
      iconContainer: 'bg-emerald-100 text-emerald-800',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-700 stroke-[2.5]" />,
      emptyText: 'No completed tasks yet',
      emptySubtext: 'Complete tasks to see them stack up here.',
      emptyIcon: <Sparkles className="w-7 h-7 text-emerald-600" />,
    },
  }[id];

  const percentage = totalTasksCount > 0 ? Math.round((tasks.length / totalTasksCount) * 100) : 0;

  return (
    <div
      className={`flex-1 flex flex-col min-w-[280px] bg-white/80 backdrop-blur-md rounded-3xl border border-slate-200/90 p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ${columnStyles.borderTop} transition-all duration-200`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-slate-200/80">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${columnStyles.iconContainer} shadow-2xs`}>
            {columnStyles.icon}
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-extrabold tracking-wider text-slate-950 uppercase">
              {title}
            </h2>
            <p className="text-[11px] text-slate-600 font-semibold">
              {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} • {percentage}% of total
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {id === 'done' && tasks.length > 0 && onClearColumn && (
            <button
              onClick={() => onClearColumn('done')}
              className="text-[11px] font-bold text-slate-600 hover:text-rose-700 px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
              title="Clear all completed tasks"
            >
              Clear
            </button>
          )}

          {onQuickAdd && (
            <button
              onClick={() => onQuickAdd(id)}
              className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 transition-colors cursor-pointer"
              title={`Add task to ${title}`}
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}

          <span className={`px-2.5 py-0.5 rounded-full text-xs border shadow-2xs ${columnStyles.badgeBg}`}>
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 flex flex-col gap-3 min-h-[160px]">
        {tasks.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-slate-300/80 rounded-2xl bg-white/60">
            <div className="mb-2">{columnStyles.emptyIcon}</div>
            <p className="text-xs font-bold text-slate-900">
              {columnStyles.emptyText}
            </p>
            <p className="text-[11px] text-slate-600 mt-0.5 font-medium">
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
