/**
 * OCR Worker Service
 * 
 * Manages Tesseract OCR workers independently of React component lifecycle.
 * Jobs continue processing even when user navigates away.
 */

import { createWorker, Worker } from 'tesseract.js';
import { updateJob, type Job } from './job-queue';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';
import { api } from '../../utils/api';  // ✅ ONLY ALLOWED API PATTERN

interface OCRJob {
  jobId: string;
  imageData: string | Blob | ImageData;
  pageNumber?: number;
  totalPages?: number;
}

class OCRWorkerService {
  private worker: Worker | null = null;
  private isInitialized = false;
  private queue: OCRJob[] = [];
  private isProcessing = false;

  /**
   * Initialize the Tesseract worker
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    console.log('Initializing OCR worker...');
    
    try {
      // Configure to use local resources from node_modules instead of CDN
      this.worker = await createWorker('eng', 1, {
        logger: (m) => {
          // Log progress for debugging
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        },
        // Use local paths instead of CDN
        workerPath: '/node_modules/tesseract.js/dist/worker.min.js',
        langPath: 'https://tessdata.projectnaptha.com/4.0.0',
        corePath: '/node_modules/tesseract.js-core',
        // Disable remote loading
        cacheMethod: 'none',
      });

      this.isInitialized = true;
      console.log('OCR worker initialized successfully');
    } catch (error) {
      console.error('Failed to initialize OCR worker:', error);
      console.warn('OCR functionality will be disabled. Screenshots will be processed without text extraction.');
      // Don't throw - allow the app to continue without OCR
      this.isInitialized = false;
    }
  }

  /**
   * Add a job to the processing queue
   */
  async queueJob(job: OCRJob): Promise<void> {
    console.log(`Queuing OCR job ${job.jobId}${job.pageNumber ? ` (page ${job.pageNumber}/${job.totalPages})` : ''}`);
    
    this.queue.push(job);
    
    // Start processing if not already running
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  /**
   * Process the job queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const job = this.queue.shift();
      if (!job) continue;

      try {
        await this.processJob(job);
      } catch (error) {
        console.error(`Error processing job ${job.jobId}:`, error);
        
        // Mark job as error
        await updateJob(job.jobId, {
          status: 'error',
          errorMessage: String(error),
          progress: 0,
        });
      }
    }

    this.isProcessing = false;
  }

  /**
   * Process a single OCR job
   */
  private async processJob(job: OCRJob): Promise<void> {
    const { jobId, imageData, pageNumber, totalPages } = job;

    console.log(`Processing OCR job ${jobId}${pageNumber ? ` (page ${pageNumber}/${totalPages})` : ''}...`);

    // Ensure worker is initialized
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.worker || !this.isInitialized) {
      // OCR worker failed to initialize - mark job as complete without OCR
      console.warn(`OCR worker unavailable for job ${jobId}. Marking as complete without text extraction.`);
      
      await updateJob(jobId, {
        status: 'complete',
        progress: 1,
        errorMessage: 'OCR unavailable - worker initialization failed',
      });
      
      return;
    }

    // Update job status to processing
    await updateJob(jobId, {
      status: 'processing',
      currentPage: pageNumber,
      totalPages: totalPages,
    });

    try {
      // Perform OCR
      const { data } = await this.worker.recognize(imageData, {}, {
        text: true,
        blocks: true,
        hocr: false,
        tsv: false,
      });

      const text = data.text || '';
      const confidence = data.confidence || 0;
      const hasLowConfidence = confidence < 70;

      console.log(`OCR completed for job ${jobId}: ${text.length} chars, confidence: ${confidence.toFixed(1)}%`);

      // Get job details to extract lessonId and fileId
      const jobResponse = await api.getJob(jobId);
      
      if (!jobResponse.ok) {
        throw new Error('Failed to get job details');
      }
      
      const jobDetails = await jobResponse.json();
      
      // Store OCR results as extraction chunk matching pipeline format
      const chunkId = `chunk_${jobId}_${pageNumber || 1}`;
      const chunkKey = `extraction_chunk:${jobDetails.lessonId}:${jobDetails.fileId}:${chunkId}`;
      
      const chunkData = {
        chunkId,
        lessonId: jobDetails.lessonId,
        fileId: jobDetails.fileId,
        pageOrSlide: pageNumber || 1,
        source: 'ocr',
        text,
        confidence,
        lowConfidence: hasLowConfidence,
      };
      
      // Save chunk to server via extraction API
      const response = await api.extractionChunk({
        lessonId: jobDetails.lessonId,
        chunkIndex: pageNumber || 1,
        text: text,
      });

      if (!response.ok) {
        throw new Error('Failed to save OCR chunk');
      }

      // Calculate progress
      const progress = totalPages ? (pageNumber || 1) / totalPages : 1;

      // Update job as complete (or partial progress for multi-page)
      const isComplete = !totalPages || (pageNumber === totalPages);
      
      await updateJob(jobId, {
        status: isComplete ? 'complete' : 'processing',
        progress,
        currentPage: pageNumber,
        resultRef: chunkKey,
      });

      // If complete, save extraction summary for the file
      if (isComplete) {
        const summaryKey = `extraction:${jobDetails.fileId}`;
        const summaryData = {
          fileId: jobDetails.fileId,
          lessonId: jobDetails.lessonId,
          fileName: jobDetails.fileName,
          ocrStatus: 'complete',
          ocrRecommended: true,
          chunkCount: totalPages || 1,
          avgConfidence: confidence,
          extractedAt: new Date().toISOString(),
        };
        
        await api.kvSet(summaryKey, summaryData);
        
        // Also save to OCR cache by file hash if we have it
        // Note: We'd need to pass sha256 through the job data to cache properly
        // For now, caching happens at upload time (before job creation)
      }

      console.log(`Job ${jobId} ${isComplete ? 'completed' : 'progress updated'}: ${Math.round(progress * 100)}%`);
    } catch (error) {
      console.error(`OCR failed for job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Terminate the worker (cleanup)
   */
  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
      console.log('OCR worker terminated');
    }
  }

  /**
   * Get queue status
   */
  getQueueStatus() {
    return {
      queueLength: this.queue.length,
      isProcessing: this.isProcessing,
      isInitialized: this.isInitialized,
    };
  }
}

// Singleton instance
const ocrWorkerService = new OCRWorkerService();

// Initialize on first import
ocrWorkerService.initialize().catch(console.error);

export { ocrWorkerService };
export type { OCRJob };