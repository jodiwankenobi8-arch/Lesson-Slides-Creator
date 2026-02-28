// OCR Queue System - Manages async OCR jobs with concurrency control

import type { LessonFileRef } from '../types/files';

export interface OcrJob {
  jobId: string;
  fileId: string;
  file: File;
  fileRef: LessonFileRef;
  status: 'queued' | 'processing' | 'complete' | 'error';
  progress?: number; // 0-100
  error?: string;
  startedAt?: number;
  completedAt?: number;
  result?: {
    chunkCount: number;
    confidence: number;
  };
}

export type OcrJobUpdateCallback = (job: OcrJob) => void;

class OcrQueueManager {
  private queue: OcrJob[] = [];
  private activeJobs = new Map<string, OcrJob>();
  private maxConcurrency = 1; // Default: 1 job at a time
  private listeners = new Set<OcrJobUpdateCallback>();
  private jobResults = new Map<string, any>(); // Store results for retrieval
  
  /**
   * Add a job to the queue
   */
  addJob(file: File, fileRef: LessonFileRef): string {
    const jobId = `ocr-${fileRef.fileId}-${Date.now()}`;
    
    const job: OcrJob = {
      jobId,
      fileId: fileRef.fileId,
      file,
      fileRef,
      status: 'queued',
      progress: 0,
    };
    
    this.queue.push(job);
    this.notifyListeners(job);
    
    console.log(`📋 OCR job queued: ${fileRef.originalName} (${this.queue.length} in queue)`);
    
    // Start processing if capacity available
    this.processNext();
    
    return jobId;
  }
  
  /**
   * Process next job in queue if capacity available
   */
  private async processNext(): Promise<void> {
    if (this.activeJobs.size >= this.maxConcurrency) {
      return; // Already at max concurrency
    }
    
    if (this.queue.length === 0) {
      return; // No jobs to process
    }
    
    const job = this.queue.shift()!;
    this.activeJobs.set(job.jobId, job);
    
    job.status = 'processing';
    job.startedAt = Date.now();
    this.notifyListeners(job);
    
    console.log(`🔄 Processing OCR job: ${job.fileRef.originalName}`);
    
    try {
      // Import OCR service dynamically to avoid circular deps
      const { processOcrJob } = await import('./ocrService');
      
      const result = await processOcrJob(job.file, job.fileRef, (progress) => {
        job.progress = progress;
        this.notifyListeners(job);
      });
      
      job.status = 'complete';
      job.completedAt = Date.now();
      job.result = {
        chunkCount: result.chunks.length,
        confidence: result.confidence,
      };
      
      // Store result for retrieval
      this.jobResults.set(job.jobId, result);
      
      console.log(`✅ OCR job complete: ${job.fileRef.originalName} (${result.chunks.length} chunks, ${Math.round(result.confidence * 100)}% confidence)`);
    } catch (error) {
      job.status = 'error';
      job.error = error instanceof Error ? error.message : String(error);
      job.completedAt = Date.now();
      
      console.error(`❌ OCR job failed: ${job.fileRef.originalName}`, error);
    }
    
    this.activeJobs.delete(job.jobId);
    this.notifyListeners(job);
    
    // Process next job
    this.processNext();
  }
  
  /**
   * Get job status
   */
  getJob(jobId: string): OcrJob | undefined {
    // Check active jobs
    const activeJob = this.activeJobs.get(jobId);
    if (activeJob) return activeJob;
    
    // Check queue
    return this.queue.find(j => j.jobId === jobId);
  }
  
  /**
   * Get all jobs for a lesson
   */
  getJobsByLesson(lessonId: string): OcrJob[] {
    const jobs: OcrJob[] = [];
    
    // Active jobs
    for (const job of this.activeJobs.values()) {
      if (job.fileRef.lessonId === lessonId) {
        jobs.push(job);
      }
    }
    
    // Queued jobs
    for (const job of this.queue) {
      if (job.fileRef.lessonId === lessonId) {
        jobs.push(job);
      }
    }
    
    return jobs;
  }
  
  /**
   * Get job result (chunks)
   */
  getJobResult(jobId: string): any | undefined {
    return this.jobResults.get(jobId);
  }
  
  /**
   * Subscribe to job updates
   */
  subscribe(callback: OcrJobUpdateCallback): () => void {
    this.listeners.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }
  
  /**
   * Notify all listeners of job update
   */
  private notifyListeners(job: OcrJob): void {
    for (const listener of this.listeners) {
      listener({ ...job }); // Clone to prevent mutation
    }
  }
  
  /**
   * Set max concurrency
   */
  setMaxConcurrency(max: number): void {
    this.maxConcurrency = Math.max(1, max);
    
    // Start processing if we increased capacity
    this.processNext();
  }
  
  /**
   * Get queue status
   */
  getStatus(): {
    queuedCount: number;
    activeCount: number;
    maxConcurrency: number;
  } {
    return {
      queuedCount: this.queue.length,
      activeCount: this.activeJobs.size,
      maxConcurrency: this.maxConcurrency,
    };
  }
}

// Singleton instance
export const ocrQueue = new OcrQueueManager();
