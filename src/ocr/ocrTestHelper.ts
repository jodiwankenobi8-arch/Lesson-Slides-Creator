// OCR Test Helper - Utilities for testing OCR pipeline

import { ocrQueue } from './ocrQueue';
import type { LessonFileRef } from '../types/files';

/**
 * Create a mock file for testing
 */
export function createMockImageFile(text: string = 'Test OCR Text'): File {
  // Create a simple canvas with text
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 200;
  
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'black';
    ctx.font = '24px Arial';
    ctx.fillText(text, 50, 100);
  }
  
  return new Promise<File>((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(new File([blob], 'test-image.png', { type: 'image/png' }));
      }
    });
  }) as any; // Type hack for demo
}

/**
 * Create a mock file reference for testing
 */
export function createMockFileRef(overrides?: Partial<LessonFileRef>): LessonFileRef {
  return {
    fileId: crypto.randomUUID(),
    lessonId: 'test-lesson-' + Date.now(),
    category: 'lesson_images',
    originalName: 'test-image.png',
    mimeType: 'image/png',
    sizeBytes: 50000,
    storagePath: '/test/path',
    sha256: crypto.randomUUID(), // Mock hash
    status: 'complete',
    uploadedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Test OCR queue with a mock image
 */
export async function testOcrQueue(text: string = 'Hello OCR!'): Promise<void> {
  console.log('🧪 Starting OCR test...');
  
  // Create mock file and reference
  const file = await createMockImageFile(text);
  const fileRef = createMockFileRef({
    originalName: 'test-ocr.png',
    mimeType: 'image/png',
  });
  
  // Subscribe to updates
  const updates: string[] = [];
  const unsubscribe = ocrQueue.subscribe((job) => {
    updates.push(`${job.status} - ${job.progress || 0}%`);
    console.log('📊 Job update:', job.status, job.progress);
  });
  
  // Queue job
  const jobId = ocrQueue.addJob(file, fileRef);
  console.log('✅ Job queued:', jobId);
  
  // Wait for completion (poll for demo purposes)
  let attempts = 0;
  const checkComplete = setInterval(() => {
    const job = ocrQueue.getJob(jobId);
    if (job && (job.status === 'complete' || job.status === 'error')) {
      clearInterval(checkComplete);
      unsubscribe();
      
      console.log('🎉 Test complete!');
      console.log('Updates:', updates);
      console.log('Result:', job.result);
    }
    
    attempts++;
    if (attempts > 30) {
      clearInterval(checkComplete);
      unsubscribe();
      console.error('❌ Test timeout');
    }
  }, 1000);
}

/**
 * Get queue status for debugging
 */
export function debugQueueStatus(): void {
  const status = ocrQueue.getStatus();
  console.log('📋 OCR Queue Status:', {
    queued: status.queuedCount,
    active: status.activeCount,
    maxConcurrency: status.maxConcurrency,
  });
}

// Expose to window for console testing
if (typeof window !== 'undefined') {
  (window as any).ocrTest = {
    testQueue: testOcrQueue,
    debugStatus: debugQueueStatus,
    createMockFile: createMockImageFile,
    createMockRef: createMockFileRef,
  };
  
  console.log('💡 OCR Test helpers loaded. Try: window.ocrTest.testQueue()');
}
