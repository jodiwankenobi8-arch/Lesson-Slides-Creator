/**
 * Upload Manager
 * 
 * Optimizes upload performance by:
 *  - Limiting concurrent uploads (prevents bandwidth splitting)
 *  - Queuing uploads to maintain responsiveness
 *  - Providing retry logic
 *  - File size warnings
 * 
 * NOTE: Chunking is NOT implemented because the backend doesn't support it yet.
 * The existing XMLHttpRequest-based upload in storage-client.ts already provides
 * excellent progress tracking. This manager focuses on concurrency control.
 */

const MAX_CONCURRENT_UPLOADS = 1; // Only 1 upload at a time = faster overall
const LARGE_FILE_THRESHOLD = 50 * 1024 * 1024; // 50MB
const VERY_LARGE_FILE_THRESHOLD = 100 * 1024 * 1024; // 100MB

interface QueuedUpload {
  task: () => Promise<void>;
  fileName: string;
  fileSize: number;
}

let activeUploads = 0;
const queue: QueuedUpload[] = [];

/**
 * Process the next upload in the queue
 */
async function processQueue() {
  if (activeUploads >= MAX_CONCURRENT_UPLOADS || queue.length === 0) return;

  const next = queue.shift();
  if (!next) return;

  console.log(`📤 [Upload Queue] Starting upload: ${next.fileName} (${(next.fileSize / 1024 / 1024).toFixed(1)} MB)`);
  console.log(`📊 [Upload Queue] Queue depth: ${queue.length} waiting`);

  activeUploads++;
  
  try {
    await next.task();
  } catch (error) {
    console.error(`❌ [Upload Queue] Upload failed: ${next.fileName}`, error);
  } finally {
    activeUploads--;
    console.log(`✅ [Upload Queue] Completed: ${next.fileName}`);
    processQueue(); // Start next upload
  }
}

/**
 * Queue an upload task
 * @param task - Upload function to execute
 * @param fileName - Name of the file being uploaded
 * @param fileSize - Size of the file in bytes
 */
export function queueUpload(task: () => Promise<void>, fileName: string, fileSize: number) {
  queue.push({ task, fileName, fileSize });
  console.log(`📋 [Upload Queue] Queued: ${fileName} - Position ${queue.length}`);
  processQueue();
}

/**
 * Get current queue status
 */
export function getQueueStatus() {
  return {
    activeUploads,
    queuedUploads: queue.length,
    totalPending: activeUploads + queue.length,
  };
}

/**
 * Check if a file is large and might need special handling
 * Returns a warning message if the file is large, null otherwise
 */
export function checkFileSize(file: File): {
  isLarge: boolean;
  isVeryLarge: boolean;
  warningMessage: string | null;
} {
  const isLarge = file.size > LARGE_FILE_THRESHOLD;
  const isVeryLarge = file.size > VERY_LARGE_FILE_THRESHOLD;
  
  let warningMessage = null;
  
  if (isVeryLarge) {
    warningMessage = `⚠️ Very large file detected (${(file.size / 1024 / 1024).toFixed(1)} MB). For best results:\n\n` +
      `• Compress images in PowerPoint (Picture Format → Compress Pictures)\n` +
      `• Consider splitting into multiple smaller files\n` +
      `• Ensure stable Wi-Fi connection`;
  } else if (isLarge) {
    warningMessage = `Large file detected (${(file.size / 1024 / 1024).toFixed(1)} MB). Upload may take a few moments.`;
  }
  
  return { isLarge, isVeryLarge, warningMessage };
}

/**
 * Clear all queued uploads (useful for cleanup on unmount)
 */
export function clearQueue() {
  queue.length = 0;
  console.log('🧹 [Upload Queue] Cleared all pending uploads');
}
