import React from 'react';
import { Task, TaskStatus } from '../types';
import { TaskCard } from './TaskCard';
import { CheckCircle2, Circle, Clock } from 'lucide-react';

interface ColumnProps {
  id: TaskStatus;
  title: string;
  tasks: Task[];
  onUpdateStatus: (taskId: string, newStatus: TaskStatus) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
}

export const Column: React.FC<ColumnProps> = ({
  id,
  title,
  tasks,
  onUpdateStatus,
  onDelete,
}) => {
  const columnStyles = {
    todo: {
      headerBg: 'bg-amber-500/10 text-amber-800 border-amber-200',
      badgeBg: 'bg-amber-100 text-amber-800',
      icon: <Circle className="w-4 h-4 text-amber-600" />,
      emptyText: 'No tasks waiting to be started',
    },
    'in-progress': {
      headerBg: 'bg-sky-500/10 text-sky-800 border-sky-200',
      badgeBg: 'bg-sky-100 text-sky-800',
      icon: <Clock className="w-4 h-4 text-sky-600" />,
      emptyText: 'No tasks currently in progress',
    },
    done: {
      headerBg: 'bg-emerald-500/10 text-emerald-800 border-emerald-200',
      badgeBg: 'bg-emerald-100 text-emerald-800',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
      emptyText: 'No completed tasks yet',
    },
  }[id];

  return (
    <div className="flex-1 flex flex-col min-w-[280px] bg-slate-50/80 rounded-2xl border border-slate-200/80 p-4">
      {/* Column Header */}
      <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-slate-200/70">
        <div className="flex items-center gap-2">
          {columnStyles.icon}
          <h2 className="text-sm font-semibold tracking-wider text-slate-800 uppercase">
            {title}
          </h2>
        </div>
        <span
          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${columnStyles.badgeBg}`}
        >
          {tasks.length}
        </span>
      </div>

      {/* Task list */}
      <div className="flex-1 flex flex-col gap-3 min-h-[150px]">
        {tasks.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-slate-200 rounded-xl">
            <p className="text-xs text-slate-400 font-medium">
              {columnStyles.emptyText}
            </p>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onUpdateStatus={onUpdateStatus}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </div>
  );
};
