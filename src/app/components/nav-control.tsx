/**
 * Universal Back + Home Navigation
 * 
 * Provides Back and Home buttons on all pages.
 * 
 * PLACEMENT:
 * - Teach Mode: Minimal floating icons, auto-hide after 3s
 * - Build/Library/Editor: Top-left, always visible
 * 
 * BEHAVIOR:
 * - Back: Navigate back if history exists, else go Home
 * - Home: Navigate to main dashboard
 */

import { useNavigate, useLocation } from 'react-router';
import { ArrowLeft, Home } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from './ui/utils';

interface NavControlProps {
  mode?: 'teach' | 'normal';
  isVisible?: boolean; // For teach mode auto-hide
  className?: string;
}

export function NavControl({ mode = 'normal', isVisible = true, className }: NavControlProps) {
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };
  
  const handleHome = () => {
    navigate('/');
  };
  
  // Hide if on home page
  const isHomePage = location.pathname === '/';
  
  if (isHomePage) {
    return null;
  }
  
  // Teach mode: minimal floating icons
  if (mode === 'teach') {
    return (
      <div
        className={cn(
          'fixed bottom-24 left-6 flex gap-2 transition-opacity duration-300 z-40',
          isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none',
          className
        )}
      >
        <Button
          onClick={handleBack}
          size="sm"
          variant="secondary"
          className="h-10 w-10 p-0 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm border-0 text-white"
          aria-label="Go back"
        >
          <ArrowLeft className="size-5" />
        </Button>
        <Button
          onClick={handleHome}
          size="sm"
          variant="secondary"
          className="h-10 w-10 p-0 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm border-0 text-white"
          aria-label="Go to home"
        >
          <Home className="size-5" />
        </Button>
      </div>
    );
  }
  
  // Normal mode: top-left, always visible
  return (
    <div className={cn('flex gap-2', className)}>
      <Button
        onClick={handleBack}
        size="sm"
        variant="ghost"
        className="gap-1"
        aria-label="Go back"
      >
        <ArrowLeft className="size-4" />
        Back
      </Button>
      <Button
        onClick={handleHome}
        size="sm"
        variant="ghost"
        className="gap-1"
        aria-label="Go to home"
      >
        <Home className="size-4" />
        Home
      </Button>
    </div>
  );
}
