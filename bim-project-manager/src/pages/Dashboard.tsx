import { useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import { Project } from '../types';
import Header from '../components/Header';
import ProjectCard from '../components/ProjectCard';
import ProjectForm from '../components/ProjectForm';
import { validateImportData } from '../utils/validation';

export default function Dashboard() {
  const { projects, addProject, updateProject } = useStore();
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Filter projects
  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || project.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });
  
  // Stats
  const totalProjects = projects.length;
  const totalTodos = projects.reduce((acc, p) => acc + (p.todos?.length || 0), 0);
  const pendingTodos = projects.reduce(
    (acc, p) => acc + (p.todos?.filter((t) => t.status === 'pending').length || 0),
    0
  );
  
  const handleCreateProject = (project: Project) => {
    addProject(project);
    setShowProjectForm(false);
  };
  
  const handleUpdateProject = (project: Project) => {
    updateProject(project.id, project);
    setEditingProject(undefined);
    setShowProjectForm(false);
  };
  
  const handleImportProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        const validation = validateImportData(data);
        
        if (!validation.valid) {
          alert(`Invalid project data:\n${validation.errors.join('\n')}`);
          return;
        }
        
        // Check if project exists
        const existingProject = projects.find((p) => p.id === data.id);
        if (existingProject) {
          if (confirm('A project with this ID already exists. Do you want to update it?')) {
            updateProject(data.id, data);
          }
        } else {
          addProject(data as Project);
        }
      } catch (err) {
        alert('Failed to parse JSON file');
      }
    };
    reader.readAsText(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const openEditForm = (project: Project) => {
    setEditingProject(project);
    setShowProjectForm(true);
  };
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary-container rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-on-primary-container text-2xl">
                  folder
                </span>
              </div>
              <div>
                <p className="text-2xl font-headline text-on-surface">{totalProjects}</p>
                <p className="text-sm text-on-surface-variant">Active Projects</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-tertiary-container rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-on-tertiary text-2xl">task</span>
              </div>
              <div>
                <p className="text-2xl font-headline text-on-surface">{totalTodos}</p>
                <p className="text-sm text-on-surface-variant">Total Tasks</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-secondary-container rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-on-secondary-container text-2xl">
                  pending
                </span>
              </div>
              <div>
                <p className="text-2xl font-headline text-on-surface">{pendingTodos}</p>
                <p className="text-sm text-on-surface-variant">Pending Tasks</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects..."
                className="input-field pl-10"
              />
            </div>
          </div>
          
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input-field sm:w-48"
          >
            <option value="all">All Categories</option>
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
            <option value="infrastructure">Infrastructure</option>
            <option value="industrial">Industrial</option>
            <option value="other">Other</option>
          </select>
          
          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleImportProject}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-outline flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">upload</span>
              Import
            </button>
            
            <button
              onClick={() => {
                setEditingProject(undefined);
                setShowProjectForm(true);
              }}
              className="btn-primary flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              New Project
            </button>
          </div>
        </div>
        
        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant">
                folder_off
              </span>
            </div>
            <h3 className="text-lg font-medium text-on-surface mb-2">No projects found</h3>
            <p className="text-on-surface-variant mb-6">
              {searchQuery || categoryFilter !== 'all'
                ? 'Try adjusting your search or filter'
                : 'Create your first project to get started'}
            </p>
            {!searchQuery && categoryFilter === 'all' && (
              <button
                onClick={() => setShowProjectForm(true)}
                className="btn-primary"
              >
                Create Project
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project) => (
              <div key={project.id} className="relative group">
                <ProjectCard project={project} />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditForm(project);
                  }}
                  className="absolute top-2 right-2 p-2 bg-surface-container rounded-lg opacity-0 group-hover:opacity-100 transition-opacity border border-outline-variant hover:bg-surface-variant"
                  title="Edit Project"
                >
                  <span className="material-symbols-outlined text-sm">edit</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
      
      {/* Project Form Modal */}
      {showProjectForm && (
        <ProjectForm
          project={editingProject}
          onSubmit={editingProject ? handleUpdateProject : handleCreateProject}
          onCancel={() => {
            setShowProjectForm(false);
            setEditingProject(undefined);
          }}
        />
      )}
    </div>
  );
}
