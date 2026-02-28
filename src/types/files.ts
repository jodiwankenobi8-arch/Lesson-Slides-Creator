// File upload and processing types

export interface FileUploadRequest {
  file: File;
  category: 'reference' | 'lesson';
  lessonId?: string;
}

export interface FileUploadResult {
  fileId: string;
  fileName: string;
  fileType: 'pptx' | 'pdf' | 'image';
  fileSize: number;
  storageUrl: string;
  hash: string;
  uploadedAt: string;
}

export interface FileValidationError {
  file: string;
  error: string;
  code: 'FILE_TOO_LARGE' | 'INVALID_TYPE' | 'UPLOAD_FAILED' | 'VIRUS_DETECTED';
}

export interface FileUploadProgress {
  fileId: string;
  fileName: string;
  progress: number; // 0-100
  status: 'pending' | 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
}

// File processing job
export interface FileProcessingJob {
  jobId: string;
  fileId: string;
  lessonId: string;
  status: 'queued' | 'processing' | 'complete' | 'failed';
  startedAt?: string;
  completedAt?: string;
  error?: string;
  result?: {
    chunksExtracted: number;
    ocrRun?: boolean;
  };
}

// PPTX extraction result
export interface PptxExtractionResult {
  fileId: string;
  slides: {
    slideNumber: number;
    text: string;
    notes?: string;
    links?: string[];
  }[];
  totalSlides: number;
}

// PDF extraction result
export interface PdfExtractionResult {
  fileId: string;
  pages: {
    pageNumber: number;
    text: string;
  }[];
  totalPages: number;
}

// Image OCR result (optional)
export interface ImageOcrResult {
  fileId: string;
  text: string;
  confidence: number;
  language: string;
}

export const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB (educational materials can be large)
export const MAX_FILES_PER_LESSON = 20;
export const ALLOWED_FILE_TYPES = ['pptx', 'pdf', 'png', 'jpg', 'jpeg'] as const;
export type AllowedFileType = typeof ALLOWED_FILE_TYPES[number];

// Lesson file reference
export interface LessonFileRef {
  fileId: string;
  lessonId: string;
  category: FileCategory;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  sha256: string;
  status: FileProcessingStatus;
  uploadedAt: string;
  pageOrSlideCount?: number;
  progress?: number;
  error?: string;
  // Extraction metadata
  extractionStatus?: 'pending' | 'extracting' | 'complete' | 'error';
  extractionError?: string;
  chunkCount?: number;
  extractedAt?: string;
  ocrRecommended?: boolean;
  ocrStatus?: 'not_started' | 'queued' | 'processing' | 'complete' | 'error';
}

export type FileCategory = 
  | 'reference_deck'
  | 'reference_guide'
  | 'lesson_pptx'
  | 'lesson_pdf'
  | 'lesson_images'
  | 'story_pages';
  
export type FileProcessingStatus = 
  | 'queued' 
  | 'uploading' 
  | 'processing' 
  | 'ready'      // Changed from 'complete' to 'ready' (more user-friendly)
  | 'failed';    // Keeping 'failed' (standard error term)