/**
 * Lesson Types
 * 
 * Core types for lesson management and workflow
 */

export type LessonStatus = 'draft' | 'ready' | 'taught';

export interface Lesson {
  id: string;
  title: string;
  subject: string;
  status: LessonStatus;
  createdAt: string;
  updatedAt: string;
  
  // Curriculum details
  curriculumSummary: string; // e.g., "UFLI 82 Day 2 • Savvas U3 W2 D4"
  duration: string; // e.g., "30 min"
  sources: string; // e.g., "UFLI + Savvas"
  
  // Setup data (from LessonSetup)
  setupComplete: boolean;
  
  // Upload data
  materialsUploaded: boolean;
  materialCount: number;
  
  // AI extraction data
  extractionComplete: boolean;
  extractedContent?: ExtractedContent;
  
  // Slide generation
  slidesGenerated: boolean;
  slideCount?: number;
}

export interface ExtractedContent {
  phonicsFocus?: string;
  sightWords?: string[];
  vocabulary?: string[];
  comprehensionFocus?: string;
  storyTitle?: string;
  standardsAligned?: string[];
  lowConfidenceWarnings?: string[];
}

export function getStatusColor(status: LessonStatus): string {
  switch (status) {
    case 'draft':
      return 'bg-[#F7DDE2] text-[#1F2A44] border-[#F7DDE2]'; // Soft pink for drafts
    case 'ready':
      return 'bg-[#CFE3F5] text-[#1F2A44] border-[#CFE3F5]'; // Soft sky blue for ready
    case 'taught':
      return 'bg-[#E8F5E7] text-[#6FA86B] border-[#E8F5E7]'; // Leaf green for taught
  }
}

export function getStatusLabel(status: LessonStatus): string {
  switch (status) {
    case 'draft':
      return 'Draft';
    case 'ready':
      return 'Ready';
    case 'taught':
      return 'Taught';
  }
}

export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}