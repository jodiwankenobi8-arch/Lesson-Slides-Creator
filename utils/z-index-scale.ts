/**
 * Standardized Z-Index Scale
 * 
 * Ensures proper layering of UI elements across the entire application
 * to prevent overlapping headers, tabs, buttons, and overlays.
 * 
 * USAGE:
 * import { Z_INDEX } from './utils/z-index-scale';
 * className={`fixed top-0 ${Z_INDEX.HEADER}`}
 */

export const Z_INDEX = {
  // Base layers (below everything)
  BASE: 'z-0',
  ABOVE_BASE: 'z-1',
  
  // Content layers
  CONTENT: 'z-10',         // Main content, slide thumbnails, cards
  CONTENT_ABOVE: 'z-20',   // Hover states, dropdowns within content
  
  // UI chrome layers
  STICKY_HEADER: 'z-30',   // Sticky page headers
  TABS: 'z-30',            // Tab navigation (same level as header)
  NAV_CONTROL: 'z-40',     // Universal navigation control
  
  // Overlays and modals
  DROPDOWN: 'z-50',        // Dropdowns, select menus, tooltips
  POPOVER: 'z-50',         // Popovers, context menus
  MODAL_OVERLAY: 'z-50',   // Dialog/sheet overlays
  MODAL_CONTENT: 'z-50',   // Dialog/sheet content
  
  // Special floating UI
  TEACH_MODE_CONTROLS: 'z-[60]',  // Teach mode navigation controls
  TOAST: 'z-[70]',                 // Toast notifications
  
  // Critical top-level overlays
  FULLSCREEN: 'z-[80]',            // Fullscreen mode
  BLACKOUT: 'z-[9998]',            // Blackout overlay
  RECOVERY_PROMPT: 'z-[9999]',     // Recovery/error prompts (highest)
} as const;

/**
 * Z-Index Layer Documentation:
 * 
 * 0-9: Base layers (backgrounds, decorative elements)
 * 10-29: Content and interactive elements
 * 30-39: Sticky UI chrome (headers, tabs, navigation)
 * 40-49: Floating navigation elements
 * 50-59: Standard overlays (modals, dropdowns)
 * 60-79: Special UI (teach mode, toasts)
 * 80-9997: Fullscreen and critical overlays
 * 9998+: Emergency/recovery UI
 * 
 * NEVER use arbitrary z-index values - always use this scale!
 */
