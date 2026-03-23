import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Project, Todo, TodoStatus } from '../types';
import { CATEGORIES } from '../utils/constants';
import TodoCard from '../components/TodoCard';
import TodoForm from '../components/TodoForm';
import FragmentViewer from '../components/FragmentViewer';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getProject, updateProject, addTodo, updateTodo, deleteTodo } = useStore();
  
  const [project, setProject] = useState<Project | undefined>();
  const [isEditing, setIsEditing] = useState(false);
  const [showTodoForm, setShowTodoForm] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | undefined>();
  
  // Editable fields
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState<Project['category']>('other');
  const [editRefId, setEditRefId] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editClient, setEditClient] = useState('');
  const [copied, setCopied] = useState(false);
  
  useEffect(() => {
    // Debug: log raw id and character codes
    if (id) {
      console.log('Raw id from URL:', id);
      console.log('Character codes:', Array.from(id).map(c => c.charCodeAt(0).toString(16)));
    }
    
    // Normalize ID for Telegram and other messaging apps:
    // 1. Convert to lowercase (UUIDs should be case-insensitive but stored as lowercase)
    // 2. Replace all Unicode dash/hyphen characters with ASCII hyphen
    // 3. Remove any other non-alphanumeric characters (safety)
    let normalizedId = id?.toLowerCase() ?? '';
    
    // Replace Unicode dash characters (including U+2011 non-breaking hyphen)
    // Using Unicode property \p{Pd} (Dash_Punctuation) if supported, fallback to explicit ranges
    try {
      normalizedId = normalizedId.replace(/\p{Pd}/gu, '-');
    } catch {
      // Fallback for browsers without Unicode property support
      normalizedId = normalizedId.replace(/[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/g, '-');
    }
    
    // Ensure only valid UUID characters remain (hex digits and hyphens)
    normalizedId = normalizedId.replace(/[^a-f0-9-]/g, '');
    
    console.log('Normalized id:', normalizedId);
    
    const found = getProject(normalizedId);
    if (found) {
      setProject(found);
      setEditName(found.name);
      setEditDescription(found.description || '');
      setEditCategory(found.category);
      setEditRefId(found.refId || '');
      setEditLocation(found.location || '');
      setEditClient(found.client || '');
    } else {
      console.log('Project not found for normalized id:', normalizedId);
      // console.log('Available project IDs:', useStore.getState().projects.map(p => p.id));
    }
  }, [id, getProject]);
  
  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-headline text-on-surface mb-2">Project not found</h2>
          <button onClick={() => navigate('/')} className="btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  const handleSaveProject = () => {
    updateProject(project.id, {
      name: editName,
      description: editDescription || undefined,
      category: editCategory,
      refId: editRefId || undefined,
      location: editLocation || undefined,
      client: editClient || undefined,
    });
    setIsEditing(false);
  };
  
  const handleExport = () => {
    const dataStr = JSON.stringify(project, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.name.replace(/\s+/g, '_')}_project.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (!project) return;
    const url = `${window.location.origin}/project/${project.id}`;
    const codeBlock = `\`\`\`\n${url}\n\`\`\``;
    try {
      await navigator.clipboard.writeText(codeBlock);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback to copying just the URL without code block
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackErr) {
        console.error('Fallback copy also failed:', fallbackErr);
      }
    }
  };
  
  const handleAddTodo = (todo: Todo) => {
    addTodo(project.id, todo);
    setShowTodoForm(false);
  };
  
  const handleUpdateTodo = (todo: Todo) => {
    updateTodo(project.id, todo.id, todo);
    setEditingTodo(undefined);
    setShowTodoForm(false);
  };
  
  const handleDeleteTodo = (todoId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTodo(project.id, todoId);
    }
  };
  
  const handleStatusChange = (todoId: string, status: TodoStatus) => {
    updateTodo(project.id, todoId, { status });
  };
  
  const getInitials = (name: string): string => {
    return name.slice(0, 2).toUpperCase();
  };
  
  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };
  
  const todosByStatus = {
    pending: project.todos.filter((t) => t.status === 'pending'),
    in_progress: project.todos.filter((t) => t.status === 'in_progress'),
    completed: project.todos.filter((t) => t.status === 'completed'),
    urgent: project.todos.filter((t) => t.status === 'urgent'),
  };
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-surface-container border-b border-outline-variant">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-surface-variant rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: project.iconColor }}
                >
                  <span className="text-lg font-headline text-on-primary-fixed uppercase">
                    {getInitials(project.name)}
                  </span>
                </div>
                <div>
                  <h1 className="font-headline text-xl text-on-surface">
                    {project.name}
                  </h1>
                  <p className="text-sm text-on-surface-variant">
                    {project.category} • Last updated {formatDate(project.lastUpdated)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className={`btn-outline flex items-center gap-2 ${copied ? 'bg-success/10 border-success text-success' : ''}`}
                title="Copy project link as a code block (prevents Telegram hyphen issues)"
              >
                <span className="material-symbols-outlined text-sm">{copied ? 'check' : 'share'}</span>
                {copied ? 'Copied!' : 'Share'}
              </button>
              
              <button
                onClick={handleExport}
                className="btn-outline flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                Export
              </button>
              
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn-primary flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">edit</span>
                  Edit Project
                </button>
              ) : (
                <button
                  onClick={handleSaveProject}
                  className="btn-primary flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">save</span>
                  Save Changes
                </button>
              )}
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Project Info Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Details Card */}
            <div className="card">
              <h2 className="font-headline text-lg text-on-surface mb-4">Project Details</h2>
              
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-on-surface-variant mb-1">
                      Project Name
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="input-field"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-on-surface-variant mb-1">
                      Description
                    </label>
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="input-field min-h-[100px] resize-none"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-on-surface-variant mb-1">
                        Category
                      </label>
                      <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value as Project['category'])}
                        className="input-field"
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-on-surface-variant mb-1">
                        Reference ID
                      </label>
                      <input
                        type="text"
                        value={editRefId}
                        onChange={(e) => setEditRefId(e.target.value)}
                        className="input-field"
                        placeholder="PRJ-001"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-on-surface-variant mb-1">
                        Location
                      </label>
                      <input
                        type="text"
                        value={editLocation}
                        onChange={(e) => setEditLocation(e.target.value)}
                        className="input-field"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-on-surface-variant mb-1">
                        Client
                      </label>
                      <input
                        type="text"
                        value={editClient}
                        onChange={(e) => setEditClient(e.target.value)}
                        className="input-field"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {project.description && (
                    <div>
                      <p className="text-sm text-on-surface-variant mb-1">Description</p>
                      <p className="text-on-surface">{project.description}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    {project.refId && (
                      <div>
                        <p className="text-sm text-on-surface-variant mb-1">Reference ID</p>
                        <p className="text-on-surface font-label">{project.refId}</p>
                      </div>
                    )}
                    
                    {project.location && (
                      <div>
                        <p className="text-sm text-on-surface-variant mb-1">Location</p>
                        <p className="text-on-surface">{project.location}</p>
                      </div>
                    )}
                    
                    {project.client && (
                      <div>
                        <p className="text-sm text-on-surface-variant mb-1">Client</p>
                        <p className="text-on-surface">{project.client}</p>
                      </div>
                    )}
                    
                    <div>
                      <p className="text-sm text-on-surface-variant mb-1">Created</p>
                      <p className="text-on-surface">{formatDate(project.createdAt)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* 3D Model Viewer */}
            <div className="card">
              <h2 className="font-headline text-lg text-on-surface mb-4">Project Visualization</h2>
              <div className="h-[480px]">
                <FragmentViewer />
              </div>
            </div>
          </div>
          
          {/* Tasks Column */}
          <div className="space-y-6">
            {/* Tasks Header */}
            <div className="flex items-center justify-between">
              <h2 className="font-headline text-lg text-on-surface">Tasks</h2>
              <button
                onClick={() => {
                  setEditingTodo(undefined);
                  setShowTodoForm(true);
                }}
                className="btn-primary flex items-center gap-1 text-sm"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                New Task
              </button>
            </div>
            
            {/* Task Stats */}
            <div className="grid grid-cols-2 gap-2">
              <div className="card py-3">
                <p className="text-xl font-headline text-on-surface">{todosByStatus.pending.length}</p>
                <p className="text-xs text-on-surface-variant">Pending</p>
              </div>
              <div className="card py-3">
                <p className="text-xl font-headline text-on-surface">{todosByStatus.in_progress.length}</p>
                <p className="text-xs text-on-surface-variant">In Progress</p>
              </div>
              <div className="card py-3">
                <p className="text-xl font-headline text-on-surface">{todosByStatus.completed.length}</p>
                <p className="text-xs text-on-surface-variant">Completed</p>
              </div>
              <div className="card py-3">
                <p className="text-xl font-headline text-error">{todosByStatus.urgent.length}</p>
                <p className="text-xs text-on-surface-variant">Urgent</p>
              </div>
            </div>
            
            {/* Tasks List */}
            <div className="space-y-3">
              {project.todos.length === 0 ? (
                <div className="card text-center py-8">
                  <span className="material-symbols-outlined text-3xl text-on-surface-variant mb-2">
                    task
                  </span>
                  <p className="text-on-surface-variant">No tasks yet</p>
                  <button
                    onClick={() => setShowTodoForm(true)}
                    className="mt-3 text-sm text-primary-container hover:underline"
                  >
                    Create your first task
                  </button>
                </div>
              ) : (
                project.todos.map((todo) => (
                  <TodoCard
                    key={todo.id}
                    todo={todo}
                    onEdit={(t) => {
                      setEditingTodo(t);
                      setShowTodoForm(true);
                    }}
                    onDelete={handleDeleteTodo}
                    onStatusChange={handleStatusChange}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </main>
      
      {/* Todo Form Modal */}
      {showTodoForm && (
        <TodoForm
          todo={editingTodo}
          onSubmit={editingTodo ? handleUpdateTodo : handleAddTodo}
          onCancel={() => {
            setShowTodoForm(false);
            setEditingTodo(undefined);
          }}
        />
      )}
    </div>
  );
}
