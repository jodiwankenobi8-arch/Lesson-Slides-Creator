/**
 * Cache Busting Identifier
 * 
 * Updated whenever we need to force a hard refresh across all clients.
 * This file is imported by App.tsx to ensure the build system picks up changes.
 */

export const CACHE_VERSION = '2026-02-28T16:45:00Z-apple-orchard-v1';
export const DESIGN_SYSTEM = 'apple-orchard-planner';
export const BUILD_NUMBER = 1001;

// Force module re-evaluation
if (typeof window !== 'undefined') {
  (window as any).__CACHE_VERSION = CACHE_VERSION;
  console.log('🍎 Apple Orchard Planner - Cache Version:', CACHE_VERSION);
}
