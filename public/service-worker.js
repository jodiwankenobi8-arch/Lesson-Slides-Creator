/**
 * Service Worker - True Offline Mode
 * 
 * Caches critical assets for offline functionality.
 * Works fully offline for teaching after initial load.
 * 
 * CACHED ASSETS:
 * - App shell (HTML, CSS, JS)
 * - Fonts
 * - UI assets
 * - Slide components
 * 
 * STRATEGY:
 * - Cache-first for static assets
 * - Network-first for API calls
 * - Offline fallback for images
 */

const CACHE_VERSION = 'v1-2026-02-28';
const CACHE_NAME = `lesson-builder-${CACHE_VERSION}`;

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/src/app/App.tsx',
  '/src/styles/theme.css',
  '/src/styles/fonts.css',
];

// Install event - precache critical assets
self.addEventListener('install', (event) => {
  console.log('📦 Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('📦 Service Worker: Precaching assets');
      return cache.addAll(PRECACHE_ASSETS).catch((error) => {
        // Don't fail install if some assets can't be cached
        console.warn('⚠️ Some assets failed to precache:', error);
      });
    }).then(() => {
      console.log('✅ Service Worker: Installed');
      // Force activation immediately
      return self.skipWaiting();
    })
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('🔄 Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker: Activated');
      // Take control of all pages immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip cross-origin requests (like Supabase)
  if (url.origin !== location.origin) {
    return;
  }
  
  // Skip API calls (let them fail naturally when offline)
  if (url.pathname.includes('/api/') || url.pathname.includes('/functions/')) {
    return;
  }
  
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      // Return cached response if available (no logging)
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // Otherwise fetch from network and cache
      return fetch(request).then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200) {
          return response;
        }
        
        // Clone the response (can only use once)
        const responseToCache = response.clone();
        
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });
        
        return response;
      }).catch((error) => {
        // Only log actual errors
        console.error('❌ Service Worker: Fetch failed:', url.pathname);
        
        // Return offline fallback for HTML pages
        if (request.headers.get('accept').includes('text/html')) {
          return caches.match('/index.html');
        }
        
        // Return offline fallback for images
        if (request.headers.get('accept').includes('image')) {
          return new Response(
            '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect fill="#f0f0f0" width="200" height="200"/><text x="50%" y="50%" text-anchor="middle" fill="#999">Offline</text></svg>',
            { headers: { 'Content-Type': 'image/svg+xml' } }
          );
        }
        
        throw error;
      });
    })
  );
});

// Message event - handle commands from app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('🔄 Service Worker: Skip waiting requested');
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    console.log('📦 Service Worker: Caching URLs on demand');
    const urls = event.data.urls || [];
    
    caches.open(CACHE_NAME).then((cache) => {
      urls.forEach((url) => {
        cache.add(url).catch((error) => {
          console.warn('⚠️ Failed to cache URL:', url, error);
        });
      });
    });
  }
});

console.log('✅ Service Worker: Script loaded');