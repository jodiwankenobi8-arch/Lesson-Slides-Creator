/**
 * OCR Detection Utilities (Frontend)
 * 
 * Determines which files need OCR processing based on file type
 * This is shared logic used by both frontend and backend
 */

export type OCRJobType = 'ocr_image' | 'ocr_pdf' | 'extract_pptx' | null;

/**
 * Determine if a file needs OCR based on its type
 */
export function needsOCR(fileName: string, fileType: string): boolean {
  const ext = fileName.toLowerCase().split('.').pop() || '';
  
  // Images always need OCR
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp'].includes(ext)) {
    return true;
  }
  
  // PDFs might need OCR (we'll check during processing)
  if (ext === 'pdf' || fileType.includes('pdf')) {
    return true;
  }
  
  // PPTX files might have images that need OCR
  if (ext === 'pptx' || fileType.includes('presentation')) {
    return true;
  }
  
  // Word docs and other text files don't need OCR
  if (['doc', 'docx', 'txt', 'md'].includes(ext)) {
    return false;
  }
  
  return false;
}

/**
 * Get the OCR job type for a file
 */
export function getOCRJobType(fileName: string, fileType: string): OCRJobType {
  const ext = fileName.toLowerCase().split('.').pop() || '';
  
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp'].includes(ext)) {
    return 'ocr_image';
  }
  
  if (ext === 'pdf' || fileType.includes('pdf')) {
    return 'ocr_pdf';
  }
  
  if (ext === 'pptx' || fileType.includes('presentation')) {
    return 'extract_pptx';
  }
  
  return null;
}

/**
 * Get a human-readable description of the OCR job type
 */
export function getOCRJobDescription(jobType: OCRJobType): string {
  switch (jobType) {
    case 'ocr_image':
      return 'Extracting text from image';
    case 'ocr_pdf':
      return 'Extracting text from PDF';
    case 'extract_pptx':
      return 'Extracting content from slides';
    default:
      return 'Processing file';
  }
}

/**
 * Check if a file is an image that needs OCR
 */
export function isImageFile(fileName: string): boolean {
  const ext = fileName.toLowerCase().split('.').pop() || '';
  return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp'].includes(ext);
}

/**
 * Check if a file is a PDF
 */
export function isPDFFile(fileName: string, fileType: string): boolean {
  const ext = fileName.toLowerCase().split('.').pop() || '';
  return ext === 'pdf' || fileType.includes('pdf');
}

/**
 * Check if a file is a PowerPoint presentation
 */
export function isPPTXFile(fileName: string, fileType: string): boolean {
  const ext = fileName.toLowerCase().split('.').pop() || '';
  return ext === 'pptx' || fileType.includes('presentation');
}
