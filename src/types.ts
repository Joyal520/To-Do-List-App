export type TaskStatus = 'todo' | 'in-progress' | 'done';

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  userId?: string;
  userEmail?: string;
}

