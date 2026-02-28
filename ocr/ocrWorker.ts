// OCR Worker Manager - Manages Tesseract.js worker lifecycle

import Tesseract, { Worker } from 'tesseract.js';

let worker: Worker | null = null;
let isInitialized = false;
let activeJobs = 0;

/**
 * Get or create Tesseract worker
 * Lazy initialization - only creates worker when needed
 */
export async function getWorker(): Promise<Worker> {
  if (!worker || !isInitialized) {
    console.log('🔧 Initializing Tesseract.js worker...');
    
    worker = await Tesseract.createWorker('eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`OCR progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });
    
    isInitialized = true;
    console.log('✅ Tesseract.js worker initialized');
  }
  
  return worker;
}

/**
 * Increment active job counter
 */
export function incrementJobCount(): void {
  activeJobs++;
}

/**
 * Decrement active job counter and cleanup if no jobs remain
 */
export function decrementJobCount(): void {
  activeJobs--;
  
  // Auto-cleanup worker when no jobs remain (optional optimization)
  if (activeJobs === 0) {
    // Schedule cleanup after 30 seconds of inactivity
    setTimeout(() => {
      if (activeJobs === 0 && worker && isInitialized) {
        console.log('🧹 Terminating idle Tesseract worker');
        worker.terminate();
        worker = null;
        isInitialized = false;
      }
    }, 30000);
  }
}

/**
 * Get current active job count
 */
export function getActiveJobCount(): number {
  return activeJobs;
}

/**
 * Force terminate worker (cleanup)
 */
export async function terminateWorker(): Promise<void> {
  if (worker && isInitialized) {
    await worker.terminate();
    worker = null;
    isInitialized = false;
    activeJobs = 0;
    console.log('🛑 Tesseract worker terminated');
  }
}
