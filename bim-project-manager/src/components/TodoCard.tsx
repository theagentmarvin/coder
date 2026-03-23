import { Todo, TodoStatus } from '../types';
import { TODO_STATUSES } from '../utils/constants';

interface TodoCardProps {
  todo: Todo;
  onEdit: (todo: Todo) => void;
  onDelete: (todoId: string) => void;
  onStatusChange: (todoId: string, status: TodoStatus) => void;
}

export default function TodoCard({ todo, onEdit, onDelete, onStatusChange }: TodoCardProps) {
  const getStatusColor = (status: TodoStatus): string => {
    const statusConfig = TODO_STATUSES.find((s) => s.value === status);
    return statusConfig?.color || 'border-secondary';
  };
  
  const getStatusBgColor = (status: TodoStatus): string => {
    switch (status) {
      case 'pending': return 'bg-secondary/10';
      case 'in_progress': return 'bg-primary-container/10';
      case 'completed': return 'bg-tertiary-container/10';
      case 'urgent': return 'bg-error/10';
      default: return 'bg-surface-variant/10';
    }
  };
  
  return (
    <div
      className={`bg-surface-container rounded-lg p-4 border-l-4 ${getStatusColor(todo.status)} ${getStatusBgColor(todo.status)}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-on-surface">{todo.title}</h4>
          
          {todo.description && (
            <p className="text-sm text-on-surface-variant mt-1 line-clamp-2">
              {todo.description}
            </p>
          )}
          
          <div className="flex items-center gap-3 mt-3">
            {/* Status Dropdown */}
            <select
              value={todo.status}
              onChange={(e) => onStatusChange(todo.id, e.target.value as TodoStatus)}
              className="text-xs bg-surface-container-high border border-outline-variant rounded px-2 py-1 text-on-surface-variant cursor-pointer"
            >
              {TODO_STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
            
            {todo.assignee && (
              <span className="flex items-center gap-1 text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-sm">person</span>
                {todo.assignee}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(todo)}
            className="p-2 text-on-surface-variant hover:text-primary-container hover:bg-surface-variant rounded transition-colors"
            title="Edit"
          >
            <span className="material-symbols-outlined text-sm">edit</span>
          </button>
          <button
            onClick={() => onDelete(todo.id)}
            className="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 rounded transition-colors"
            title="Delete"
          >
            <span className="material-symbols-outlined text-sm">delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}
