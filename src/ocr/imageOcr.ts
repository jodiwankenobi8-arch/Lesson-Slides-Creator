// Image OCR Handler - OCR images directly

import { getWorker, incrementJobCount, decrementJobCount } from './ocrWorker';
import type { ReferenceChunk } from '../types/extraction';

const MAX_IMAGE_DIMENSION = 2000; // Max width/height before downscaling
const MIN_FILE_SIZE = 20 * 1024; // 20KB - skip OCR for smaller files (likely decorative)

export interface ImageOcrResult {
  chunks: ReferenceChunk[];
  confidence: number;
  processTimeMs: number;
}

/**
 * OCR an image file
 * 
 * Performance safeguards:
 * - Downscale large images to MAX_IMAGE_DIMENSION
 * - Skip OCR for tiny files (< 20KB)
 */
export async function ocrImage(
  file: File,
  fileId: string
): Promise<ImageOcrResult> {
  const startTime = Date.now();
  
  // Skip OCR for tiny files (likely decorative)
  if (file.size < MIN_FILE_SIZE) {
    console.log(`Skipping OCR for small image: ${file.name} (${file.size} bytes)`);
    return {
      chunks: [],
      confidence: 0,
      processTimeMs: Date.now() - startTime,
    };
  }
  
  incrementJobCount();
  
  try {
    // Load image and optionally downscale
    const imageData = await loadAndPrepareImage(file);
    
    // Get worker and perform OCR
    const worker = await getWorker();
    const { data } = await worker.recognize(imageData);
    
    const confidence = data.confidence / 100; // Convert to 0-1 range
    const text = data.text.trim();
    
    console.log(`OCR complete for ${file.name}: ${text.length} chars, confidence: ${Math.round(confidence * 100)}%`);
    
    // Create chunk
    const chunks: ReferenceChunk[] = text ? [{
      chunkId: `${fileId}-ocr-1`,
      fileId,
      pageOrSlide: 1,
      source: 'image_ocr' as const,
      text,
      metadata: {
        confidence,
        pageLabel: 'Page 1',
      },
    }] : [];
    
    return {
      chunks,
      confidence,
      processTimeMs: Date.now() - startTime,
    };
  } finally {
    decrementJobCount();
  }
}

/**
 * Load image and downscale if needed
 * Returns canvas or image element for Tesseract
 */
async function loadAndPrepareImage(file: File): Promise<HTMLCanvasElement | HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      
      const { width, height } = img;
      
      // Check if downscaling needed
      if (width <= MAX_IMAGE_DIMENSION && height <= MAX_IMAGE_DIMENSION) {
        // No downscaling needed
        resolve(img);
        return;
      }
      
      // Downscale to MAX_IMAGE_DIMENSION while preserving aspect ratio
      const scale = Math.min(MAX_IMAGE_DIMENSION / width, MAX_IMAGE_DIMENSION / height);
      const newWidth = Math.round(width * scale);
      const newHeight = Math.round(height * scale);
      
      console.log(`Downscaling image from ${width}x${height} to ${newWidth}x${newHeight}`);
      
      const canvas = document.createElement('canvas');
      canvas.width = newWidth;
      canvas.height = newHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, newWidth, newHeight);
      resolve(canvas);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
}
