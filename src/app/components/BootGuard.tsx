/**
 * BootGuard - Hard safety net for Make preview boot failures
 * Prevents infinite spinner (M2 issue) by showing error UI after timeout
 */

import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { AlertCircle, RefreshCw, Download, Bug } from 'lucide-react';

const BOOT_TIMEOUT_MS = 5000; // 5 seconds - if app doesn't render by then, something is wrong

interface BootGuardProps {
  children: React.ReactNode;
}

export function BootGuard({ children }: BootGuardProps) {
  const [bootFailed, setBootFailed] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<'checking' | 'ok' | 'failed'>('checking');
  const [lastError, setLastError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [childrenRendered, setChildrenRendered] = useState(false);

  useEffect(() => {
    console.log('🟡 BootGuard mounted - starting safety timer');
    setMounted(true);
    
    // Proof of life check - non-Supabase endpoint
    fetch('/favicon.ico', { method: 'HEAD' })
      .then(() => {
        console.log('✅ Network check passed');
        setNetworkStatus('ok');
      })
      .catch(() => {
        console.log('❌ Network check failed');
        setNetworkStatus('failed');
      });

    // Start boot timer
    const timer = setTimeout(() => {
      // Only fail if children haven't rendered
      if (!childrenRendered) {
        console.error('🔴 BOOT_TIMEOUT at', new Date().toISOString());
        console.error('🔴 App did not render within', BOOT_TIMEOUT_MS / 1000, 'seconds');
        console.error('🔴 This usually means RouterProvider or a route component crashed');
        setBootFailed(true);
      } else {
        console.log('✅ Boot timer expired but app already rendered - ignoring');
      }
    }, BOOT_TIMEOUT_MS);

    // Check for global errors
    const errorFromWindow = (window as any).__BOOT_LAST_ERROR;
    if (errorFromWindow) {
      console.error('🔴 Found global error:', errorFromWindow);
      setLastError(errorFromWindow);
    }

    // Always cleanup timer
    return () => {
      clearTimeout(timer);
    };
  }, [childrenRendered]);

  // Detect when children have rendered
  useEffect(() => {
    // Small delay to ensure children have actually painted
    const renderCheckTimer = setTimeout(() => {
      setChildrenRendered(true);
    }, 100);

    return () => clearTimeout(renderCheckTimer);
  }, []);

  if (bootFailed) {
    const debugInfo = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      networkStatus,
      lastError,
      href: window.location.href,
      bootTimeoutMs: BOOT_TIMEOUT_MS,
    };

    // Safe clipboard copy with fallback
    const copyDebugInfo = () => {
      const text = JSON.stringify(debugInfo, null, 2);
      
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
          .then(() => alert('Debug info copied to clipboard'))
          .catch((err) => {
            console.error('Clipboard API failed:', err);
            // Fallback: show in prompt
            prompt('Clipboard API blocked. Copy this manually:', text);
          });
      } else {
        // Fallback for environments without clipboard API
        prompt('Copy this debug info:', text);
      }
    };

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full border-red-300 bg-red-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertCircle className="w-8 h-8 text-red-600" />
              <CardTitle className="text-red-900">App Boot Timeout</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-700">
              The application did not render within {BOOT_TIMEOUT_MS / 1000} seconds.
            </p>
            
            <div className="border rounded-md p-3" style={{ backgroundColor: 'var(--ao-cream)', borderColor: 'var(--ao-tan)' }}>
              <p className="text-sm font-semibold" style={{ color: 'var(--ao-text)' }}>
                Likely causes:
              </p>
              <ul className="text-xs mt-2 space-y-1 list-disc list-inside" style={{ color: 'var(--ao-text)' }}>
                <li>RouterProvider crashed (check console for errors)</li>
                <li>Route component failed to load</li>
                <li>Suspense boundary waiting forever</li>
                <li>Network request blocking render</li>
              </ul>
            </div>

            <div className="bg-white border border-red-200 rounded-md p-3 space-y-2">
              <div className="text-xs font-mono">
                <div><strong>Network:</strong> {networkStatus}</div>
                <div><strong>Time:</strong> {debugInfo.timestamp}</div>
                <div><strong>URL:</strong> {window.location.pathname}</div>
                {lastError && (
                  <div className="mt-2 text-red-700">
                    <strong>Last Error:</strong>
                    <pre className="mt-1 whitespace-pre-wrap break-words">{lastError}</pre>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={() => window.location.reload()}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Preview
              </Button>

              <Button
                variant="outline"
                onClick={() => window.location.href = '/diagnostics'}
                className="gap-2"
              >
                <Bug className="w-4 h-4" />
                Open Diagnostics
              </Button>

              <Button
                variant="outline"
                onClick={copyDebugInfo}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Copy Debug Info
              </Button>
            </div>

            <details className="text-xs">
              <summary className="cursor-pointer text-gray-600 hover:text-gray-900">
                Full debug info (click to expand)
              </summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-48">
{JSON.stringify(debugInfo, null, 2)}
              </pre>
            </details>
            
            <div className="text-xs text-gray-600 mt-4 p-3 rounded" style={{ backgroundColor: 'var(--info-bg)', borderColor: 'var(--ao-sky)', border: '1px solid' }}>
              <strong>Check DevTools Console</strong> - Look for red errors or failed network requests.
              The actual error preventing boot should be visible there.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}