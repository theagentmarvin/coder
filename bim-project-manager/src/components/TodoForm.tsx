import { useState } from 'react';
import { Todo, TodoStatus } from '../types';
import { TODO_STATUSES, getDefaultDate } from '../utils/constants';
import { v4 as uuidv4 } from 'uuid';

interface TodoFormProps {
  todo?: Todo;
  onSubmit: (todo: Todo) => void;
  onCancel: () => void;
}

export default function TodoForm({ todo, onSubmit, onCancel }: TodoFormProps) {
  const [title, setTitle] = useState(todo?.title || '');
  const [description, setDescription] = useState(todo?.description || '');
  const [status, setStatus] = useState<TodoStatus>(todo?.status || 'pending');
  const [assignee, setAssignee] = useState(todo?.assignee || '');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) return;
    
    const now = getDefaultDate();
    const newTodo: Todo = {
      id: todo?.id || uuidv4(),
      title: title.trim(),
      description: description.trim() || undefined,
      status,
      assignee: assignee.trim() || undefined,
      createdAt: todo?.createdAt || now,
      updatedAt: now,
    };
    
    onSubmit(newTodo);
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-surface-container rounded-2xl w-full max-w-md border border-outline-variant">
        <div className="p-6 border-b border-outline-variant">
          <h2 className="text-xl font-headline text-on-surface">
            {todo ? 'Edit Task' : 'New Task'}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-1">
              Task Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
              placeholder="Enter task title"
              required
            />
          </div>
          
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field min-h-[80px] resize-none"
              placeholder="Task description"
            />
          </div>
          
          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TodoStatus)}
              className="input-field"
            >
              {TODO_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Assignee */}
          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-1">
              Assignee
            </label>
            <input
              type="text"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              className="input-field"
              placeholder="Assignee name"
            />
          </div>
          
          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {todo ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
