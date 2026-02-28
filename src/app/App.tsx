import { Suspense, useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { initializeCleanup } from './utils/opportunistic-cleanup';
import { BootGuard } from './components/BootGuard';
import { registerServiceWorker } from './utils/service-worker-manager';
import { CACHE_VERSION, DESIGN_SYSTEM } from './cache-bust';

const BUILD_TIME = '2026-02-28T16:45:00Z-apple-orchard';

// Main application entry point
export default function App() {
  // Set up global error handlers (cleanup on unmount)
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      const errorMsg = `${event.message} at ${event.filename}:${event.lineno}:${event.colno}`;
      console.error('🔴 GLOBAL ERROR:', errorMsg);
      (window as any).__BOOT_LAST_ERROR = errorMsg;
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const errorMsg = `Unhandled promise rejection: ${event.reason}`;
      console.error('🔴 UNHANDLED REJECTION:', errorMsg);
      (window as any).__BOOT_LAST_ERROR = errorMsg;
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('error', handleGlobalError);
      window.addEventListener('unhandledrejection', handleUnhandledRejection);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('error', handleGlobalError);
        window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      }
    };
  }, []);
  
  // Initialize app features on mount
  useEffect(() => {
    // Track cleanup state
    let isMounted = true;
    
    // Register service worker for offline mode
    registerServiceWorker().then((registered) => {
      if (registered && isMounted) {
        // Service worker registered successfully
      }
    }).catch(() => {
      // Silently fail - service worker is optional
    });
    
    // Initialize cleanup
    initializeCleanup();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <BootGuard>
      <Suspense fallback={
        <div className="flex items-center justify-center h-screen">
          <div style={{ color: 'var(--ao-muted)' }}>Loading...</div>
        </div>
      }>
        <RouterProvider router={router} />
      </Suspense>
    </BootGuard>
  );
}