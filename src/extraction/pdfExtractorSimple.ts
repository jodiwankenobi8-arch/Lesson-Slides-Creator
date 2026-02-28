// Simplified PDF Extractor - temporary OCR-only approach
// Bypasses pdfjs-dist browser compatibility issues

import type { ReferenceChunk } from '../types/extraction';

interface PDFExtractionResult {
  chunks: ReferenceChunk[];
  ocrRecommended: boolean;
  totalPages: number;
  textLength: number;
}

/**
 * TEMPORARY: Flag all PDFs for OCR extraction
 * 
 * This bypasses browser compatibility issues with pdfjs-dist.
 * In Checkpoint 3, we'll implement OCR which will handle all PDFs.
 * 
 * TODO: Add PDF text layer extraction after resolving pdfjs-dist issues
 */
export async function extractPDF(
  file: File,
  fileId: string
): Promise<PDFExtractionResult> {
  console.log(`PDF flagged for OCR: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);

  // For now, we can't determine page count without pdfjs-dist
  // OCR will handle this in Checkpoint 3
  const estimatedPages = Math.ceil(file.size / 50000); // Rough estimate: ~50KB per page

  return {
    chunks: [], // No text extraction yet
    ocrRecommended: true, // Always recommend OCR for PDFs
    totalPages: estimatedPages,
    textLength: 0,
  };
}

/**
 * Check if PDF has a text layer
 * Currently always returns false (OCR will be used)
 */
export async function hasTextLayer(file: File): Promise<boolean> {
  // Skip text layer detection to avoid pdfjs-dist issues
  return false;
}