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
      borderTop: 'border-t-2 border-t-amber-400/80',
      badgeBg: 'bg-amber-500/10 text-amber-800 border-amber-500/20',
      iconContainer: 'bg-amber-500/15 text-amber-700',
      icon: <Circle className="w-3.5 h-3.5 text-amber-600" />,
      emptyText: 'No pending tasks',
      emptySubtext: 'Add your next task to get started.',
      emptyIcon: <Inbox className="w-7 h-7 text-amber-400/70" />,
    },
    'in-progress': {
      borderTop: 'border-t-2 border-t-sky-400/80',
      badgeBg: 'bg-sky-500/10 text-sky-800 border-sky-500/20',
      iconContainer: 'bg-sky-500/15 text-sky-700',
      icon: <Clock className="w-3.5 h-3.5 text-sky-600" />,
      emptyText: 'Nothing in progress',
      emptySubtext: 'Move a task here when you start working.',
      emptyIcon: <Flame className="w-7 h-7 text-sky-400/70" />,
    },
    done: {
      borderTop: 'border-t-2 border-t-emerald-400/80',
      badgeBg: 'bg-emerald-500/10 text-emerald-800 border-emerald-500/20',
      iconContainer: 'bg-emerald-500/15 text-emerald-700',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
      emptyText: 'No completed tasks yet',
      emptySubtext: 'Complete tasks to see them stack up here.',
      emptyIcon: <Sparkles className="w-7 h-7 text-emerald-400/70" />,
    },
  }[id];

  const percentage = totalTasksCount > 0 ? Math.round((tasks.length / totalTasksCount) * 100) : 0;

  return (
    <div
      className={`flex-1 flex flex-col min-w-[280px] bg-white/60 backdrop-blur-md rounded-3xl border border-white/80 p-4 shadow-[0_8px_30px_rgb(0,0,0,0.03)] ${columnStyles.borderTop} transition-all duration-200`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${columnStyles.iconContainer}`}>
            {columnStyles.icon}
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold tracking-wider text-slate-800 uppercase">
              {title}
            </h2>
            <p className="text-[10px] text-slate-400 font-medium">
              {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} • {percentage}% of total
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {id === 'done' && tasks.length > 0 && onClearColumn && (
            <button
              onClick={() => onClearColumn('done')}
              className="text-[11px] font-medium text-slate-400 hover:text-rose-600 px-2 py-0.5 rounded-lg hover:bg-rose-50/70 transition-colors cursor-pointer"
              title="Clear all completed tasks"
            >
              Clear
            </button>
          )}

          {onQuickAdd && (
            <button
              onClick={() => onQuickAdd(id)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-white/80 transition-colors cursor-pointer"
              title={`Add task to ${title}`}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}

          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${columnStyles.badgeBg}`}>
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 flex flex-col gap-3 min-h-[160px]">
        {tasks.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center border border-dashed border-slate-200/80 rounded-2xl bg-white/40">
            <div className="mb-2">{columnStyles.emptyIcon}</div>
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
