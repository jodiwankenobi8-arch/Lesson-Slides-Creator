export type SlideType = 
  | 'title'
  | 'objectives'
  | 'vocabulary'
  | 'vocabulary-detail'
  | 'content'
  | 'reading'
  | 'discussion'
  | 'activity'
  | 'summary'
  | 'video'
  | 'section'
  | 'progress'
  | 'ufli-activity'
  | 'sight-word-intro'
  | 'book-page'
  | 'celebration';

export interface Slide {
  id: string;
  type: SlideType;
  title: string;
  content?: string;
  subtitle?: string;
  items?: string[];
  background?: string;
  showMascot?: boolean;
  videoUrl?: string;
  metadata?: Record<string, any>;
}

export interface LessonTemplate {
  id: string;
  name: string;
  description?: string;
  subject: string;
  grade: string;
  slides: Slide[];
  createdAt: string;
  updatedAt: string;
  style?: 'standard' | 'kindergarten';
}

export interface LessonFormData {
  lessonName: string;
  subject: string;
  grade: string;
  welcomeTitle: string;
  welcomeSubtitle: string;
  objectives: string[];
  vocabulary: string[];
  contentSections: ContentSection[];
  readingPassage?: {
    title: string;
    text: string;
  };
  discussionQuestions: string[];
  activity?: {
    title: string;
    instructions: string[];
  };
  exitTicketQuestions: string[];
}

export interface ContentSection {
  title: string;
  subtitle?: string;
  content: string;
  items: string[];
}