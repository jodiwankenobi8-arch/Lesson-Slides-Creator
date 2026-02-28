import { projectId, publicAnonKey } from '../../../utils/supabase/info';
import { KindergartenLessonData } from '../types/lesson-types';
import type { PPTXAnalysis } from './pptx-parser';
import type { AnalyzedReference } from './reference-analyzer';
import { supabase, getUserAccessToken } from '../../utils/supabase-auth'; // Use singleton instance
import { AuthenticationError } from './authed-fetch';
import { api } from '../../utils/api';  // ✅ ONLY ALLOWED API PATTERN

// Supabase URL for API calls (not creating a client)
const supabaseUrl = `https://${projectId}.supabase.co`;

/**
 * ✅ DEPRECATED: Use api.ts methods directly instead
 * This function has been replaced by api.kvGet, api.kvSet, etc.
 * Kept for backwards compatibility during migration.
 */
async function makeAuthedKVRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  throw new Error('DEPRECATED: makeAuthedKVRequest() is deprecated. Use api.ts methods instead.');
}

export interface SavedLesson {
  id: string;
  name: string;
  data: KindergartenLessonData;
  createdAt: string;
  updatedAt: string;
  metadata?: {
    ufliUploadMethod?: 'powerpoint' | 'screenshots';
    ufliScreenshotCount?: number;
    uploadAnalysis?: string;
    pptxAnalysis?: PPTXAnalysis;
    comprehensiveAnalysis?: AnalyzedReference;
    extractedStoryText?: string;
    uploadedPPTXFiles?: Array<{
      id: string;
      name: string;
      size: number;
      type: string;
      url?: string;
      analysis?: PPTXAnalysis;
      detectedDay?: number;
    }>;
    // File upload metadata (not the actual files)
    uploadedFiles?: {
      powerpoint: Array<{ name: string; size: number; type: string; storagePath?: string }>;
      slidePictures: Array<{ name: string; size: number; type: string; storagePath?: string }>;
      code: Array<{ name: string; size: number; type: string; storagePath?: string }>;
      documentation: Array<{ name: string; size: number; type: string; storagePath?: string }>;
      savvasReference: Array<{ name: string; size: number; type: string; storagePath?: string }>;
    };
  };
}

// Generate a unique lesson ID
export function generateLessonId(): string {
  return `lesson-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Save a lesson to the KV store
export async function saveLesson(lesson: SavedLesson): Promise<void> {
  const key = `lesson:${lesson.id}`;
  
  try {
    const response = await api.kvSet(key, lesson);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to save lesson: ${error}`);
    }

    console.log('Lesson saved successfully:', lesson.id);
  } catch (error) {
    console.error('Error saving lesson:', error);
    throw error;
  }
}

