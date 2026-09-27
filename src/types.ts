export type TaskStatus = 'todo' | 'in-progress' | 'done';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority?: TaskPriority;
  tag?: string;
  dueDate?: string; // ISO format: YYYY-MM-DD
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  userId?: string;
  userEmail?: string;
}

export type FilterPriority = 'all' | TaskPriority;
export type SortOption = 'newest' | 'oldest' | 'priority' | 'due-date' | 'alphabetical';
export type ThemeMode = 'light' | 'dark' | 'system';
