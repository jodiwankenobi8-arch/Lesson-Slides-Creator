/**
 * Keyboard Shortcuts Help Panel
 * 
 * Shows available keyboard shortcuts during lesson playback.
 * Press '?' to toggle.
 */

import { motion, AnimatePresence } from 'motion/react';
import { Keyboard, X } from 'lucide-react';
import { Button } from './ui/button';
import { getKeyboardShortcutHelp } from '../hooks/useKeyboardShortcuts';

interface KeyboardShortcutsHelpProps {
  isVisible: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsHelp({ isVisible, onClose }: KeyboardShortcutsHelpProps) {
  const shortcuts = getKeyboardShortcutHelp();
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9998] bg-black/50 flex items-center justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full mx-4"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Keyboard className="size-5 text-gray-700" />
                <h2 className="text-xl font-semibold text-gray-900">Keyboard Shortcuts</h2>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="size-4" />
              </Button>
            </div>
            
            <div className="space-y-2">
              {shortcuts.map((shortcut, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <span className="text-gray-700">{shortcut.description}</span>
                  <kbd className="px-3 py-1 bg-gray-100 border border-gray-300 rounded text-sm font-mono text-gray-800 shadow-sm">
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
            </div>
            
            <div className="mt-6 text-center text-sm text-gray-500">
              Press <kbd className="px-2 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono">?</kbd> to toggle this help
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
