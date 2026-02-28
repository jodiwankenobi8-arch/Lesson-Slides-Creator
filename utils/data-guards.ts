/**
 * Data Guards & Normalization Utilities
 * 
 * These utilities prevent crashes from incomplete or legacy data.
 * Use them when loading data from storage or external sources.
 */

import { SavedLesson } from './supabase-lessons';

/**
 * Normalize lesson data to ensure all expected fields exist
 * Handles: legacy lessons, partial saves, incomplete data
 * 
 * @param lesson - Raw lesson data from storage
 * @returns Normalized lesson with safe defaults
 */
export function normalizeLessonData(lesson: SavedLesson): SavedLesson {
  // Handle various formats of lesson name/title
  const name = lesson.name || (lesson as any).lessonTitle || 'Untitled Lesson';
  
  // Handle lessons that have lessonId but not id (legacy format)
  const id = lesson.id || (lesson as any).lessonId || `unknown-${Date.now()}`;
  
  // Handle missing timestamps
  const now = new Date().toISOString();
  const createdAt = lesson.createdAt || (lesson as any).savedAt || now;
  const updatedAt = lesson.updatedAt || (lesson as any).savedAt || now;
  
  return {
    ...lesson,
    // Ensure id exists (use lessonId if id is missing)
    id,
    // Ensure name exists
    name,
    // Ensure timestamps exist
    createdAt,
    updatedAt,
    // Ensure data object exists
    data: {
      // Curriculum metadata
      date: lesson.data?.date ?? null,
      ufliLessonNumber: lesson.data?.ufliLessonNumber ?? null,
      dayNumber: lesson.data?.dayNumber ?? null,
      
      // Content
      phonicsConcept: lesson.data?.phonicsConcept ?? null,
      storyTitle: lesson.data?.storyTitle ?? null,
      
      // Savvas alignment
      savvasUnit: lesson.data?.savvasUnit ?? null,
      savvasWeek: lesson.data?.savvasWeek ?? null,
      savvasDay: lesson.data?.savvasDay ?? null,
      
      // Preserve any other fields that exist
      ...(lesson.data || {}),
    },
  };
}

/**
 * Safe array mapper that normalizes all lessons
 * Use when loading lists of lessons
 */
export function normalizeLessons(lessons: SavedLesson[]): SavedLesson[] {
  return lessons.map(normalizeLessonData);
}

/**
 * Type guard: Check if lesson has minimum required data
 */
export function hasValidLessonData(lesson: SavedLesson): boolean {
  return !!(
    lesson.id &&
    lesson.name &&
    lesson.updatedAt
  );
}

/**
 * Filter lessons to only include valid ones
 */
export function filterValidLessons(lessons: SavedLesson[]): SavedLesson[] {
  return lessons.filter(hasValidLessonData);
}

/**
 * Format date safely with fallback
 */
export function formatLessonDate(dateString: string | null | undefined, fallback = 'No date'): string {
  if (!dateString) return fallback;
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return fallback;
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return fallback;
  }
}

/**
 * Get display value with fallback
 */
export function getDisplayValue(value: string | number | null | undefined, fallback = 'N/A'): string {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  return String(value);
}