import { useNavigate } from 'react-router-dom';
import { Project } from '../types';

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const navigate = useNavigate();
  
  const getInitials = (name: string): string => {
    return name.slice(0, 2).toUpperCase();
  };
  
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  
  const getCategoryBadgeColor = (category: string): string => {
    switch (category) {
      case 'residential': return 'bg-primary-container text-on-primary-container';
      case 'commercial': return 'bg-secondary-container text-on-secondary-container';
      case 'infrastructure': return 'bg-tertiary-container text-on-tertiary';
      case 'industrial': return 'bg-error-container text-on-error-container';
      default: return 'bg-surface-variant text-on-surface-variant';
    }
  };
  
  return (
    <div
      onClick={() => navigate(`/project/${project.id}`)}
      className="card cursor-pointer hover:border-primary-container transition-all duration-200 group"
    >
      <div className="flex items-start gap-4">
        {/* Project Icon */}
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: project.iconColor }}
        >
          <span className="text-xl font-headline text-on-primary-fixed uppercase">
            {getInitials(project.name)}
          </span>
        </div>
        
        {/* Project Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-on-surface truncate group-hover:text-primary-container transition-colors">
              {project.name}
            </h3>
          </div>
          
          {project.description && (
            <p className="text-sm text-on-surface-variant truncate mb-2">
              {project.description}
            </p>
          )}
          
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getCategoryBadgeColor(project.category)}`}>
              {project.category}
            </span>
            
            {project.refId && (
              <span className="text-xs text-on-surface-variant font-label">
                #{project.refId}
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Stats Row */}
      <div className="mt-4 pt-4 border-t border-outline-variant flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-on-surface-variant">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-base">task</span>
            {project.todos?.length || 0}
          </span>
          {project.clashes !== undefined && (
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-base text-error">warning</span>
              {project.clashes}
            </span>
          )}
        </div>
        
        <span className="text-xs text-on-surface-variant">
          {formatDate(project.lastUpdated)}
        </span>
      </div>
    </div>
  );
}
