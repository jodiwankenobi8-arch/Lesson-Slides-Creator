// Extraction result types

export interface ExtractionResult {
  fileId: string;
  lessonId: string;
  chunks: ReferenceChunk[];
  chunkCount: number;
  extractedAt: string;
  status: 'complete' | 'error';
  extractionTimeMs: number;
  error?: string;
  ocrRecommended?: boolean;
  metadata?: Record<string, any>;
}

export interface ReferenceChunk {
  chunkId: string;
  fileId: string;
  pageOrSlide: number;
  source: 'pptx' | 'pdf_text' | 'pdf_ocr' | 'image_ocr' | 'ocr';
  text: string;
  metadata?: {
    section?: 'slide_text' | 'speaker_notes' | 'hyperlinks';
    slideLabel?: string;
    pageLabel?: string;
    totalPages?: number;
    confidence?: number;
    lowConfidence?: boolean;
  };
}