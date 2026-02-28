/**
 * Keyboard Shortcuts Hook
 * 
 * Global keyboard shortcuts for teaching mode.
 * Designed for live classroom use - reliable and predictable.
 * 
 * SHORTCUTS:
 * - Space: Next slide
 * - Shift+Space: Previous slide
 * - B: Blackout screen (toggle)
 * - T: Timer (toggle)
 * - ?: Show keyboard shortcuts help
 * - Escape: Exit fullscreen/close overlays
 * - Arrow Right: Next slide
 * - Arrow Left: Previous slide
 * - Home: First slide
 * - End: Last slide
 * 
 * FEATURES:
 * - Only active during lesson playback
 * - Disabled when typing in inputs
 * - Visual feedback for actions
 * - Prevents accidental triggers
 */

import { useEffect, useCallback } from 'react';

export interface KeyboardShortcutHandlers {
  onNextSlide?: () => void;
  onPreviousSlide?: () => void;
  onFirstSlide?: () => void;
  onLastSlide?: () => void;
  onToggleBlackout?: () => void;
  onToggleTimer?: () => void;
  onToggleHelp?: () => void;
  onEscape?: () => void;
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  handlers: KeyboardShortcutHandlers;
}

/**
 * Global keyboard shortcuts hook
 * 
 * Usage:
 * ```typescript
 * useKeyboardShortcuts({
 *   enabled: isPlaying,
 *   handlers: {
 *     onNextSlide: () => goToSlide(currentSlide + 1),
 *     onPreviousSlide: () => goToSlide(currentSlide - 1),
 *     onToggleBlackout: () => setBlackout(!blackout),
 *     onToggleTimer: () => setShowTimer(!showTimer),
 *   }
 * });
 * ```
 */
export function useKeyboardShortcuts({
  enabled = true,
  handlers,
}: UseKeyboardShortcutsOptions) {
  
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts if disabled
    if (!enabled) return;
    
    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement;
    const isInput = target.tagName === 'INPUT' || 
                    target.tagName === 'TEXTAREA' || 
                    target.contentEditable === 'true';
    
    if (isInput) return;
    
    // Handle shortcuts
    switch (event.key) {
      case ' ':
        // Space: Next slide (unless Shift is held)
        event.preventDefault();
        if (event.shiftKey) {
          handlers.onPreviousSlide?.();
        } else {
          handlers.onNextSlide?.();
        }
        break;
        
      case 'ArrowRight':
        // Right arrow: Next slide
        event.preventDefault();
        handlers.onNextSlide?.();
        break;
        
      case 'ArrowLeft':
        // Left arrow: Previous slide
        event.preventDefault();
        handlers.onPreviousSlide?.();
        break;
        
      case 'Home':
        // Home: First slide
        event.preventDefault();
        handlers.onFirstSlide?.();
        break;
        
      case 'End':
        // End: Last slide
        event.preventDefault();
        handlers.onLastSlide?.();
        break;
        
      case 'b':
      case 'B':
        // B: Toggle blackout
        event.preventDefault();
        handlers.onToggleBlackout?.();
        break;
        
      case 't':
      case 'T':
        // T: Toggle timer
        event.preventDefault();
        handlers.onToggleTimer?.();
        break;
        
      case '?':
        // ?: Show keyboard shortcuts help
        event.preventDefault();
        handlers.onToggleHelp?.();
        break;
        
      case 'Escape':
        // Escape: Close overlays / exit fullscreen
        event.preventDefault();
        handlers.onEscape?.();
        break;
        
      default:
        // Ignore other keys
        break;
    }
  }, [enabled, handlers]);
  
  useEffect(() => {
    if (!enabled) return;
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);
}

/**
 * Get keyboard shortcut help text
 * Returns formatted list of shortcuts for display
 */
export function getKeyboardShortcutHelp(): Array<{ key: string; description: string }> {
  return [
    { key: 'Space', description: 'Next slide' },
    { key: 'Shift + Space', description: 'Previous slide' },
    { key: '→', description: 'Next slide' },
    { key: '←', description: 'Previous slide' },
    { key: 'Home', description: 'First slide' },
    { key: 'End', description: 'Last slide' },
    { key: 'B', description: 'Toggle blackout' },
    { key: 'T', description: 'Toggle timer' },
    { key: '?', description: 'Show keyboard shortcuts help' },
    { key: 'Esc', description: 'Close overlays' },
  ];
}