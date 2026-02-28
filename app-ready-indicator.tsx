/**
 * App Ready Indicator
 * 
 * Shows a subtle visual confirmation that the app has loaded successfully.
 * Auto-fades after 3 seconds. Provides teacher reassurance without clutter.
 * 
 * Design: Small badge in top-right, green checkmark, fades smoothly
 */

import { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { cn } from './ui/utils';

export function AppReadyIndicator() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-hide after 3 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-50',
        'flex items-center gap-2 px-4 py-2 rounded-lg',
        'bg-green-500/90 text-white shadow-lg',
        'transition-all duration-500 ease-out',
        'pointer-events-none',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      )}
      aria-live="polite"
      aria-atomic="true"
    >
      <CheckCircle2 className="size-5" />
      <span className="text-sm font-medium">App Ready</span>
    </div>
  );
}
