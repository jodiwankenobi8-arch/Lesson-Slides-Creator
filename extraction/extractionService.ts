// Extraction Service - orchestrates PPTX/PDF extraction and persistence

import type { ReferenceChunk, ExtractionResult } from '../types/extraction';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { ocrQueue } from '../ocr/ocrQueue';
import { needsOcr } from '../ocr/ocrService';

const SERVER_URL = `https://${projectId}.supabase.co/functions/v1/make-server-0d810c1e`;

/**
 * Extract content from a file based on its type
 * 
 * ASYNC + NON-BLOCKING + IDEMPOTENT
 */
export async function extractFile(
  file: File,
  fileRef: LessonFileRef
): Promise<ExtractionResult> {
  const startTime = Date.now();

  try {
    // Check if already extracted (idempotent via SHA-256 hash)
    const cached = await getCachedExtraction(fileRef.sha256);
    if (cached) {
      console.log(`Using cached extraction for ${fileRef.originalName} (hash: ${fileRef.sha256})`);
      
      // Still queue OCR if needed (cache might be from before OCR)
      if (needsOcr(fileRef)) {
        queueOcrIfNeeded(file, fileRef);
      }
      
      return cached;
    }

    let chunks: ReferenceChunk[] = [];
    let ocrRecommended = false;
    let metadata: Record<string, any> = {};

    // Extract based on file type
    if (fileRef.mimeType.includes('presentation') || fileRef.originalName.endsWith('.pptx')) {
      chunks = await extractPPTX(file, fileRef.fileId);
      metadata.slideCount = Math.max(...chunks.map(c => c.pageOrSlide || 0));
    } else if (fileRef.mimeType === 'application/pdf' || fileRef.originalName.endsWith('.pdf')) {
      const pdfResult = await extractPDF(file, fileRef.fileId);
      chunks = pdfResult.chunks;
      ocrRecommended = pdfResult.ocrRecommended;
      metadata.totalPages = pdfResult.totalPages;
      metadata.textLength = pdfResult.textLength;
    } else if (
      fileRef.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileRef.originalName.toLowerCase().endsWith('.docx')
    ) {
      chunks = await extractDOCX(file, fileRef.fileId);
      metadata.wordCount = chunks[0]?.metadata?.wordCount || 0;
      metadata.characterCount = chunks[0]?.metadata?.characterCount || 0;
    } else if (fileRef.mimeType === 'application/msword' || fileRef.originalName.toLowerCase().endsWith('.doc')) {
      // Old .doc format not supported
      throw new Error(
        'Old .doc format is not supported. Please convert to .docx format using Microsoft Word (File → Save As → Word Document (.docx))'
      );
    } else if (fileRef.mimeType.startsWith('image/')) {
      // Images: recommend OCR (will be handled async)
      ocrRecommended = true;
      chunks = [];
    } else {
      throw new Error(`Unsupported file type: ${fileRef.mimeType}`);
    }

    const extractionTime = Date.now() - startTime;

    const result: ExtractionResult = {
      fileId: fileRef.fileId,
      lessonId: fileRef.lessonId,
      chunks,
      chunkCount: chunks.length,
      extractedAt: new Date().toISOString(),
      status: 'complete',
      extractionTimeMs: extractionTime,
      ocrRecommended,
      metadata,
    };

    // Cache extraction result by SHA-256
    await cacheExtraction(fileRef.sha256, result);

    // Save to lesson extraction record
    await saveExtractionResult(result);

    // Queue OCR if needed (non-blocking)
    if (needsOcr(fileRef)) {
      queueOcrIfNeeded(file, fileRef);
    }

    return result;
  } catch (error) {
    console.error(`Extraction failed for ${fileRef.originalName}:`, error);

    const result: ExtractionResult = {
      fileId: fileRef.fileId,
      lessonId: fileRef.lessonId,
      chunks: [],
      chunkCount: 0,
      extractedAt: new Date().toISOString(),
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
      extractionTimeMs: Date.now() - startTime,
      ocrRecommended: false,
    };

    // Save error result
    await saveExtractionResult(result);

    return result;
  }
}

/**
 * Queue OCR job if needed (non-blocking)
 */
function queueOcrIfNeeded(file: File, fileRef: LessonFileRef): void {
  try {
    const jobId = ocrQueue.addJob(file, fileRef);
    console.log(`📋 Queued OCR job: ${jobId} for ${fileRef.originalName}`);
  } catch (error) {
    console.error('Failed to queue OCR job:', error);
    // Non-fatal - continue without OCR
  }
}

/**
 * Get cached extraction by file hash (idempotent)
 */
async function getCachedExtraction(sha256: string): Promise<ExtractionResult | null> {
  try {
    const response = await fetch(`${SERVER_URL}/extraction/cache/${sha256}`, {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
      },
    });

    if (!response.ok) return null;

    return response.json();
  } catch (error) {
    console.error('Error fetching cached extraction:', error);
    return null;
  }
}

/**
 * Cache extraction result by file hash
 */
async function cacheExtraction(sha256: string, result: ExtractionResult): Promise<void> {
  try {
    await fetch(`${SERVER_URL}/extraction/cache`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify({ sha256, result }),
    });
  } catch (error) {
    console.error('Error caching extraction:', error);
    // Non-fatal - continue without caching
  }
}

/**
 * Save extraction result to lesson record
 */
async function saveExtractionResult(result: ExtractionResult): Promise<void> {
  try {
    const response = await fetch(`${SERVER_URL}/extraction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify(result),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to save extraction result: ${error}`);
    }
  } catch (error) {
    console.error('Error saving extraction result:', error);
    throw error;
  }
}

/**
 * Get extraction results for a lesson
 */
export async function getLessonExtractions(lessonId: string): Promise<ExtractionResult[]> {
  try {
    const response = await fetch(`${SERVER_URL}/extraction/${lessonId}`, {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) return [];
      throw new Error('Failed to fetch extraction results');
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching extractions:', error);
    return [];
  }
}

/**
 * Get extraction result for a specific file
 */
export async function getFileExtraction(fileId: string): Promise<ExtractionResult | null> {
  try {
    const response = await fetch(`${SERVER_URL}/extraction/file/${fileId}`, {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
      },
    });

    if (!response.ok) return null;

    return response.json();
  } catch (error) {
    console.error('Error fetching file extraction:', error);
    return null;
  }
}

/**
 * Re-run extraction for a file (idempotent - will use cache if hash matches)
 */
export async function rerunExtraction(file: File, fileRef: LessonFileRef): Promise<ExtractionResult> {
  // Clear cache for this file's hash to force re-extraction
  try {
    await fetch(`${SERVER_URL}/extraction/cache/${fileRef.sha256}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
      },
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
  }

  return extractFile(file, fileRef);
}