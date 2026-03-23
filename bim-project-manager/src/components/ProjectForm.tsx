import { useState, useEffect } from 'react';
import { Project } from '../types';
import { CATEGORIES, getRandomIconColor, getDefaultDate } from '../utils/constants';
import { validateProjectName } from '../utils/validation';
import { v4 as uuidv4 } from 'uuid';

interface ProjectFormProps {
  project?: Project;
  onSubmit: (project: Project) => void;
  onCancel: () => void;
}

export default function ProjectForm({ project, onSubmit, onCancel }: ProjectFormProps) {
  const [name, setName] = useState(project?.name || '');
  const [description, setDescription] = useState(project?.description || '');
  const [category, setCategory] = useState<Project['category']>(project?.category || 'other');
  const [refId, setRefId] = useState(project?.refId || '');
  const [location, setLocation] = useState(project?.location || '');
  const [client, setClient] = useState(project?.client || '');
  const [errors, setErrors] = useState<{ name?: string }>({});
  
  const nameError = validateProjectName(name);
  
  useEffect(() => {
    if (name) {
      setErrors({ name: nameError || undefined });
    }
  }, [name, nameError]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (nameError) {
      return;
    }
    
    const now = getDefaultDate();
    const newProject: Project = {
      id: project?.id || uuidv4(),
      name: name.trim(),
      description: description.trim() || undefined,
      iconColor: project?.iconColor || getRandomIconColor(),
      category,
      lastUpdated: project?.lastUpdated || now,
      createdAt: project?.createdAt || now,
      todos: project?.todos || [],
      refId: refId.trim() || undefined,
      location: location.trim() || undefined,
      client: client.trim() || undefined,
    };
    
    onSubmit(newProject);
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-surface-container rounded-2xl w-full max-w-md border border-outline-variant">
        <div className="p-6 border-b border-outline-variant">
          <h2 className="text-xl font-headline text-on-surface">
            {project ? 'Edit Project' : 'New Project'}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Project Name */}
          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-1">
              Project Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder="Enter project name (min 5 characters)"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-error">{errors.name}</p>
            )}
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
              placeholder="Project description"
            />
          </div>
          
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Project['category'])}
              className="input-field"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Ref ID */}
          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-1">
              Reference ID
            </label>
            <input
              type="text"
              value={refId}
              onChange={(e) => setRefId(e.target.value)}
              className="input-field"
              placeholder="e.g., PRJ-001"
            />
          </div>
          
          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-1">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="input-field"
              placeholder="Project location"
            />
          </div>
          
          {/* Client */}
          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-1">
              Client
            </label>
            <input
              type="text"
              value={client}
              onChange={(e) => setClient(e.target.value)}
              className="input-field"
              placeholder="Client name"
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
              disabled={!!nameError || !name.trim()}
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {project ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
