/**
 * Diagnostics & Troubleshooting
 * 
 * REAL maintenance dashboard with ONLY working actions.
 * NO decorative panels. NO fake buttons.
 * 
 * Sections:
 * 1. Build/Environment
 * 2. Auth
 * 3. Storage/Recovery
 * 4. Service Worker/Offline
 * 5. Network
 * 6. Performance Quick Checks
 * 7. Export
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { PageLayout } from '../components/page-layout';
import { PageHeader } from '../components/page-header';
import { 
  CheckCircle, XCircle, AlertCircle, RefreshCw, Trash2, 
  Download, LogOut, WifiOff, Wifi, Activity, Copy, Settings
} from 'lucide-react';
import { supabase, signOut } from '../../utils/supabase-auth';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';

// Build timestamp - updated on each build
const BUILD_ID = '2026-02-28-cleanup';

export default function Diagnostics() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [latency, setLatency] = useState<number | null>(null);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [snapshotInfo, setSnapshotInfo] = useState<{ exists: boolean; timestamp?: string } | null>(null);
  const [renderCount, setRenderCount] = useState(0);

  // Check auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(reg => {
        setSwRegistration(reg || null);
      });
    }
  }, []);

  // Check snapshot
  useEffect(() => {
    const checkSnapshot = () => {
      const snapshot = localStorage.getItem('lessonSnapshot');
      if (snapshot) {
        try {
          const data = JSON.parse(snapshot);
          setSnapshotInfo({
            exists: true,
            timestamp: data.timestamp || 'Unknown'
          });
        } catch {
          setSnapshotInfo({ exists: true });
        }
      } else {
        setSnapshotInfo({ exists: false });
      }
    };
    checkSnapshot();
  }, []);

  // Performance: Count renders
  useEffect(() => {
    setRenderCount(prev => prev + 1);
  });

  // --- ACTIONS ---

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      setUser(null);
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  const handleRestoreSnapshot = () => {
    const snapshot = localStorage.getItem('lessonSnapshot');
    if (!snapshot) {
      toast.error('No snapshot found');
      return;
    }

    try {
      const data = JSON.parse(snapshot);
      if (data.lessonId && data.route) {
        navigate(data.route);
        toast.success('Snapshot restored');
      } else {
        toast.error('Invalid snapshot data');
      }
    } catch {
      toast.error('Failed to parse snapshot');
    }
  };

  const handleClearSnapshot = () => {
    localStorage.removeItem('lessonSnapshot');
    setSnapshotInfo({ exists: false });
    toast.success('Snapshot cleared');
  };

  const handleClearLocalData = () => {
    if (confirm('Clear all local app data? This cannot be undone.')) {
      localStorage.clear();
      sessionStorage.clear();
      toast.success('Local data cleared. Refresh the page.');
    }
  };

  const handleUnregisterSW = async () => {
    if (swRegistration) {
      try {
        await swRegistration.unregister();
        setSwRegistration(null);
        toast.success('Service Worker unregistered. Refresh to take effect.');
      } catch (error) {
        toast.error('Failed to unregister Service Worker');
      }
    }
  };

  const handleClearCaches = async () => {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        toast.success(`Cleared ${cacheNames.length} cache(s)`);
      } catch (error) {
        toast.error('Failed to clear caches');
      }
    } else {
      toast.error('Cache API not available');
    }
  };

  const handleLatencyTest = async () => {
    setLatency(null);
    const start = performance.now();
    try {
      await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-0d810c1e/health`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${publicAnonKey}` }
      });
      const end = performance.now();
      setLatency(Math.round(end - start));
      toast.success(`Latency: ${Math.round(end - start)}ms`);
    } catch (error) {
      toast.error('Network test failed');
    }
  };

  const handleCopyDiagnostics = async () => {
    const diagnostics = {
      buildId: BUILD_ID,
      route: window.location.pathname,
      browser: navigator.userAgent,
      online: isOnline,
      auth: user ? { id: user.id, email: user.email } : null,
      snapshot: snapshotInfo,
      serviceWorker: swRegistration ? 'registered' : 'not registered',
      timestamp: new Date().toISOString()
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(diagnostics, null, 2));
      toast.success('Diagnostics copied to clipboard');
    } catch {
      toast.error('Copy failed. Use Download instead.');
    }
  };

  const handleDownloadDiagnostics = () => {
    const diagnostics = {
      buildId: BUILD_ID,
      route: window.location.pathname,
      browser: navigator.userAgent,
      online: isOnline,
      auth: user ? { id: user.id, email: user.email } : null,
      snapshot: snapshotInfo,
      serviceWorker: swRegistration ? 'registered' : 'not registered',
      renderCount,
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(diagnostics, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diagnostics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Diagnostics downloaded');
  };

  // --- RENDER ---

  return (
    <PageLayout maxWidth="6xl">
      <PageHeader 
        title="System Diagnostics"
        description="Troubleshooting and maintenance tools"
      />

      <div className="space-y-6">
        {/* 1. Build/Environment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Build & Environment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Build ID:</span>
              <code className="bg-gray-100 px-2 py-1 rounded">{BUILD_ID}</code>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Route:</span>
              <code className="bg-gray-100 px-2 py-1 rounded">{window.location.pathname}</code>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Browser:</span>
              <span className="truncate max-w-md text-right">{navigator.userAgent}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mode:</span>
              <Badge variant={window.location.hostname.includes('figma.com') ? 'default' : 'secondary'}>
                {window.location.hostname.includes('figma.com') ? 'Preview' : 'Development'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* 2. Auth */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {user ? <CheckCircle className="w-5 h-5" style={{ color: '#6FA86B' }} /> : <XCircle className="w-5 h-5" style={{ color: '#C84C4C' }} />}
              Authentication
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {user ? (
              <>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant="default">Signed In</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">User ID:</span>
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs">{user.id}</code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span>{user.email}</span>
                  </div>
                </div>
                <Button onClick={handleSignOut} variant="outline" size="sm" className="w-full">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>Not signed in</AlertDescription>
                </Alert>
                <Button onClick={() => navigate('/auth')} size="sm" className="w-full">
                  Sign In
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* 3. Storage/Recovery */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Storage & Recovery
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Snapshot:</span>
                <Badge variant={snapshotInfo?.exists ? 'default' : 'secondary'}>
                  {snapshotInfo?.exists ? 'Exists' : 'None'}
                </Badge>
              </div>
              {snapshotInfo?.timestamp && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Timestamp:</span>
                  <span className="text-xs">{snapshotInfo.timestamp}</span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleRestoreSnapshot} 
                disabled={!snapshotInfo?.exists}
                variant="outline" 
                size="sm" 
                className="flex-1"
              >
                Restore Snapshot
              </Button>
              <Button 
                onClick={handleClearSnapshot} 
                disabled={!snapshotInfo?.exists}
                variant="outline" 
                size="sm" 
                className="flex-1"
              >
                Clear Snapshot
              </Button>
            </div>
            <Button 
              onClick={handleClearLocalData} 
              variant="destructive" 
              size="sm" 
              className="w-full"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All Local Data
            </Button>
          </CardContent>
        </Card>

        {/* 4. Service Worker/Offline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {swRegistration ? <CheckCircle className="w-5 h-5" style={{ color: '#6FA86B' }} /> : <XCircle className="w-5 h-5" style={{ color: '#999999' }} />}
              Service Worker & Offline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant={swRegistration ? 'default' : 'secondary'}>
                  {swRegistration ? 'Registered' : 'Not Registered'}
                </Badge>
              </div>
              {swRegistration && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Scope:</span>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">{swRegistration.scope}</code>
                  </div>
                  <Alert>
                    <AlertDescription className="text-xs">
                      Service Worker can cause stale builds in preview/dev. Consider unregistering if you experience refresh issues.
                    </AlertDescription>
                  </Alert>
                </>
              )}
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleUnregisterSW} 
                disabled={!swRegistration}
                variant="outline" 
                size="sm" 
                className="flex-1"
              >
                Unregister SW
              </Button>
              <Button 
                onClick={handleClearCaches} 
                variant="outline" 
                size="sm" 
                className="flex-1"
              >
                Clear Caches
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 5. Network */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isOnline ? <Wifi className="w-5 h-5" style={{ color: '#6FA86B' }} /> : <WifiOff className="w-5 h-5" style={{ color: '#C84C4C' }} />}
              Network
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant={isOnline ? 'default' : 'destructive'}>
                  {isOnline ? 'Online' : 'Offline'}
                </Badge>
              </div>
              {latency !== null && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Latency:</span>
                  <Badge variant={latency < 200 ? 'default' : latency < 500 ? 'secondary' : 'destructive'}>
                    {latency}ms
                  </Badge>
                </div>
              )}
            </div>
            <Button 
              onClick={handleLatencyTest} 
              variant="outline" 
              size="sm" 
              className="w-full"
              disabled={!isOnline}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Run Latency Test
            </Button>
          </CardContent>
        </Card>

        {/* 6. Performance Quick Checks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Render Count:</span>
                <Badge variant="secondary">{renderCount}</Badge>
              </div>
              <Alert>
                <AlertDescription className="text-xs">
                  Rapid render counts may indicate unnecessary re-renders. Check component optimization.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>

        {/* 7. Export */}
        <Card>
          <CardHeader>
            <CardTitle>Export Diagnostics</CardTitle>
            <CardDescription>Copy or download diagnostic information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button onClick={handleCopyDiagnostics} variant="outline" size="sm" className="w-full">
              <Copy className="w-4 h-4 mr-2" />
              Copy to Clipboard
            </Button>
            <Button onClick={handleDownloadDiagnostics} variant="outline" size="sm" className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Download JSON
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}