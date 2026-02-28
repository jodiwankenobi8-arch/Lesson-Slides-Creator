/**
 * Template Manager
 * 
 * Handles CRUD operations for subject-specific slide deck templates.
 * 
 * KEY BEHAVIORS:
 * - Templates are stored by SUBJECT (ela, math, science, etc.)
 * - One template per subject per user
 * - Auto-loads when creating new lessons
 * - Can be overridden per-lesson without affecting default
 * 
 * STORAGE STRUCTURE:
 * - Files: users/{userId}/templates/{subject}/default.pptx
 * - Metadata: template:{userId}:{subject}
 */

import { projectId } from './supabase/info';
import { computeFileHash } from '../app/utils/file-hash';
import { uploadFiles, deleteFile } from './storage-client'; // Use uploadFiles adapter
import { api } from './api';  // ✅ ONLY ALLOWED API PATTERN
import {
  TemplateMetadata,
  Subject,
  getTemplateKey,
  getTemplateStoragePath,
} from '../app/types/template-types';

/**
 * Check if user has a default template for a subject
 */
export async function hasTemplate(userId: string, subject: Subject): Promise<boolean> {
  try {
    const key = getTemplateKey(userId, subject);
    
    const response = await api.kvGet(key);
    
    if (!response.ok) return false;
    
    const data = await response.json();
    return data.value !== null;
  } catch (error) {
    console.error('Error checking template:', error);
    return false;
  }
}

/**
 * Get template metadata
 */
export async function getTemplate(userId: string, subject: Subject): Promise<TemplateMetadata | null> {
  try {
    const key = getTemplateKey(userId, subject);
    
    const response = await api.kvGet(key);
    
    if (!response.ok) {
      // This is normal for first-time users - no need to log as warning
      console.log(`ℹ️ No default template set for ${subject} (this is normal for new users)`);
      return null;
    }
    
    const data = await response.json();
    
    if (!data.value) {
      return null;
    }
    
    return data.value as TemplateMetadata;
  } catch (error) {
    console.error('Error loading template:', error);
    return null;
  }
}

/**
 * Save template metadata to database
 */
async function saveTemplateMetadata(metadata: TemplateMetadata): Promise<boolean> {
  try {
    const key = getTemplateKey(metadata.userId, metadata.subject);
    
    const response = await api.kvSet(key, metadata);
    
    if (!response.ok) {
      console.error('Failed to save template metadata');
      return false;
    }
    
    console.log(`✅ Template metadata saved: ${key}`);
    return true;
  } catch (error) {
    console.error('Error saving template metadata:', error);
    return false;
  }
}

/**
 * Upload a new template
 * 
 * @param file - PowerPoint file to use as template
 * @param userId - User ID
 * @param subject - Subject (ela, math, science, etc.)
 * @param description - Optional description
 * @returns Success status and metadata
 */
export async function uploadTemplate(
  file: File,
  userId: string,
  subject: Subject,
  description?: string
): Promise<{ success: boolean; metadata?: TemplateMetadata; error?: string }> {
  try {
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.pptx')) {
      return {
        success: false,
        error: 'Template must be a PowerPoint file (.pptx)',
      };
    }
    
    // Compute hash
    const sha256 = await computeFileHash(file);
    
    // Delete old template if exists
    const existingTemplate = await getTemplate(userId, subject);
    if (existingTemplate?.storagePath) {
      console.log('Deleting old template...');
      await deleteFile(existingTemplate.storagePath);
    }
    
    // Upload to storage
    const uploadResults = await uploadFiles(
      [file], // uploadFiles takes an array
      `template-${subject}`, // Use special lesson ID for templates
      'templates'
    );
    
    const uploadResult = uploadResults[0]; // Get first result
    
    if (!uploadResult.success || !uploadResult.storagePath) {
      return {
        success: false,
        error: uploadResult.error || 'Upload failed',
      };
    }
    
    // Create metadata
    const metadata: TemplateMetadata = {
      subject,
      fileName: file.name,
      size: file.size,
      storagePath: uploadResult.storagePath,
      uploadedAt: new Date().toISOString(),
      userId,
      version: 1,
      description,
    };
    
    // Save metadata
    const saved = await saveTemplateMetadata(metadata);
    
    if (!saved) {
      return {
        success: false,
        error: 'Failed to save template metadata',
      };
    }
    
    console.log(`✅ Template uploaded successfully for ${subject}`);
    
    return {
      success: true,
      metadata,
    };
    
  } catch (error) {
    console.error('Error uploading template:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Delete a template
 */
export async function deleteTemplate(userId: string, subject: Subject): Promise<{ success: boolean; error?: string }> {
  try {
    // Get template metadata
    const template = await getTemplate(userId, subject);
    
    if (!template) {
      return {
        success: false,
        error: 'Template not found',
      };
    }
    
    // Delete file from storage
    const deleteResult = await deleteFile(template.storagePath);
    
    if (!deleteResult.success) {
      console.warn('Failed to delete template file from storage:', deleteResult.error);
      // Continue anyway to delete metadata
    }
    
    // Delete metadata from database
    const key = getTemplateKey(userId, subject);
    
    const response = await api.kvDel(key);
    
    if (!response.ok) {
      return {
        success: false,
        error: 'Failed to delete template metadata',
      };
    }
    
    console.log(`✅ Template deleted: ${subject}`);
    
    return { success: true };
    
  } catch (error) {
    console.error('Error deleting template:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get signed URL for template file (for preview/download)
 */
export async function getTemplateUrl(metadata: TemplateMetadata): Promise<string | null> {
  try {
    // For now, we can't create signed URLs without implementing the storage endpoint
    // This is a placeholder for future implementation
    console.warn('Template URL generation not yet implemented');
    return null;
  } catch (error) {
    console.error('Error getting template URL:', error);
    return null;
  }
}

/**
 * List all templates for a user (for future use)
 */
export async function listUserTemplates(userId: string): Promise<TemplateMetadata[]> {
  try {
    const prefix = `template:${userId}:`;
    
    const response = await api.kvGetByPrefix(prefix);
    
    if (!response.ok) {
      console.warn('Failed to list templates');
      return [];
    }
    
    const data = await response.json();
    return data.values || [];
  } catch (error) {
    console.error('Error listing templates:', error);
    return [];
  }
}