// PDF OCR Handler - Render PDF pages to canvas and OCR each page

import * as pdfjsLib from 'pdfjs-dist';
import { getWorker, incrementJobCount, decrementJobCount } from './ocrWorker';
import type { ReferenceChunk } from '../types/extraction';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

const MAX_IMAGE_DIMENSION = 2000; // Max dimension for rendered pages

export interface PdfOcrResult {
  chunks: ReferenceChunk[];
  averageConfidence: number;
  totalPages: number;
  processTimeMs: number;
}

export interface PdfOcrProgress {
  currentPage: number;
  totalPages: number;
  pageText?: string;
  pageConfidence?: number;
}

/**
 * OCR all pages of a PDF
 * Each page is rendered to canvas and OCR'd separately
 */
export async function ocrPDF(
  file: File,
  fileId: string,
  onProgress?: (progress: PdfOcrProgress) => void
): Promise<PdfOcrResult> {
  const startTime = Date.now();
  
  incrementJobCount();
  
  try {
    // Load PDF
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const totalPages = pdf.numPages;
    
    console.log(`Starting OCR for PDF: ${file.name} (${totalPages} pages)`);
    
    const chunks: ReferenceChunk[] = [];
    const confidences: number[] = [];
    
    // Get worker once for all pages
    const worker = await getWorker();
    
    // OCR each page sequentially
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      // Render page to canvas
      const canvas = await renderPageToCanvas(pdf, pageNum);
      
      // OCR the canvas
      const { data } = await worker.recognize(canvas);
      const text = data.text.trim();
      const confidence = data.confidence / 100; // Convert to 0-1 range
      
      console.log(`OCR page ${pageNum}/${totalPages}: ${text.length} chars, confidence: ${Math.round(confidence * 100)}%`);
      
      if (text) {
        chunks.push({
          chunkId: `${fileId}-ocr-page-${pageNum}`,
          fileId,
          pageOrSlide: pageNum,
          source: 'pdf_ocr' as const,
          text,
          metadata: {
            confidence,
            pageLabel: `Page ${pageNum}`,
            totalPages,
          },
        });
      }
      
      confidences.push(confidence);
      
      // Report progress
      if (onProgress) {
        onProgress({
          currentPage: pageNum,
          totalPages,
          pageText: text.substring(0, 100),
          pageConfidence: confidence,
        });
      }
    }
    
    const averageConfidence = confidences.length > 0
      ? confidences.reduce((sum, c) => sum + c, 0) / confidences.length
      : 0;
    
    console.log(`PDF OCR complete: ${chunks.length} pages, avg confidence: ${Math.round(averageConfidence * 100)}%`);
    
    return {
      chunks,
      averageConfidence,
      totalPages,
      processTimeMs: Date.now() - startTime,
    };
  } finally {
    decrementJobCount();
  }
}

/**
 * Render a PDF page to canvas
 */
async function renderPageToCanvas(
  pdf: pdfjsLib.PDFDocumentProxy,
  pageNum: number
): Promise<HTMLCanvasElement> {
  const page = await pdf.getPage(pageNum);
  
  // Get viewport
  let viewport = page.getViewport({ scale: 1.0 });
  
  // Calculate scale to fit MAX_IMAGE_DIMENSION
  const scale = Math.min(
    MAX_IMAGE_DIMENSION / viewport.width,
    MAX_IMAGE_DIMENSION / viewport.height,
    2.0 // Max 2x scale for quality
  );
  
  viewport = page.getViewport({ scale });
  
  // Create canvas
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Failed to get canvas context');
  }
  
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  
  // Render page to canvas
  await page.render({
    canvasContext: context,
    viewport,
  }).promise;
  
  return canvas;
}