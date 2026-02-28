/**
 * Upload UX Helpers
 * 
 * Consistent status labels and user feedback for file uploads
 */

export type UploadStage = 'queued' | 'uploading' | 'processing' | 'done' | 'error';

export function uploadStatusLabel(stage: UploadStage): string {
  switch (stage) {
    case 'queued':
      return 'Queued…';
    case 'uploading':
      return 'Uploading…';
    case 'processing':
      return 'Uploaded — preparing in the cloud…';
    case 'done':
      return 'Complete ✅';
    case 'error':
      return 'Upload failed';
  }
}

/**
 * Get color class for upload status badge
 */
export function uploadStatusColor(stage: UploadStage): string {
  switch (stage) {
    case 'queued':
      return 'bg-gray-400';
    case 'uploading':
      return 'bg-blue-500';
    case 'processing':
      return 'bg-purple-500';
    case 'done':
      return 'bg-green-500';
    case 'error':
      return 'bg-red-500';
  }
}

/**
 * Get icon for upload status
 */
export function uploadStatusIcon(stage: UploadStage): string {
  switch (stage) {
    case 'queued':
      return '⏳';
    case 'uploading':
      return '⬆️';
    case 'processing':
      return '⚙️';
    case 'done':
      return '✅';
    case 'error':
      return '❌';
  }
}
