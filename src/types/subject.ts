// Subject configuration - future-proof for expansion

export type Subject =
  | 'ela'
  | 'math'
  | 'science'
  | 'social-studies'
  | 'writing'
  | 'phonics-intervention';

export interface SubjectConfig {
  id: Subject;
  label: string;
  shortLabel?: string;
  description?: string;
  icon: string;
  enabled: boolean;
  gradeLevel?: string;
  comingSoon?: boolean;
}

export const SUBJECTS: SubjectConfig[] = [
  {
    id: 'ela',
    label: 'English Language Arts',
    shortLabel: 'ELA',
    description: 'Build reading & phonics lesson slides',
    icon: '📚',
    enabled: true,
    gradeLevel: 'Kindergarten',
  },
  {
    id: 'math',
    label: 'Math',
    description: 'Coming soon',
    icon: '🔢',
    enabled: false,
    comingSoon: true,
  },
  {
    id: 'science',
    label: 'Science',
    description: 'Coming soon',
    icon: '🔬',
    enabled: false,
    comingSoon: true,
  },
  {
    id: 'social-studies',
    label: 'Social Studies',
    description: 'Coming soon',
    icon: '🌍',
    enabled: false,
    comingSoon: true,
  },
];

// Get subject by ID
export function getSubject(id: Subject): SubjectConfig | undefined {
  return SUBJECTS.find((s) => s.id === id);
}

// Get enabled subjects
export function getEnabledSubjects(): SubjectConfig[] {
  return SUBJECTS.filter((s) => s.enabled);
}
