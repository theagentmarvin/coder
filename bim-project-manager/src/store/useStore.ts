import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Project, Todo } from '../types';

interface Store {
  projects: Project[];
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  addTodo: (projectId: string, todo: Todo) => void;
  updateTodo: (projectId: string, todoId: string, updates: Partial<Todo>) => void;
  deleteTodo: (projectId: string, todoId: string) => void;
  getProject: (id: string) => Project | undefined;
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      projects: [],
      
      addProject: (project) => set((state) => ({
        projects: [...state.projects, project]
      })),
      
      updateProject: (id, updates) => set((state) => ({
        projects: state.projects.map((p) =>
          p.id === id ? { ...p, ...updates, lastUpdated: new Date().toISOString() } : p
        )
      })),
      
      deleteProject: (id) => set((state) => ({
        projects: state.projects.filter((p) => p.id !== id)
      })),
      
      addTodo: (projectId, todo) => set((state) => ({
        projects: state.projects.map((p) =>
          p.id === projectId
            ? { ...p, todos: [...p.todos, todo], lastUpdated: new Date().toISOString() }
            : p
        )
      })),
      
      updateTodo: (projectId, todoId, updates) => set((state) => ({
        projects: state.projects.map((p) =>
          p.id === projectId
            ? {
                ...p,
                todos: p.todos.map((t) =>
                  t.id === todoId ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
                ),
                lastUpdated: new Date().toISOString()
              }
            : p
        )
      })),
      
      deleteTodo: (projectId, todoId) => set((state) => ({
        projects: state.projects.map((p) =>
          p.id === projectId
            ? { ...p, todos: p.todos.filter((t) => t.id !== todoId), lastUpdated: new Date().toISOString() }
            : p
        )
      })),
      
      getProject: (id) => get().projects.find((p) => p.id === id)
    }),
    {
      name: 'bim-project-storage'
    }
  )
);
