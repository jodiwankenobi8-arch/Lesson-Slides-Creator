// OCR Service - Main orchestration for OCR processing

import type { ExtractionResult, ReferenceChunk } from '../types/extraction';
import { projectId, publicAnonKey } from '../utils/supabase/info';

const SERVER_URL = `https://${projectId}.supabase.co/functions/v1/make-server-0d810c1e`;

const LOW_CONFIDENCE_THRESHOLD = 0.70;

export interface OcrResult {
  chunks: ReferenceChunk[];
  confidence: number;
  lowConfidence: boolean;
  processTimeMs: number;
}

/**
 * Process OCR for a file (image or PDF)
 * This is called by the queue manager
 */
export async function processOcrJob(
  file: File,
  fileRef: LessonFileRef,
  onProgress?: (progress: number) => void
): Promise<OcrResult> {
  console.log(`🔍 Starting OCR for: ${fileRef.originalName}`);
  
  // Check cache first
  const cached = await getCachedOcr(fileRef.sha256);
  if (cached) {
    console.log(`Using cached OCR for ${fileRef.originalName}`);
    return cached;
  }
  
  let result: ImageOcrResult | PdfOcrResult;
  
  // Determine file type and process accordingly
  if (fileRef.mimeType.startsWith('image/')) {
    // Image OCR
    if (onProgress) onProgress(50);
    result = await ocrImage(file, fileRef.fileId);
    if (onProgress) onProgress(100);
  } else if (fileRef.mimeType === 'application/pdf') {
    // PDF OCR
    result = await ocrPDF(file, fileRef.fileId, (pdfProgress: PdfOcrProgress) => {
      if (onProgress) {
        const progress = (pdfProgress.currentPage / pdfProgress.totalPages) * 100;
        onProgress(Math.round(progress));
      }
    });
  } else {
    throw new Error(`Unsupported file type for OCR: ${fileRef.mimeType}`);
  }
  
  const confidence = 'averageConfidence' in result 
    ? result.averageConfidence 
    : result.confidence;
  
  const lowConfidence = confidence < LOW_CONFIDENCE_THRESHOLD;
  
  const ocrResult: OcrResult = {
    chunks: result.chunks,
    confidence,
    lowConfidence,
    processTimeMs: result.processTimeMs,
  };
  
  // Cache result
  await cacheOcr(fileRef.sha256, ocrResult);
  
  // Save OCR result to extraction record
  await saveOcrResult(fileRef, ocrResult);
  
  return ocrResult;
}

/**
 * Get cached OCR result by file hash
 */
async function getCachedOcr(sha256: string): Promise<OcrResult | null> {
  try {
    const response = await fetch(`${SERVER_URL}/ocr/cache/${sha256}`, {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
      },
    });
    
    if (!response.ok) return null;
    
    return response.json();
  } catch (error) {
    console.error('Error fetching cached OCR:', error);
    return null;
  }
}

/**
 * Cache OCR result by file hash
 */
async function cacheOcr(sha256: string, result: OcrResult): Promise<void> {
  try {
    await fetch(`${SERVER_URL}/ocr/cache`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify({ sha256, result }),
    });
  } catch (error) {
    console.error('Error caching OCR:', error);
    // Non-fatal - continue without caching
  }
}

/**
 * Save OCR result to extraction record
 */
async function saveOcrResult(fileRef: LessonFileRef, result: OcrResult): Promise<void> {
  try {
    // Update extraction record with OCR chunks
    const extractionResult: ExtractionResult = {
      fileId: fileRef.fileId,
      lessonId: fileRef.lessonId,
      chunks: result.chunks,
      chunkCount: result.chunks.length,
      extractedAt: new Date().toISOString(),
      status: 'complete',
      extractionTimeMs: result.processTimeMs,
      metadata: {
        ocrConfidence: result.confidence,
        lowConfidence: result.lowConfidence,
      },
    };
    
    const response = await fetch(`${SERVER_URL}/extraction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify(extractionResult),
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to save OCR result: ${error}`);
    }
    
    console.log(`💾 Saved OCR result for ${fileRef.originalName}: ${result.chunks.length} chunks`);
  } catch (error) {
    console.error('Error saving OCR result:', error);
    throw error;
  }
}

/**
 * Check if a file needs OCR
 */
export function needsOcr(fileRef: LessonFileRef): boolean {
  // Images always need OCR
  if (fileRef.mimeType.startsWith('image/')) {
    return true;
  }
  
  // PDFs flagged with ocrRecommended need OCR
  if (fileRef.mimeType === 'application/pdf' && fileRef.ocrRecommended) {
    return true;
  }
  
  return false;
}

/**
 * Get OCR status for files
 */
export function getOcrStatus(fileRef: LessonFileRef): 'not_needed' | 'pending' | 'processing' | 'complete' | 'error' {
  if (!needsOcr(fileRef)) {
    return 'not_needed';
  }
  
  return fileRef.ocrStatus || 'pending';
}