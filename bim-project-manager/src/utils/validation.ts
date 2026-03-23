import { Project } from '../types';

export const validateProjectName = (name: string): string | null => {
  if (!name || name.trim().length < 5) {
    return 'Project name must be at least 5 characters';
  }
  return null;
};

export const validateProject = (project: Partial<Project>): string[] => {
  const errors: string[] = [];
  
  if (!project.name || project.name.trim().length < 5) {
    errors.push('Project name must be at least 5 characters');
  }
  
  if (!project.category) {
    errors.push('Category is required');
  }
  
  return errors;
};

export const validateImportData = (data: unknown): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Invalid JSON structure'] };
  }
  
  const project = data as Record<string, unknown>;
  
  if (!project.name || typeof project.name !== 'string' || project.name.trim().length < 5) {
    errors.push('Project name must be at least 5 characters');
  }
  
  if (!project.category) {
    errors.push('Category is required');
  }
  
  return { valid: errors.length === 0, errors };
};
