import React, { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';

interface TaskInputProps {
  onAddTask: (title: string) => Promise<boolean>;
}

export const TaskInput: React.FC<TaskInputProps> = ({ onAddTask }) => {
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    const success = await onAddTask(trimmed);
    setIsSubmitting(false);
    if (success) {
      setTitle('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto mb-8 sm:mb-10">
      <div className="flex flex-col sm:flex-row gap-2.5 p-2 bg-white rounded-2xl shadow-sm border border-slate-200/90 focus-within:border-sky-500 focus-within:ring-3 focus-within:ring-sky-100 transition-all duration-200">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter a new task (e.g. Design homepage layout)..."
          className="flex-1 px-4 py-3 bg-transparent text-slate-800 placeholder-slate-400 text-base focus:outline-none"
          disabled={isSubmitting}
        />
        <button
          type="submit"
          disabled={!title.trim() || isSubmitting}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors duration-150 shadow-sm active:scale-[0.99] cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Adding...</span>
            </>
          ) : (
            <>
              <Plus className="w-5 h-5 stroke-[2.2]" />
              <span>Add Task</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
