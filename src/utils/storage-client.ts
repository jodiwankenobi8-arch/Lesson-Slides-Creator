import { projectId, publicAnonKey } from './supabase/info';
import { computeFileHash } from '../app/utils/file-hash';
import { toast } from 'sonner';
import { supabase } from './supabase-auth';
import { queueUpload } from './uploadManager';
import { api } from './api';  // ✅ ONLY ALLOWED API PATTERN

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-0d810c1e`;

/**
 * Upload a file to secure storage
 * 
 * INTERNAL FUNCTION - Use uploadFiles() adapter instead.
 * 
 * @param file - File to upload
 * @param lessonId - ID of the lesson (ownership will be verified)
 * @param category - File category (core, slides, documentation, etc.)
 * @param sha256 - SHA-256 hash of the file for deduplication
 * @param onProgress - Optional progress callback for upload progress (0-100)
 * @returns { success: boolean, storagePath?: string, error?: string }
 */
async function uploadFile(
  file: File,
  lessonId: string,
  category: string,
  sha256: string,
  onProgress?: (progress: number) => void
): Promise<{ success: boolean; storagePath?: string; error?: string }> {
  try {
    // Get current session for user token
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session?.access_token) {
      const errorMsg = 'Please sign in to upload files';
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }
    
    // Build form data
    // CRITICAL: Do NOT set Content-Type header - browser will set it with boundary
    const formData = new FormData();
    formData.append('file', file);
    formData.append('lessonId', lessonId);
    formData.append('category', category);
    formData.append('sha256', sha256);
    formData.append('originalName', file.name);
    
    console.log(`📤 Uploading ${file.name} to lesson ${lessonId} (category: ${category})`);
    console.log(`   File size: ${(file.size / 1024).toFixed(1)} KB`);
    console.log(`   SHA-256: ${sha256.substring(0, 16)}...`);
    console.log(`   Category: ${category}`);
    
    // Build URL with userToken query parameter (hybrid auth pattern)
    const url = new URL(`${API_BASE}/storage/upload`);
    url.searchParams.set('userToken', session.access_token);
    
    console.log(`   API endpoint: ${url.pathname}`);
    console.log(`   Auth: Using hybrid pattern (anon key in header, user token in query param)`);
    
    // Use XMLHttpRequest for real-time upload progress tracking
    const result = await new Promise<{ success: boolean; storagePath?: string; error?: string }>((resolve) => {
      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          console.log(`📊 Upload progress: ${percentComplete.toFixed(1)}% (${(event.loaded / 1024).toFixed(1)} KB / ${(event.total / 1024).toFixed(1)} KB)`);
          onProgress?.(percentComplete);
        }
      });
      
      // Handle completion
      xhr.addEventListener('load', async () => {
        console.log(`📥 Response status: ${xhr.status} ${xhr.statusText}`);
        
        // Handle errors
        if (xhr.status === 401) {
          const error = 'Session expired - please sign in again';
          toast.error(error);
          resolve({ success: false, error });
          return;
        }
        
        if (xhr.status === 403) {
          const error = 'You do not have permission to upload to this lesson';
          toast.error(error);
          resolve({ success: false, error });
          return;
        }
        
        if (xhr.status < 200 || xhr.status >= 300) {
          const responseText = xhr.responseText;
          let errorMsg;
          try {
            const data = JSON.parse(responseText);
            errorMsg = data.error || `Upload failed: ${xhr.status}`;
          } catch {
            errorMsg = `Upload failed: ${xhr.status} ${xhr.statusText}`;
          }
          
          console.error('Upload error response:', responseText);
          toast.error(errorMsg);
          resolve({ success: false, error: errorMsg });
          return;
        }
        
        // Success
        try {
          const data = JSON.parse(xhr.responseText);
          
          if (data.storagePath) {
            console.log(`✅ Upload successful!`);
            console.log(`   Storage path: ${data.storagePath}`);
            resolve({ success: true, storagePath: data.storagePath });
          } else {
            const error = data.error || 'Upload succeeded but no storage path returned';
            toast.error(error);
            resolve({ success: false, error });
          }
        } catch (e) {
          const error = 'Failed to parse upload response';
          console.error(error, e);
          toast.error(error);
          resolve({ success: false, error });
        }
      });
      
      // Handle network errors
      xhr.addEventListener('error', () => {
        const error = 'Network error during upload';
        console.error(error);
        toast.error(error);
        resolve({ success: false, error });
      });
      
      xhr.addEventListener('abort', () => {
        const error = 'Upload cancelled';
        console.error('Upload aborted');
        resolve({ success: false, error });
      });
      
      // Start the upload with hybrid auth pattern
      xhr.open('POST', url.toString());
      xhr.setRequestHeader('Authorization', `Bearer ${publicAnonKey}`); // Use anon key
      xhr.setRequestHeader('apikey', publicAnonKey);
      xhr.send(formData);
    });
    
    return result;
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Upload error:', error);
    toast.error(`Upload failed: ${errorMessage}`);
    return { success: false, error: errorMessage };
  }
}

/**
 * Upload multiple files (PUBLIC API)
 * 
 * This is the ONLY function that should be used for uploads.
 * It handles:
 * - SHA-256 computation for deduplication
 * - Sequential uploads with progress tracking
 * - Error handling and logging
 * 
 * @param files - Array of files to upload
 * @param lessonId - ID of the lesson
 * @param category - File category (slides, documentation, etc.)
 * @param onProgress - Optional progress callback (fileName, progress)
 * @returns Array of upload results
 */
export async function uploadFiles(
  files: File[],
  lessonId: string,
  category: string = 'materials',
  onProgress?: (fileName: string, progress: number) => void
): Promise<Array<{ success: boolean; storagePath?: string; fileName: string; error?: string; sha256?: string }>> {
  console.log(`📤 Starting upload of ${files.length} file(s) for lesson ${lessonId}`);
  
  const results = [];
  
  for (const file of files) {
    console.log(`\n📂 Processing ${file.name}...`);
    
    // Compute hash
    const sha256 = await computeFileHash(file);
    
    // Upload with progress tracking
    const result = await uploadFile(
      file,
      lessonId,
      category,
      sha256,
      (progress) => onProgress?.(file.name, progress)
    );
    
    results.push({
      ...result,
      fileName: file.name,
      sha256,
    });
    
    if (result.success) {
      console.log(`✅ ${file.name} uploaded successfully`);
    } else {
      console.error(`❌ ${file.name} upload failed:`, result.error);
    }
  }
  
  console.log(`\n📊 Upload summary: ${results.filter(r => r.success).length}/${files.length} successful`);
  
  return results;
}

/**
 * Delete a file from storage
 * 
 * @param storagePath - Path to the file in storage
 * @returns { success: boolean, error?: string }
 */
export async function deleteFile(storagePath: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current session for user token
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session?.access_token) {
      const errorMsg = 'Please sign in to delete files';
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }
    
    console.log(`🗑️ Deleting file: ${storagePath}`);
    
    const response = await api.storageDelete(storagePath);
    
    if (!response.ok) {
      const data = await response.json();
      const error = data.error || `Delete failed: ${response.status}`;
      console.error('Delete error:', error);
      toast.error(error);
      return { success: false, error };
    }
    
    console.log(`✅ File deleted successfully: ${storagePath}`);
    
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Delete error:', error);
    toast.error(`Delete failed: ${errorMessage}`);
    return { success: false, error: errorMessage };
  }
}