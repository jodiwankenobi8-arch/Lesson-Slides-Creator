import { AnimatePresence, motion } from 'motion/react';
import { Z_INDEX } from '../utils/z-index-scale';

interface BlackoutOverlayProps {
  isActive: boolean;
  onDismiss: () => void;
}

/**
 * Blackout Overlay
 * Press B to activate/deactivate
 * Full-screen black overlay for refocusing attention
 */
export function BlackoutOverlay({ isActive, onDismiss }: BlackoutOverlayProps) {
  if (!isActive) return null;

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onDismiss}
          className={`fixed inset-0 ${Z_INDEX.BLACKOUT} bg-black cursor-pointer flex items-center justify-center`}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-white/30 text-lg"
          >
            Press B or click to resume
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}