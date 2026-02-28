/**
 * Global Debug Configuration
 * Centralized debug flag to prevent ReferenceError
 * 
 * Enable debug mode with: VITE_DEBUG=true
 * Or automatically enabled in dev mode
 * 
 * SAFETY: Never throws - always returns a boolean
 */
export const DEBUG = (() => {
  try {
    return (
      typeof import.meta !== "undefined" &&
      typeof import.meta.env !== "undefined" &&
      (import.meta.env.VITE_DEBUG === "true" || import.meta.env.DEV === true)
    );
  } catch (err) {
    console.warn('⚠️ DEBUG config failed to initialize:', err);
    return false; // Safe fallback
  }
})();