// OCR Module - Main exports

export { ocrQueue } from './ocrQueue';
export type { OcrJob, OcrJobUpdateCallback } from './ocrQueue';

export { processOcrJob, needsOcr, getOcrStatus } from './ocrService';
export type { OcrResult } from './ocrService';

export { ocrImage } from './imageOcr';
export type { ImageOcrResult } from './imageOcr';

export { ocrPDF } from './pdfOcr';
export type { PdfOcrResult, PdfOcrProgress } from './pdfOcr';

export { getWorker, terminateWorker } from './ocrWorker';
