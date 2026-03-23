export type TodoStatus = 'pending' | 'in_progress' | 'completed' | 'urgent';

export interface Todo {
  id: string;
  title: string;
  description?: string;
  status: TodoStatus;
  assignee?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  iconColor: string;
  category: 'residential' | 'infrastructure' | 'commercial' | 'industrial' | 'other';
  lastUpdated: string;
  createdAt: string;
  todos: Todo[];
  refId?: string;
  location?: string;
  client?: string;
  status?: string;
  completion?: number;
  clashes?: number;
  tasks?: number;
}
