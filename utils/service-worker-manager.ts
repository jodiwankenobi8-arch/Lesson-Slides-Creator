/**
 * Service Worker Manager
 * 
 * Registers and manages the service worker for offline mode.
 * ONLY registers in production if the file exists and returns JavaScript.
 */

import { logger } from './logger';

/**
 * Register service worker for offline support
 * Only runs in production AND only if service-worker.js exists and returns JS (not HTML)
 */
export async function registerServiceWorker(): Promise<boolean> {
  // Never register in dev / preview
  if (!import.meta.env.PROD) {
    logger.debug('ℹ️ Service Worker skipped (not production)');
    return false;
  }
  
  if (!('serviceWorker' in navigator)) {
    logger.warn('⚠️ Service Worker not supported in this browser');
    return false;
  }

  const url = '/service-worker.js';

  // Guard: if the server returns HTML (404 page), do not register
  try {
    const res = await fetch(url, { cache: 'no-store' });
    const ct = res.headers.get('content-type') || '';
    if (!res.ok) {
      logger.debug('ℹ️ Service Worker file not found - skipping registration');
      return false;
    }
    if (!ct.includes('javascript')) {
      logger.debug('ℹ️ Service Worker returned non-JavaScript MIME type - skipping registration');
      return false; // prevents text/html MIME error
    }
  } catch (error) {
    logger.debug('ℹ️ Could not verify Service Worker file - skipping registration');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.register(url, {
      scope: '/',
    });
    
    logger.info('✅ Service Worker registered:', registration.scope);
    
    // Listen for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;
      
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          logger.info('🔄 New Service Worker available - update pending');
        }
      });
    });
    
    return true;
  } catch (error) {
    logger.error('❌ Service Worker registration failed:', error);
    return false;
  }
}

/**
 * Unregister service worker (for debugging)
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false;
  }
  
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.unregister();
      logger.info('✅ Service Worker unregistered');
      return true;
    }
    return false;
  } catch (error) {
    logger.error('❌ Service Worker unregistration failed:', error);
    return false;
  }
}

/**
 * Check if service worker is active
 */
export async function isServiceWorkerActive(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false;
  }
  
  const registration = await navigator.serviceWorker.getRegistration();
  return !!registration?.active;
}

/**
 * Send message to service worker
 */
export function sendMessageToServiceWorker(message: any) {
  if (!navigator.serviceWorker.controller) {
    logger.warn('⚠️ No service worker controller available');
    return;
  }
  
  navigator.serviceWorker.controller.postMessage(message);
}

/**
 * Request service worker to cache specific URLs
 */
export function cacheUrls(urls: string[]) {
  sendMessageToServiceWorker({
    type: 'CACHE_URLS',
    urls,
  });
}