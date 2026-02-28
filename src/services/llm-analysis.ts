// LLM Analysis Service - Client-side API wrapper for lesson analysis

import { projectId, publicAnonKey } from '../utils/supabase/info';

export interface LessonFocus {
  primaryFocus: string;
  phonicsPattern?: string;
  targetGrapheme?: string;
  targetPhoneme?: string;
  secondaryFocus?: string[];
  gradeLevel?: string;
  confidence: number;
}

export interface ClassifiedContent {
  vocabularyWords: string[];
  highFrequencyWords: string[];
  decodableWords: string[];
  comprehensionQuestions: string[];
  phoneticExamples: string[];
  confidence: number;
}

export interface LessonAnalysis {
  focus: LessonFocus;
  content: ClassifiedContent;
  extractedAt: string;
  sourceChunkCount: number;
}

/**
 * Trigger LLM analysis for a lesson
 */
export async function analyzeLessonFocus(lessonId: string): Promise<LessonAnalysis> {
  const response = await fetch(
    `https://${projectId}.supabase.co/functions/v1/make-server-0d810c1e/llm/analyze-lesson`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify({ lessonId }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to analyze lesson');
  }

  const data = await response.json();
  return data.analysis;
}

/**
 * Get existing analysis for a lesson
 */
export async function getLessonAnalysis(lessonId: string): Promise<LessonAnalysis | null> {
  const response = await fetch(
    `https://${projectId}.supabase.co/functions/v1/make-server-0d810c1e/llm/analysis/${lessonId}`,
    {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      return null; // No analysis exists yet
    }
    throw new Error('Failed to fetch lesson analysis');
  }

  const data = await response.json();
  return data.analysis;
}

/**
 * Override lesson focus (teacher corrections)
 */
export async function overrideLessonFocus(
  lessonId: string,
  focus: Partial<LessonFocus>
): Promise<LessonAnalysis> {
  const response = await fetch(
    `https://${projectId}.supabase.co/functions/v1/make-server-0d810c1e/llm/override-focus`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify({ lessonId, focus }),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to save focus override');
  }

  const data = await response.json();
  return data.analysis;
}

/**
 * Override classified content (teacher corrections)
 */
export async function overrideLessonContent(
  lessonId: string,
  content: Partial<ClassifiedContent>
): Promise<LessonAnalysis> {
  const response = await fetch(
    `https://${projectId}.supabase.co/functions/v1/make-server-0d810c1e/llm/override-content`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify({ lessonId, content }),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to save content override');
  }

  const data = await response.json();
  return data.analysis;
}