/**
 * Network Status Indicator
 * 
 * Displays current network connectivity status.
 * Critical for classroom environment where school Wi-Fi can be unreliable.
 * 
 * States:
 * 🟢 Online - Normal operation
 * 🟡 Slow - Connection detected but slow
 * 🔴 Offline - No connection (local mode)
 * 
 * Only shows when status changes or when offline/slow.
 */

import { useEffect, useState } from 'react';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { cn } from './ui/utils';

type NetworkStatus = 'online' | 'slow' | 'offline';

export function NetworkStatusIndicator() {
  const [status, setStatus] = useState<NetworkStatus>('online');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Initial check
    const updateStatus = () => {
      const isOnline = navigator.onLine;
      
      if (!isOnline) {
        setStatus('offline');
        setIsVisible(true);
      } else {
        // Check connection quality
        checkConnectionSpeed();
      }
    };

    const checkConnectionSpeed = async () => {
      try {
        const start = Date.now();
        // Ping a small resource to test speed
        await fetch('/favicon.svg', { 
          method: 'HEAD',
          cache: 'no-cache'
        });
        const duration = Date.now() - start;

        if (duration > 2000) {
          setStatus('slow');
          setIsVisible(true);
        } else {
          setStatus('online');
          // Hide indicator when back to normal
          setIsVisible(false);
        }
      } catch (error) {
        setStatus('offline');
        setIsVisible(true);
      }
    };

    // Listen for online/offline events
    const handleOnline = () => {
      setStatus('online');
      setIsVisible(true);
      // Auto-hide "back online" message after 3 seconds
      setTimeout(() => setIsVisible(false), 3000);
    };

    const handleOffline = () => {
      setStatus('offline');
      setIsVisible(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    updateStatus();

    // Remove periodic polling - only check on browser events

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Don't render if status is online and not visible
  if (!isVisible && status === 'online') {
    return null;
  }

  const config = {
    online: {
      icon: Wifi,
      color: 'bg-green-500/90',
      text: 'Back Online',
    },
    slow: {
      icon: AlertCircle,
      color: '',
      text: 'Slow Connection',
    },
    offline: {
      icon: WifiOff,
      color: 'bg-red-500/90',
      text: 'Offline Mode',
    },
  };

  const { icon: Icon, color, text } = config[status];

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50',
        'flex items-center gap-2 px-4 py-2 rounded-lg',
        'text-white shadow-lg',
        'transition-all duration-300',
        color
      )}
      style={status === 'slow' ? { backgroundColor: 'var(--ao-tan)', color: 'var(--ao-text)' } : {}}
      role="status"
      aria-live="polite"
    >
      <Icon className="size-4" />
      <span className="text-sm font-medium">{text}</span>
      {status === 'offline' && (
        <span className="text-xs opacity-90">(Data saved locally)</span>
      )}
    </div>
  );
}