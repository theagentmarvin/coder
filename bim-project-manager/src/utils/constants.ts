export const ICON_COLORS = [
  '#00d4ff', // primary-container
  '#ffb59d', // secondary
  '#feb528', // tertiary-container
  '#a8e8ff', // primary
  '#ffd9a1', // tertiary
  '#b83900', // secondary-container
];

export const getRandomIconColor = (): string => {
  return ICON_COLORS[Math.floor(Math.random() * ICON_COLORS.length)];
};

export const getDefaultDate = (): string => {
  return new Date().toISOString();
};

export const CATEGORIES = [
  { value: 'residential', label: 'Residential' },
  { value: 'infrastructure', label: 'Infrastructure' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'other', label: 'Other' },
] as const;

export const TODO_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'border-secondary' },
  { value: 'in_progress', label: 'In Progress', color: 'border-primary-container' },
  { value: 'completed', label: 'Completed', color: 'border-tertiary-container' },
  { value: 'urgent', label: 'Urgent', color: 'border-error' },
] as const;