// Get a lesson by ID
export async function getLesson(id: string): Promise<SavedLesson | null> {
  // Try both key formats - lessons from wizard have ":setup" suffix
  const keysToTry = [
    `lesson:${id}:setup`, // Wizard format (has :setup suffix)
    `lesson:${id}`,       // Normal format
  ];
  
  for (const key of keysToTry) {
    try {
      const response = await api.kvGet(key);

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Lesson found with key: ${key}`);
        return result.value as SavedLesson;
      }
      
      // Try next key format
      if (response.status === 404) {
        console.log(`⚠️ Lesson not found with key: ${key}, trying next format...`);
        continue;
      }
      
      // Other error - log it but continue trying
      const error = await response.text();
      console.warn(`Failed to get lesson with key ${key}: ${error}`);
    } catch (error) {
      console.error(`Error trying key ${key}:`, error);
    }
  }
  
  // None of the key formats worked
  console.error(`❌ Lesson not found with ID: ${id} (tried all key formats)`);
  return null;
}

// Get all lessons (by prefix)
export async function getAllLessons(): Promise<SavedLesson[]> {
  try {
    // Use api - will throw AuthenticationError if not authenticated
    const response = await api.meLessons();

    if (!response.ok) {
      console.error(`❌ Failed to fetch lessons: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      return [];
    }

    const lessons = (await response.json()) as SavedLesson[];

    console.log(`✅ Fetched ${lessons.length} lessons from server`);

    return lessons.sort((a, b) => {
      const at = new Date((a as any).updatedAt || (a as any).createdAt || 0).getTime();
      const bt = new Date((b as any).updatedAt || (b as any).createdAt || 0).getTime();
      return bt - at;
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      console.error('❌ Authentication required to fetch lessons');
      throw error; // Re-throw auth errors so UI can handle them
    }
    
    console.error('❌ Error fetching lessons:', error);
    return [];
  }
}

// Delete a lesson
export async function deleteLesson(id: string): Promise<void> {
  // SAFETY: Create comprehensive backup before deleting
  try {
    const backupData: any = {
      _deletedAt: new Date().toISOString(),
      _lessonId: id,
    };
    
    // Backup main lesson data
    const lessonToDelete = await getLesson(id);
    if (lessonToDelete) {
      backupData.lesson = lessonToDelete;
    }
    
    // Backup all related keys (setup, files metadata, etc.)
    const relatedKeys = [
      `lesson:${id}`,
      `lesson:${id}:setup`,
      `lesson-files:${id}`,
    ];
    
    for (const key of relatedKeys) {
      try {
        const response = await api.kvGet(key);
        
        if (response.ok) {
          const result = await response.json();
          if (result.value) {
            backupData[key] = result.value;
            console.log(`📦 Backed up key: ${key}`);
          }
        }
      } catch (error) {
        console.warn(`⚠️ Could not backup key ${key}:`, error);
      }
    }
    
    // Save comprehensive backup
    const backupKey = `lesson:backup:${id}:${Date.now()}`;
    const backupResponse = await api.kvSet(backupKey, backupData);
    
    if (backupResponse.ok) {
      console.log(`✅ Created comprehensive backup: ${backupKey}`);
    }
  } catch (error) {
    console.warn('⚠️ Failed to create backup before delete:', error);
    // Continue with deletion even if backup fails
  }
  
  // Try deleting both key formats to ensure complete deletion
  const keysToDelete = [
    `lesson:${id}`,
    `lesson:${id}:setup`,
    `lesson-files:${id}`,
  ];
  
  try {
    // Delete all possible keys
    const deletePromises = keysToDelete.map(async (key) => {
      try {
        const response = await api.kvDel(key);

        if (response.ok) {
          console.log(`✅ Deleted key: ${key}`);
        } else if (response.status === 404) {
          console.log(`⚠️ Key not found (OK): ${key}`);
        } else {
          const error = await response.text();
          console.warn(`Failed to delete key ${key}: ${error}`);
        }
      } catch (error) {
        console.warn(`Error deleting key ${key}:`, error);
      }
    });

    await Promise.all(deletePromises);
    console.log('Lesson deleted successfully (all key variants):', id);
  } catch (error) {
    console.error('Error deleting lesson:', error);
    throw error;
  }
}

// Upload a file to Supabase Storage
/**
 * @deprecated Use uploadFiles() from '../../utils/storage-client' instead
 * This function bypasses the server and uploads directly to storage,
 * which skips security validation and file type checking.
 * 
 * Kept for backwards compatibility only.
 */
export async function uploadFile(
  file: File,
  lessonId: string,
  category: 'powerpoint' | 'screenshots' | 'reference' | 'code' | 'documentation' | 'book-pages'
): Promise<string> {
  // Silently deprecated - JSDoc warning is sufficient
  
  const bucketName = 'make-0d810c1e-lessons';
  const filePath = `${lessonId}/${category}/${Date.now()}-${file.name}`;

  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    console.log('File uploaded successfully:', filePath);
    return filePath;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

// Get a signed URL for a file in storage
export async function getFileUrl(storagePath: string): Promise<string> {
  const bucketName = 'make-0d810c1e-lessons';

  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(storagePath, 3600); // 1 hour expiry

    if (error || !data) {
      throw new Error(`Failed to get signed URL: ${error?.message}`);
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Error getting file URL:', error);
    throw error;
  }
}

// Download a file from storage and return as File object
export async function downloadFile(storagePath: string, fileName: string): Promise<File> {
  const bucketName = 'make-0d810c1e-lessons';

  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .download(storagePath);

    if (error || !data) {
      throw new Error(`Failed to download file: ${error?.message}`);
    }

    // Convert Blob to File
    const file = new File([data], fileName, { type: data.type });
    return file;
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
}

// Download all files for a lesson and return as a map
export async function downloadAllLessonFiles(lessonId: string, metadata?: SavedLesson['metadata']): Promise<{
  files: Map<string, File>;
  uploadedFiles: {
    powerpoint: Array<{ name: string; size: number; type: string; storagePath?: string }>;
    slidePictures: Array<{ name: string; size: number; type: string; storagePath?: string }>;
    code: Array<{ name: string; size: number; type: string; storagePath?: string }>;
    documentation: Array<{ name: string; size: number; type: string; storagePath?: string }>;
    savvasReference: Array<{ name: string; size: number; type: string; storagePath?: string }>;
  };
}> {
  const filesMap = new Map<string, File>();
  const uploadedFilesMetadata = {
    powerpoint: [],
    slidePictures: [],
    code: [],
    documentation: [],
    savvasReference: [],
  };

  if (!metadata?.uploadedFiles) {
    return { files: filesMap, uploadedFiles: uploadedFilesMetadata };
  }

  try {
    const downloadPromises: Promise<void>[] = [];

    // Download powerpoint files
    metadata.uploadedFiles.powerpoint?.forEach((fileInfo, index) => {
      if (fileInfo.storagePath) {
        const promise = downloadFile(fileInfo.storagePath, fileInfo.name)
          .then(file => {
            filesMap.set(`powerpoint-${index}`, file);
            uploadedFilesMetadata.powerpoint.push(fileInfo);
          })
          .catch(err => console.error(`Failed to download powerpoint file ${fileInfo.name}:`, err));
        downloadPromises.push(promise);
      }
    });

    // Download screenshot/slide pictures
    metadata.uploadedFiles.slidePictures?.forEach((fileInfo, index) => {
      if (fileInfo.storagePath) {
        const promise = downloadFile(fileInfo.storagePath, fileInfo.name)
          .then(file => {
            filesMap.set(`screenshot-${index}`, file);
            uploadedFilesMetadata.slidePictures.push(fileInfo);
          })
          .catch(err => console.error(`Failed to download screenshot ${fileInfo.name}:`, err));
        downloadPromises.push(promise);
      }
    });

    // Download code files
    metadata.uploadedFiles.code?.forEach((fileInfo, index) => {
      if (fileInfo.storagePath) {
        const promise = downloadFile(fileInfo.storagePath, fileInfo.name)
          .then(file => {
            filesMap.set(`code-${index}`, file);
            uploadedFilesMetadata.code.push(fileInfo);
          })
          .catch(err => console.error(`Failed to download code file ${fileInfo.name}:`, err));
        downloadPromises.push(promise);
      }
    });

    // Download documentation files
    metadata.uploadedFiles.documentation?.forEach((fileInfo, index) => {
      if (fileInfo.storagePath) {
        const promise = downloadFile(fileInfo.storagePath, fileInfo.name)
          .then(file => {
            filesMap.set(`documentation-${index}`, file);
            uploadedFilesMetadata.documentation.push(fileInfo);
          })
          .catch(err => console.error(`Failed to download documentation ${fileInfo.name}:`, err));
        downloadPromises.push(promise);
      }
    });

    // Download savvas reference files
    metadata.uploadedFiles.savvasReference?.forEach((fileInfo, index) => {
      if (fileInfo.storagePath) {
        const promise = downloadFile(fileInfo.storagePath, fileInfo.name)
          .then(file => {
            filesMap.set(`savvasReference-${index}`, file);
            uploadedFilesMetadata.savvasReference.push(fileInfo);
          })
          .catch(err => console.error(`Failed to download savvas reference ${fileInfo.name}:`, err));
        downloadPromises.push(promise);
      }
    });

    await Promise.all(downloadPromises);

    console.log(`Downloaded ${filesMap.size} files for lesson ${lessonId}`);
    return { files: filesMap, uploadedFiles: uploadedFilesMetadata };
  } catch (error) {
    console.error('Error downloading lesson files:', error);
    return { files: filesMap, uploadedFiles: uploadedFilesMetadata };
  }
}

// Delete all files for a lesson
export async function deleteAllLessonFiles(lessonId: string): Promise<void> {
  const bucketName = 'make-0d810c1e-lessons';

  try {
    // List all files for this lesson
    const { data: files, error: listError } = await supabase.storage
      .from(bucketName)
      .list(lessonId, {
        limit: 1000,
        offset: 0,
      });

    if (listError) {
      console.error('Error listing files:', listError);
      return;
    }

    if (!files || files.length === 0) {
      return;
    }

    // Delete all files
    const filePaths = files.map(file => `${lessonId}/${file.name}`);
    const { error: deleteError } = await supabase.storage
      .from(bucketName)
      .remove(filePaths);

    if (deleteError) {
      console.error('Error deleting files:', deleteError);
    } else {
      console.log('All lesson files deleted:', lessonId);
    }
  } catch (error) {
    console.error('Error deleting lesson files:', error);
  }
}

// Auto-save draft state (for recovery)
export async function saveDraft(draftData: any): Promise<void> {
  const key = 'lesson:draft:current';
  
  try {
    const response = await api.kvSet(key, {
      ...draftData,
      savedAt: new Date().toISOString(),
    });

    if (!response.ok) {
      console.error('Failed to save draft');
    }
  } catch (error) {
    console.error('Error saving draft:', error);
  }
}

// Get saved draft
export async function getDraft(): Promise<any | null> {
  const key = 'lesson:draft:current';
  
  try {
    const response = await api.kvGet(key);

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    return result.value;
  } catch (error) {
    console.error('Error getting draft:', error);
    return null;
  }
}

// Clear draft
export async function clearDraft(): Promise<void> {
  const key = 'lesson:draft:current';
  
  try {
    await api.kvDel(key);
  } catch (error) {
    console.error('Error clearing draft:', error);
  }
}

// Get recently deleted lessons (backups created in last 24 hours)
export async function getRecentlyDeletedLessons(): Promise<Array<SavedLesson & { _deletedAt: string; _backupKey: string }>> {
  try {
    const response = await api.kvGetByPrefix('lesson:backup:');

    if (!response.ok) {
      console.error(`Failed to fetch deleted lessons: ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    const entries = (data?.entries ?? []) as Array<{ key: string; value: any }>;

    const deleted = entries
      .map(({ key, value }) => {
        // key: lesson:backup:<lessonId>:<timestamp>
        const parts = key.split(':');
        const ts = parts.length >= 4 ? parts.slice(3).join(':') : '';
        const deletedAt = value?.deletedAt || value?._deletedAt || (ts ? new Date(Number(ts)).toISOString() : new Date().toISOString());

        return {
          ...(value as SavedLesson),
          _backupKey: key,
          _deletedAt: deletedAt,
        };
      })
      .filter((x) => !!(x as any).id || !!(x as any)._lessonId)
      .sort((a, b) => new Date(b._deletedAt).getTime() - new Date(a._deletedAt).getTime())
      .slice(0, 25);

    return deleted;
  } catch (error) {
    console.error('Error fetching deleted lessons:', error);
    return [];
  }
}

// Restore a deleted lesson from backup
export async function restoreDeletedLesson(backupKey: string): Promise<void> {
  try {
    // Get the backup
    const response = await api.kvGet(backupKey);

    if (!response.ok) {
      throw new Error('Backup not found');
    }

    const result = await response.json();
    const backup = result.value;
    
    // Extract lesson ID
    const lessonId = backup._lessonId;
    if (!lessonId) {
      throw new Error('Invalid backup: missing lesson ID');
    }
    
    // Restore main lesson data if it exists
    if (backup.lesson) {
      await saveLesson(backup.lesson as SavedLesson);
      console.log(`✅ Restored main lesson data for ${lessonId}`);
    }
    
    // Restore all other keys that were backed up
    const keysToRestore = [
      `lesson:${lessonId}`,
      `lesson:${lessonId}:setup`,
      `lesson-files:${lessonId}`,
    ];
    
    for (const key of keysToRestore) {
      if (backup[key]) {
        try {
          const restoreResponse = await api.kvSet(key, backup[key]);
          
          if (restoreResponse.ok) {
            console.log(`✅ Restored key: ${key}`);
          }
        } catch (error) {
          console.warn(`⚠️ Failed to restore key ${key}:`, error);
        }
      }
    }
    
    console.log(`✅ Fully restored lesson from backup: ${backupKey}`);
  } catch (error) {
    console.error('Error restoring lesson:', error);
    throw error;
  }
}