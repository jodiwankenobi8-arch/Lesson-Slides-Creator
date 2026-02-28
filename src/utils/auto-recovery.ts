/**
 * Auto-Recovery Snapshot System
 * 
 * Automatically saves MINIMAL app state to localStorage every 30 seconds.
 * If the app crashes or browser closes, state is restored on next load.
 * 
 * SAVED STATE (MINIMAL):
 * - lessonId (string)
 * - route (string)
 * - slideIndex (number)
 * - timestamp (number)
 * 
 * RECOVERY:
 * - On app boot, check for recent snapshot (<1 hour old)
 * - Show recovery prompt if found
 * - User can restore or discard
 * 
 * CLEANUP:
 * - Auto-delete snapshots older than 1 hour
 * - Clear snapshot when lesson is properly closed
 */

interface AutoRecoverySnapshot {
  timestamp: number;
  lessonId?: string;
  route?: string;
  slideIndex?: number;
}

const SNAPSHOT_KEY = 'auto-recovery-snapshot';
const SNAPSHOT_INTERVAL = 30000; // 30 seconds
const SNAPSHOT_MAX_AGE = 3600000; // 1 hour

let saveInterval: NodeJS.Timeout | null = null;
let isPageVisible = true;
let visibilityChangeHandler: (() => void) | null = null;

/**
 * Start auto-save interval
 * Call this when app boots
 * Pauses when tab is hidden to save resources
 */
export function startAutoRecovery() {
  console.log('✅ Auto-recovery started - saving every 30s');
  
  // Track page visibility to pause when hidden
  visibilityChangeHandler = () => {
    isPageVisible = !document.hidden;
    if (isPageVisible) {
      // Save immediately when tab becomes visible again
      saveSnapshot();
    }
  };
  
  document.addEventListener('visibilitychange', visibilityChangeHandler);
  
  // Save immediately
  saveSnapshot();
  
  // Then save every 30 seconds (only when page visible)
  saveInterval = setInterval(() => {
    if (isPageVisible) {
      saveSnapshot();
    }
  }, SNAPSHOT_INTERVAL);
  
  // Clean up old snapshots on start
  cleanupOldSnapshots();
}

/**
 * Stop auto-save interval
 * Call this when app unmounts (rare)
 */
export function stopAutoRecovery() {
  if (saveInterval) {
    clearInterval(saveInterval);
    saveInterval = null;
  }
  
  if (visibilityChangeHandler) {
    document.removeEventListener('visibilitychange', visibilityChangeHandler);
    visibilityChangeHandler = null;
  }
  
  console.log('🛑 Auto-recovery stopped');
}

/**
 * Save current app state to localStorage
 */
export function saveSnapshot() {
  try {
    const snapshot: AutoRecoverySnapshot = {
      timestamp: Date.now(),
      lessonId: localStorage.getItem('current-draft-lesson-id') || undefined,
      slideIndex: getCurrentSlideIndex(),
      route: window.location.pathname,
    };
    
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
    console.log('💾 Snapshot saved:', {
      lessonId: snapshot.lessonId,
      slide: snapshot.slideIndex,
      route: snapshot.route,
    });
  } catch (error) {
    console.error('❌ Failed to save snapshot:', error);
  }
}

/**
 * Get the most recent snapshot if it exists and is recent
 */
export function getRecoverySnapshot(): AutoRecoverySnapshot | null {
  try {
    const stored = localStorage.getItem(SNAPSHOT_KEY);
    if (!stored) return null;
    
    const snapshot: AutoRecoverySnapshot = JSON.parse(stored);
    
    // Check if snapshot is recent enough
    const age = Date.now() - snapshot.timestamp;
    if (age > SNAPSHOT_MAX_AGE) {
      console.log('⏰ Snapshot too old, discarding');
      clearSnapshot();
      return null;
    }
    
    // Only recover if there's meaningful data
    if (!snapshot.lessonId && !snapshot.route) {
      return null;
    }
    
    console.log('🔍 Found recovery snapshot:', {
      age: `${Math.floor(age / 1000)}s ago`,
      lessonId: snapshot.lessonId,
      route: snapshot.route,
    });
    
    return snapshot;
  } catch (error) {
    console.error('❌ Failed to load snapshot:', error);
    return null;
  }
}

/**
 * Clear the current snapshot
 * Call when lesson is properly closed or user dismisses recovery
 */
export function clearSnapshot() {
  localStorage.removeItem(SNAPSHOT_KEY);
  console.log('🗑️ Snapshot cleared');
}

/**
 * Apply snapshot data to restore app state
 */
export function restoreFromSnapshot(snapshot: AutoRecoverySnapshot): string | null {
  try {
    const { lessonId, slideIndex } = snapshot;
    
    // Restore lesson ID
    if (lessonId) {
      localStorage.setItem('current-draft-lesson-id', lessonId);
    }
    
    // Restore slide index
    if (slideIndex !== undefined) {
      localStorage.setItem('current-slide-index', slideIndex.toString());
    }
    
    console.log('✅ Restored from snapshot:', {
      lessonId: lessonId,
      slide: slideIndex,
    });
    
    // Return route to navigate to
    return snapshot.route || null;
  } catch (error) {
    console.error('❌ Failed to restore snapshot:', error);
    return null;
  }
}

/**
 * Delete snapshots older than max age
 */
function cleanupOldSnapshots() {
  try {
    const snapshot = getRecoverySnapshot();
    if (!snapshot) {
      // Already cleaned up
      return;
    }
  } catch (error) {
    // Ignore cleanup errors
  }
}

/**
 * Get current slide index from URL or state
 */
function getCurrentSlideIndex(): number | undefined {
  try {
    // Check URL params
    const url = new URL(window.location.href);
    const slideParam = url.searchParams.get('slide');
    if (slideParam) {
      return parseInt(slideParam, 10);
    }
    
    // Check localStorage
    const stored = localStorage.getItem('current-slide-index');
    if (stored) {
      return parseInt(stored, 10);
    }
    
    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * Check if there's a recoverable snapshot
 */
export function hasRecoverableSnapshot(): boolean {
  return getRecoverySnapshot() !== null;
}

/**
 * Get human-readable time ago
 */
export function getSnapshotAge(snapshot: AutoRecoverySnapshot): string {
  const ageMs = Date.now() - snapshot.timestamp;
  const ageSec = Math.floor(ageMs / 1000);
  const ageMin = Math.floor(ageSec / 60);
  
  if (ageMin < 1) return 'just now';
  if (ageMin === 1) return '1 minute ago';
  if (ageMin < 60) return `${ageMin} minutes ago`;
  
  const ageHour = Math.floor(ageMin / 60);
  if (ageHour === 1) return '1 hour ago';
  return `${ageHour} hours ago`;
}