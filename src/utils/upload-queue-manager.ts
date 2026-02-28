/**
 * Upload Queue Manager
 * 
 * Features:
 * - Direct browser → Supabase Storage uploads (bypasses app server)
 * - Chunked resumable uploads (5MB chunks)
 * - Upload queue with concurrency control
 * - Automatic retry with exponential backoff
 * - Resume after network interruption
 * - Pre-upload validation and warnings
 * - Duplicate file detection
 */

import { projectId, publicAnonKey } from './supabase/info';
import { computeFileHash } from '../app/utils/file-hash';
import { toast } from 'sonner';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-0d810c1e`;
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
const MAX_CONCURRENT_UPLOADS = 2;
const MAX_RETRY_ATTEMPTS = 3;
const LARGE_FILE_THRESHOLD = 25 * 1024 * 1024; // 25MB

export type UploadStatus = 
  | 'queued' 
  | 'uploading' 
  | 'processing' 
  | 'complete' 
  | 'failed' 
  | 'paused'
  | 'cancelled';

export interface UploadTask {
  id: string;
  file: File;
  lessonId: string;
  category: string;
  status: UploadStatus;
  progress: number;
  uploadedBytes: number;
  totalBytes: number;
  currentChunk: number;
  totalChunks: number;
  error?: string;
  sha256?: string;
  storagePath?: string;
  uploadUrl?: string;
  uploadedChunks: Set<number>;
  retryCount: number;
  startTime?: number;
  estimatedTimeRemaining?: number;
  stage?: string; // e.g., "Uploading to cloud", "Unzipping", "Scanning"
  stageStartTime?: number; // When current stage started
  totalElapsedSeconds?: number; // Total time since upload started
  stageElapsedSeconds?: number; // Time in current stage
}

export interface UploadQueueCallbacks {
  onTaskUpdate?: (task: UploadTask) => void;
  onQueueUpdate?: (queue: UploadTask[]) => void;
  onComplete?: (task: UploadTask) => void;
  onError?: (task: UploadTask, error: string) => void;
}

class UploadQueueManager {
  private queue: UploadTask[] = [];
  private activeUploads: Set<string> = new Set();
  private callbacks: UploadQueueCallbacks = {};
  private abortControllers: Map<string, AbortController> = new Map();

  constructor() {
    // Listen for online/offline events to pause/resume uploads
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
  }

  /**
   * Add files to upload queue
   */
  async addFiles(
    files: File[],
    lessonId: string,
    category: string,
    callbacks?: UploadQueueCallbacks
  ): Promise<void> {
    if (callbacks) {
      this.callbacks = { ...this.callbacks, ...callbacks };
    }

    // Pre-upload validation and warnings
    for (const file of files) {
      // Check if file already exists in queue
      const existingTask = this.queue.find(
        t => t.file.name === file.name && 
        t.file.size === file.size && 
        t.lessonId === lessonId &&
        t.status !== 'failed' &&
        t.status !== 'cancelled'
      );

      if (existingTask) {
        toast.info(`"${file.name}" is already in the upload queue`);
        continue;
      }

      // Warn about large files
      if (file.size > LARGE_FILE_THRESHOLD) {
        const sizeMB = (file.size / 1024 / 1024).toFixed(1);
        toast.warning(`Large file detected: ${file.name} (${sizeMB} MB)`, {
          description: 'Upload may take several minutes. Consider compressing if possible.'
        });
      }

      // Estimate upload time (assumes ~1MB/s connection)
      const estimatedSeconds = Math.ceil(file.size / (1024 * 1024));
      
      // Create upload task
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
      const task: UploadTask = {
        id: `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        lessonId,
        category,
        status: 'queued',
        progress: 0,
        uploadedBytes: 0,
        totalBytes: file.size,
        currentChunk: 0,
        totalChunks,
        uploadedChunks: new Set(),
        retryCount: 0,
        estimatedTimeRemaining: estimatedSeconds,
      };

      this.queue.push(task);
      console.log(`📋 Added to queue: ${file.name} (${totalChunks} chunks, ~${estimatedSeconds}s)`);
    }

    this.notifyQueueUpdate();
    this.processQueue();
  }

  /**
   * Process upload queue with concurrency control
   */
  private async processQueue(): Promise<void> {
    // Count active uploads
    const activeCount = this.activeUploads.size;

    // Check if we have capacity for more uploads
    const hasLargeFile = Array.from(this.activeUploads).some(id => {
      const task = this.queue.find(t => t.id === id);
      return task && task.totalBytes > LARGE_FILE_THRESHOLD;
    });

    // If large file is uploading, limit to 1 concurrent upload
    const maxConcurrent = hasLargeFile ? 1 : MAX_CONCURRENT_UPLOADS;

    if (activeCount >= maxConcurrent) {
      return; // Queue is full
    }

    // Find next queued task
    const nextTask = this.queue.find(
      t => t.status === 'queued' && !this.activeUploads.has(t.id)
    );

    if (!nextTask) {
      return; // No queued tasks
    }

    // Start upload
    this.activeUploads.add(nextTask.id);
    this.uploadTask(nextTask);

    // Try to start another upload if we have capacity
    if (activeCount + 1 < maxConcurrent) {
      setTimeout(() => this.processQueue(), 100);
    }
  }

  /**
   * Upload a single task with chunked resumable upload
   */
  private async uploadTask(task: UploadTask): Promise<void> {
    try {
      task.status = 'uploading';
      task.startTime = Date.now();
      this.notifyTaskUpdate(task);

      // Step 1: Compute file hash
      this.setStage(task, 'Computing file hash...');
      task.sha256 = await computeFileHash(task.file);
      console.log(`🔐 Hash computed: ${task.sha256.substring(0, 16)}...`);

      // Step 2: Request signed upload URL from server
      this.setStage(task, 'Requesting upload URL...');
      const urlResponse = await fetch(`${API_BASE}/storage/upload-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          fileName: task.file.name,
          fileSize: task.file.size,
          lessonId: task.lessonId,
          category: task.category,
          sha256: task.sha256,
        }),
      });

      if (!urlResponse.ok) {
        throw new Error(`Failed to get upload URL: ${urlResponse.statusText}`);
      }

      const { uploadUrl, storagePath } = await urlResponse.json();
      task.uploadUrl = uploadUrl;
      task.storagePath = storagePath;

      console.log(`📤 Starting chunked upload to: ${storagePath}`);

      // Step 3: Upload file in chunks
      await this.uploadFileInChunks(task);

      // Step 4: Mark as complete
      task.status = 'complete';
      task.progress = 100;
      task.stage = 'Upload complete!';
      this.notifyTaskUpdate(task);
      this.callbacks.onComplete?.(task);

      console.log(`✅ Upload complete: ${task.file.name}`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Upload failed for ${task.file.name}:`, errorMessage);

      // Retry logic with exponential backoff
      if (task.retryCount < MAX_RETRY_ATTEMPTS && !errorMessage.includes('cancelled')) {
        task.retryCount++;
        const backoffDelay = Math.pow(2, task.retryCount) * 1000; // 2s, 4s, 8s
        
        task.status = 'queued';
        task.stage = `Retrying in ${backoffDelay / 1000}s... (attempt ${task.retryCount}/${MAX_RETRY_ATTEMPTS})`;
        this.notifyTaskUpdate(task);

        setTimeout(() => {
          this.processQueue();
        }, backoffDelay);
      } else {
        task.status = 'failed';
        task.error = errorMessage;
        task.stage = 'Upload failed';
        this.notifyTaskUpdate(task);
        this.callbacks.onError?.(task, errorMessage);
      }
    } finally {
      this.activeUploads.delete(task.id);
      this.processQueue(); // Start next task in queue
    }
  }

  /**
   * Upload file in chunks with resume support
   */
  private async uploadFileInChunks(task: UploadTask): Promise<void> {
    const controller = new AbortController();
    this.abortControllers.set(task.id, controller);

    try {
      for (let chunkIndex = task.currentChunk; chunkIndex < task.totalChunks; chunkIndex++) {
        // Check if upload was cancelled
        if (controller.signal.aborted) {
          throw new Error('Upload cancelled');
        }

        // Skip already uploaded chunks (for resume)
        if (task.uploadedChunks.has(chunkIndex)) {
          continue;
        }

        const start = chunkIndex * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, task.totalBytes);
        const chunk = task.file.slice(start, end);

        task.currentChunk = chunkIndex;
        task.stage = `Uploading chunk ${chunkIndex + 1}/${task.totalChunks}...`;
        this.notifyTaskUpdate(task);

        // Upload chunk with retry
        await this.uploadChunkWithRetry(task, chunk, chunkIndex, controller.signal);

        // Mark chunk as uploaded
        task.uploadedChunks.add(chunkIndex);
        task.uploadedBytes = end;
        task.progress = Math.round((task.uploadedBytes / task.totalBytes) * 100);

        // Update time estimate
        if (task.startTime) {
          const elapsed = (Date.now() - task.startTime) / 1000;
          const bytesPerSecond = task.uploadedBytes / elapsed;
          const remainingBytes = task.totalBytes - task.uploadedBytes;
          task.estimatedTimeRemaining = Math.ceil(remainingBytes / bytesPerSecond);
        }

        this.notifyTaskUpdate(task);
      }

      // All chunks uploaded - finalize upload
      task.stage = 'Finalizing upload...';
      this.notifyTaskUpdate(task);
      
      await this.finalizeUpload(task);

    } finally {
      this.abortControllers.delete(task.id);
    }
  }

  /**
   * Upload a single chunk with retry logic
   */
  private async uploadChunkWithRetry(
    task: UploadTask,
    chunk: Blob,
    chunkIndex: number,
    signal: AbortSignal,
    attempt: number = 0
  ): Promise<void> {
    try {
      const response = await fetch(task.uploadUrl!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'X-Chunk-Index': chunkIndex.toString(),
          'X-Total-Chunks': task.totalChunks.toString(),
          'X-File-SHA256': task.sha256!,
        },
        body: chunk,
        signal,
      });

      if (!response.ok) {
        throw new Error(`Chunk upload failed: ${response.statusText}`);
      }

    } catch (error) {
      if (signal.aborted) {
        throw error; // Don't retry if cancelled
      }

      // Retry chunk upload
      if (attempt < MAX_RETRY_ATTEMPTS) {
        const backoffDelay = Math.pow(2, attempt) * 500; // 500ms, 1s, 2s
        console.warn(`⚠️ Chunk ${chunkIndex} failed, retrying in ${backoffDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
        return this.uploadChunkWithRetry(task, chunk, chunkIndex, signal, attempt + 1);
      }

      throw error;
    }
  }

  /**
   * Finalize upload after all chunks are uploaded
   */
  private async finalizeUpload(task: UploadTask): Promise<void> {
    const response = await fetch(`${API_BASE}/storage/finalize-upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify({
        storagePath: task.storagePath,
        sha256: task.sha256,
        lessonId: task.lessonId,
        fileName: task.file.name,
        fileSize: task.totalBytes,
        category: task.category,
        totalChunks: task.totalChunks,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to finalize upload: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ Upload finalized:`, data);
  }

  /**
   * Pause an upload
   */
  pauseUpload(taskId: string): void {
    const task = this.queue.find(t => t.id === taskId);
    if (!task) return;

    const controller = this.abortControllers.get(taskId);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(taskId);
    }

    task.status = 'paused';
    task.stage = 'Upload paused';
    this.activeUploads.delete(taskId);
    this.notifyTaskUpdate(task);
  }

  /**
   * Resume a paused upload
   */
  resumeUpload(taskId: string): void {
    const task = this.queue.find(t => t.id === taskId);
    if (!task || task.status !== 'paused') return;

    task.status = 'queued';
    task.stage = 'Resuming upload...';
    this.notifyTaskUpdate(task);
    this.processQueue();
  }

  /**
   * Retry a failed upload
   */
  retryUpload(taskId: string): void {
    const task = this.queue.find(t => t.id === taskId);
    if (!task || task.status !== 'failed') return;

    task.status = 'queued';
    task.retryCount = 0;
    task.error = undefined;
    task.stage = 'Queued for retry...';
    this.notifyTaskUpdate(task);
    this.processQueue();
  }

  /**
   * Cancel an upload
   */
  cancelUpload(taskId: string): void {
    const task = this.queue.find(t => t.id === taskId);
    if (!task) return;

    const controller = this.abortControllers.get(taskId);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(taskId);
    }

    task.status = 'cancelled';
    task.stage = 'Upload cancelled';
    this.activeUploads.delete(taskId);
    this.notifyTaskUpdate(task);

    // Remove from queue
    this.queue = this.queue.filter(t => t.id !== taskId);
    this.notifyQueueUpdate();
  }

  /**
   * Remove a completed/failed task from queue
   */
  removeTask(taskId: string): void {
    this.queue = this.queue.filter(t => t.id !== taskId);
    this.notifyQueueUpdate();
  }

  /**
   * Get queue status
   */
  getQueue(): UploadTask[] {
    return [...this.queue];
  }

  /**
   * Get task by ID
   */
  getTask(taskId: string): UploadTask | undefined {
    return this.queue.find(t => t.id === taskId);
  }

  /**
   * Handle coming back online
   */
  private handleOnline(): void {
    console.log('🌐 Connection restored - resuming paused uploads');
    toast.success('Connection restored - resuming uploads');

    // Resume all paused uploads
    this.queue.forEach(task => {
      if (task.status === 'paused') {
        this.resumeUpload(task.id);
      }
    });
  }

  /**
   * Handle going offline
   */
  private handleOffline(): void {
    console.log('📡 Connection lost - pausing active uploads');
    toast.warning('Connection lost - uploads will resume when reconnected');

    // Pause all active uploads
    Array.from(this.activeUploads).forEach(taskId => {
      this.pauseUpload(taskId);
    });
  }

  /**
   * Notify callbacks of task update
   */
  private notifyTaskUpdate(task: UploadTask): void {
    // Update elapsed times before notifying
    if (task.startTime) {
      task.totalElapsedSeconds = Math.floor((Date.now() - task.startTime) / 1000);
    }
    if (task.stageStartTime) {
      task.stageElapsedSeconds = Math.floor((Date.now() - task.stageStartTime) / 1000);
    }
    
    this.callbacks.onTaskUpdate?.(task);
  }

  /**
   * Notify callbacks of queue update
   */
  private notifyQueueUpdate(): void {
    this.callbacks.onQueueUpdate?.(this.queue);
  }
  
  /**
   * Helper to set stage and reset stage timer
   */
  private setStage(task: UploadTask, stage: string): void {
    task.stage = stage;
    task.stageStartTime = Date.now();
  }
}

// Singleton instance
export const uploadQueueManager = new UploadQueueManager();