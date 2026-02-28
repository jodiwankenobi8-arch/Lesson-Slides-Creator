/**
 * Teach Mode Presentation
 * 
 * EFFORTLESS TEACHING MODE
 * Following principle: "If it isn't needed during teaching, it shouldn't be visible. Gone."
 * 
 * SHOWS ONLY:
 * - Slide content (full screen)
 * - Minimal control bar (fades when idle)
 * - Blackout overlay (press B)
 * - Timer (press T)
 * 
 * HIDDEN:
 * - Top navigation
 * - Settings
 * - Profile
 * - Status indicators (unless error)
 * - All build-mode tools
 */

import { useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight, X, Home, Grid3x3, Play, Pause, RotateCcw } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { SlideRenderer } from './slide-renderer';
import type { SlideData } from '../types/slide-types';
import { cn } from './ui/utils';
import { useKeyboardShortcuts } from '../hooks/use-keyboard-shortcuts';
import { SlideshowNavigation } from './slideshow-navigation';
import { logger } from '../utils/logger';
import { Z_INDEX } from '../utils/z-index-scale';

interface TeachModePresentationProps {
  slides: SlideData[];
  initialSlide?: number;
  onExit: () => void;
}

export function TeachModePresentation({
  slides,
  initialSlide = 0,
  onExit,
}: TeachModePresentationProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(initialSlide);
  const [showControls, setShowControls] = useState(true);
  const [isBlackout, setIsBlackout] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [idleTimeout, setIdleTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const totalSlides = slides.length;
  
  // Auto-hide controls after 3 seconds of inactivity
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      
      // Clear existing timeout
      if (idleTimeout) {
        clearTimeout(idleTimeout);
      }
      
      // Set new timeout to hide controls
      const timeout = setTimeout(() => {
        setShowControls(false);
      }, 3000);
      
      setIdleTimeout(timeout);
    };
    
    // Show controls immediately on load
    setShowControls(true);
    
    // Listen for mouse movement
    window.addEventListener('mousemove', handleMouseMove);
    
    // Initial hide timeout
    const timeout = setTimeout(() => {
      setShowControls(false);
    }, 3000);
    setIdleTimeout(timeout);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (idleTimeout) {
        clearTimeout(idleTimeout);
      }
    };
  }, [currentSlideIndex]); // Reset when slide changes
  
  // Keyboard shortcuts
  useKeyboardShortcuts({
    enabled: true,
    handlers: {
      onNextSlide: () => {
        if (currentSlideIndex < totalSlides - 1) {
          setCurrentSlideIndex(currentSlideIndex + 1);
        }
      },
      onPreviousSlide: () => {
        if (currentSlideIndex > 0) {
          setCurrentSlideIndex(currentSlideIndex - 1);
        }
      },
      onFirstSlide: () => setCurrentSlideIndex(0),
      onLastSlide: () => setCurrentSlideIndex(totalSlides - 1),
      onToggleBlackout: () => setIsBlackout(!isBlackout),
      onToggleTimer: () => setShowTimer(!showTimer),
      onToggleHelp: () => setShowHelp(!showHelp),
      onEscape: () => {
        // First press: close overlays
        if (isBlackout || showTimer || showHelp) {
          setIsBlackout(false);
          setShowTimer(false);
          setShowHelp(false);
        } else {
          // Second press: exit presentation
          onExit();
        }
      },
    },
  });
  
  const currentSlide = slides[currentSlideIndex];
  const direction = currentSlideIndex - initialSlide;
  
  return (
    <div className={`fixed inset-0 ${Z_INDEX.FULLSCREEN} bg-white`}>
      {/* Slide Content - Full Screen */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlideIndex}
            initial={{ opacity: 0, x: direction > 0 ? 100 : -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction > 0 ? -100 : 100 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full"
          >
            <SlideRenderer slide={currentSlide} />
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Bottom Control Bar - Auto-hide */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 ${Z_INDEX.TEACH_MODE_CONTROLS}`}
          >
            <div className="bg-gray-900/90 backdrop-blur-sm rounded-full px-4 py-3 flex items-center gap-3 shadow-2xl">
              {/* Previous */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => currentSlideIndex > 0 && setCurrentSlideIndex(currentSlideIndex - 1)}
                disabled={currentSlideIndex === 0}
                className="h-10 w-10 p-0 text-white hover:bg-white/20 disabled:opacity-30 rounded-full"
              >
                <ChevronLeft className="size-6" />
                <span className="sr-only">Previous Slide</span>
              </Button>
              
              {/* Slide Counter */}
              <div className="text-white font-medium text-sm min-w-[80px] text-center">
                {currentSlideIndex + 1} / {totalSlides}
              </div>
              
              {/* Next */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => currentSlideIndex < totalSlides - 1 && setCurrentSlideIndex(currentSlideIndex + 1)}
                disabled={currentSlideIndex === totalSlides - 1}
                className="h-10 w-10 p-0 text-white hover:bg-white/20 disabled:opacity-30 rounded-full"
              >
                <ChevronRight className="size-6" />
                <span className="sr-only">Next Slide</span>
              </Button>
              
              <div className="w-px h-6 bg-white/20 mx-1" />
              
              {/* Blackout (B) */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsBlackout(!isBlackout)}
                className={`h-10 px-3 text-white hover:bg-white/20 rounded-full text-sm font-medium ${
                  isBlackout ? 'bg-white/30' : ''
                }`}
                title="Blackout Screen (B)"
              >
                🔲
                <span className="sr-only">Blackout</span>
              </Button>
              
              {/* Timer (T) */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTimer(!showTimer)}
                className={`h-10 px-3 text-white hover:bg-white/20 rounded-full text-sm font-medium ${
                  showTimer ? 'bg-white/30' : ''
                }`}
                title="Timer (T)"
              >
                ⏱
                <span className="sr-only">Timer</span>
              </Button>
              
              <div className="w-px h-6 bg-white/20 mx-1" />
              
              {/* Exit (Esc) */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onExit}
                className="h-10 w-10 p-0 text-white hover:bg-red-500/50 rounded-full"
                title="Exit (Esc)"
              >
                <X className="size-5" />
                <span className="sr-only">Exit Presentation</span>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Keyboard Hint - Fades after 5s */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 4, duration: 1 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] text-white/50 text-sm"
          >
            Space: Next • B: Blackout • T: Timer • Esc: Exit
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Blackout Overlay */}
      <BlackoutOverlay
        isActive={isBlackout}
        onDismiss={() => setIsBlackout(false)}
      />
      
      {/* Teaching Timer */}
      <TeachingTimer
        isVisible={showTimer}
        onClose={() => setShowTimer(false)}
      />
      
      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp
        isVisible={showHelp}
        onClose={() => setShowHelp(false)}
      />
      
      {/* Back + Home Navigation - Auto-hides with controls */}
      <NavControl mode="teach" isVisible={showControls} />
    </div>
  );
}