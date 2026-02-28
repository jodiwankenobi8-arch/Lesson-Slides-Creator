import { useEffect } from 'react';

/**
 * Global keyboard shortcuts for the application
 * 
 * Shortcuts:
 * - Ctrl/Cmd + S: Save lesson
 * - Ctrl/Cmd + P: Enter Teach Mode (present)
 * - Ctrl/Cmd + K: Quick search lessons
 * - Escape: Exit fullscreen/close modals
 * - Arrow Left/Right: Navigate slides in Teach Mode
 */

interface KeyboardShortcuts {
  onSave?: () => void;
  onPresent?: () => void;
  onSearch?: () => void;
  onEscape?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcuts) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      // Ctrl/Cmd + S: Save
      if (modKey && e.key === 's') {
        e.preventDefault();
        shortcuts.onSave?.();
        return;
      }

      // Ctrl/Cmd + P: Present/Teach Mode
      if (modKey && e.key === 'p') {
        e.preventDefault();
        shortcuts.onPresent?.();
        return;
      }

      // Ctrl/Cmd + K: Quick search
      if (modKey && e.key === 'k') {
        e.preventDefault();
        shortcuts.onSearch?.();
        return;
      }

      // Escape: Exit fullscreen or close modals
      if (e.key === 'Escape') {
        shortcuts.onEscape?.();
        return;
      }

      // Arrow keys for navigation (when not in input)
      const isInput = (e.target as HTMLElement).tagName === 'INPUT' ||
                      (e.target as HTMLElement).tagName === 'TEXTAREA';
      
      if (!isInput) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          shortcuts.onPrevious?.();
          return;
        }

        if (e.key === 'ArrowRight') {
          e.preventDefault();
          shortcuts.onNext?.();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}
