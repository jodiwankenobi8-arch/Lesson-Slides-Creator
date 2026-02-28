/**
 * Production-safe logging utility
 * 
 * In production: Only errors and critical warnings
 * In development: Full debug logging
 */

const IS_DEV = import.meta.env.DEV || import.meta.env.MODE === 'development';

export const logger = {
  /**
   * Debug logs - Only in development
   */
  debug: (...args: any[]) => {
    if (IS_DEV) {
      console.log(...args);
    }
  },

  /**
   * Info logs - Only in development
   */
  info: (...args: any[]) => {
    if (IS_DEV) {
      console.log(...args);
    }
  },

  /**
   * Warning logs - Always logged
   */
  warn: (...args: any[]) => {
    console.warn(...args);
  },

  /**
   * Error logs - Always logged
   */
  error: (...args: any[]) => {
    console.error(...args);
  },

  /**
   * Success logs - Only in development
   */
  success: (...args: any[]) => {
    if (IS_DEV) {
      console.log(...args);
    }
  },
};
