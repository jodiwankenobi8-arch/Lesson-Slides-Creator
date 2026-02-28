/**
 * Standardized Page Layout
 * 
 * Enforces consistent layout across ALL non-Teach pages:
 * - Dashboard, My Lessons, Diagnostics, Editor, etc.
 * 
 * Layout specs:
 * - Apple Orchard Planner: Warm cream background (#FFF6E9)
 * - Max width: 1200px
 * - Horizontal padding: 24px
 * - Vertical spacing: 24-32px
 * - Sticky header pattern with content padding
 * - Clean, predictable structure
 */

import { ReactNode } from 'react';
import { Toaster } from './ui/sonner';
import { NavControl } from './nav-control';
import { Z_INDEX } from '../utils/z-index-scale';

interface PageLayoutProps {
  children: ReactNode;
  maxWidth?: '4xl' | '6xl' | '7xl';
}

export function PageLayout({ children, maxWidth = '6xl' }: PageLayoutProps) {
  const maxWidthClass = {
    '4xl': 'max-w-4xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
  }[maxWidth];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFF6E9' }}>
      {/* Universal Navigation - Fixed, top-left */}
      <div className={`fixed top-4 left-4 ${Z_INDEX.NAV_CONTROL}`}>
        <NavControl />
      </div>

      {/* Main Content - with top padding to avoid nav overlap */}
      <div className={`container mx-auto px-6 py-8 pt-20 ${maxWidthClass}`}>
        {children}
      </div>

      {/* Toast Notifications */}
      <Toaster richColors position="top-right" />
    </div>
  );
}