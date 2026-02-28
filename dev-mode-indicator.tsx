/**
 * Dev Mode Indicator
 * 
 * Shows a visible indicator when auto-login/dev mode is active.
 * Helps developers know they're in development mode.
 * 
 * ⚠️ FOR DEVELOPMENT ONLY
 */

import { isAutoLoginEnabled, disableAutoLogin } from '../../utils/dev-auto-login';
import { Button } from './ui/button';
import { Wrench, X } from 'lucide-react';
import { toast } from 'sonner';

export function DevModeIndicator() {
  const isDevMode = isAutoLoginEnabled();

  if (!isDevMode) {
    return null;
  }

  const handleDismiss = () => {
    disableAutoLogin();
    toast.info('Dev mode disabled. Refresh page to re-enable.');
    window.location.reload();
  };

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className="text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-3" style={{ backgroundColor: 'var(--ao-red)' }}>
        <div className="flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          <div className="text-sm">
            <div className="font-bold">DEV MODE</div>
            <div className="text-xs opacity-90">Auth disabled</div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="h-6 w-6 p-0"
          style={{ 
            color: 'white',
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.2)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Dismiss</span>
        </Button>
      </div>
    </div>
  );
}