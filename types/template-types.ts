/**
 * Template System Types
 * 
 * Templates are SUBJECT-SPECIFIC master slide decks that auto-load for every lesson.
 * Teachers upload once, system uses forever (with option to override).
 * 
 * Storage: users/{userId}/templates/{subject}/default.pptx
 * Database: template:{userId}:{subject}
 */

import { Subject } from './lesson-setup-types';

/**
 * Template metadata stored in database
 */
export interface TemplateMetadata {
  /** Subject this template is for (ela, math, science, etc.) */
  subject: Subject;
  
  /** Original filename of uploaded template */
  fileName: string;
  
  /** File size in bytes */
  size: number;
  
  /** Storage path in Supabase Storage */
  storagePath: string;
  
  /** When template was uploaded */
  uploadedAt: string;
  
  /** User who owns this template */
  userId: string;
  
  /** Optional: Template version for future versioning */
  version?: number;
  
  /** Optional: Description of what this template contains */
  description?: string;
}

/**
 * Template load state
 */
export interface TemplateLoadState {
  /** Is a template loaded? */
  hasTemplate: boolean;
  
  /** Template metadata (if loaded) */
  metadata?: TemplateMetadata;
  
  /** Is this the default template or a one-time override? */
  isDefault: boolean;
  
  /** Error message if loading failed */
  error?: string;
}

/**
 * Template upload mode
 */
export type TemplateUploadMode = 
  | 'set-as-default'     // Replace default template
  | 'use-once';          // Use for this lesson only

/**
 * Get database key for template
 */
export function getTemplateKey(userId: string, subject: Subject): string {
  return `template:${userId}:${subject}`;
}

/**
 * Get storage path for template
 */
export function getTemplateStoragePath(userId: string, subject: Subject): string {
  return `users/${userId}/templates/${subject}/default.pptx`;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * Format upload date for display
 */
export function formatUploadDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  
  return date.toLocaleDateString();
}
