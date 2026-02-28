/**
 * Initialize cleanup on app start
 * Call this once when the app loads
 */
export function initializeCleanup() {
  // DISABLED: This calls make-server endpoint which causes 401 errors in browser
  // Background cleanup is not critical for app functionality
  // Re-enable only if needed and with proper auth
  console.log('🧹 Opportunistic cleanup disabled (not critical for app load)');
  return;
  
  // Run in background after 5 seconds (don't block app load)
  // setTimeout(() => {
  //   runOpportunisticCleanup();
  // }, 5000);
}