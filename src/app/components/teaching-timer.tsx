/**
 * Teaching Timer Component
 * 
 * On-screen timer for classroom activities.
 * Press 'T' to show/hide during lessons.
 * 
 * FEATURES:
 * - Countdown timer (default 5 minutes)
 * - Quick presets (1, 3, 5, 10 min)
 * - Play/pause
 * - Reset
 * - Audio alert when time's up
 * - Draggable position
 * - Compact UI that doesn't block content
 */

import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Play, Pause, RotateCcw, X } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from './ui/utils';

interface TeachingTimerProps {
  isVisible: boolean;
  onClose: () => void;
}

export function TeachingTimer({ isVisible, onClose }: TeachingTimerProps) {
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes default
  const [isRunning, setIsRunning] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Pause timer when tab is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageVisible(!document.hidden);
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);
  
  // Timer logic - pauses when tab hidden
  useEffect(() => {
    if (!isRunning || timeLeft <= 0 || !isPageVisible) return;
    
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          setIsRunning(false);
          setHasCompleted(true);
          // Play sound
          audioRef.current?.play().catch(() => {
            // Audio might be blocked, that's okay
          });
        }
        return Math.max(0, next);
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, isPageVisible]);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const setPreset = (minutes: number) => {
    setTimeLeft(minutes * 60);
    setIsRunning(false);
    setHasCompleted(false);
  };
  
  const togglePlay = () => {
    if (hasCompleted) {
      setHasCompleted(false);
    }
    setIsRunning(!isRunning);
  };
  
  const reset = () => {
    setTimeLeft(300);
    setIsRunning(false);
    setHasCompleted(false);
  };
  
  if (!isVisible) return null;
  
  return (
    <>
      {/* Audio element for completion sound */}
      <audio ref={audioRef} preload="auto">
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuFzvLZiTYIG2m98OScTgwOUKXh77RgGwU7k9n0y3krBSh+zPLaizsKE16y6OqnUxELSKDh8r1rHwUshs/z2Yk1Bxpqvu7mnUwPDlGl4e+zXxsGPJXb9s16KgUngMzy2Ys5CRNfsuvsqFQRC0me4fO+bCEGK4bP8dmJNQgaaL3t45xMDw5Ro9/us2AbBT2W3PbNeioFKIDO8tiLOAgTX7Hn76hUEgtJnuLxv2wiByyHz/PYijQHGmi97OScSwwNT6Le7bFeGgY+ld32y3orBSiAzvLZijgIE1+x6O+oVBIKSZ7i8r9tIgcsh8/z2Io0Bxpnvex" type="audio/wav" />
      </audio>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        drag
        dragMomentum={false}
        className="fixed top-20 right-6 z-50 bg-white rounded-lg shadow-2xl border border-gray-200 p-4 min-w-[280px]"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm text-gray-700">Timer</h3>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="h-6 w-6 p-0 hover:bg-gray-100"
          >
            <X className="size-4" />
          </Button>
        </div>
        
        {/* Time display */}
        <div 
          className={cn(
            "text-6xl font-bold tabular-nums",
            timeLeft <= 10 && isRunning ? "" : ""
          )}
          style={timeLeft <= 10 && isRunning ? { color: 'var(--ao-red)' } : {}}
        >
          {formatTime(timeLeft)}
        </div>
        
        {/* Controls */}
        <div className="flex gap-2 mb-3">
          <Button
            size="sm"
            onClick={togglePlay}
            className="flex-1"
            variant={isRunning ? "secondary" : "default"}
          >
            {isRunning ? <Pause className="size-4 mr-1" /> : <Play className="size-4 mr-1" />}
            {isRunning ? 'Pause' : 'Start'}
          </Button>
          <Button
            size="sm"
            onClick={reset}
            variant="outline"
          >
            <RotateCcw className="size-4" />
          </Button>
        </div>
        
        {/* Presets */}
        <div className="grid grid-cols-4 gap-2">
          {[1, 3, 5, 10].map((mins) => (
            <Button
              key={mins}
              size="sm"
              variant="outline"
              onClick={() => setPreset(mins)}
              className="text-xs"
            >
              {mins}m
            </Button>
          ))}
        </div>
        
        {hasCompleted && (
          <div className="mt-3 text-center text-sm font-semibold text-red-600">
            Time's Up! 🔔
          </div>
        )}
        
        <div className="mt-3 text-xs text-gray-500 text-center">
          Press T to hide • Drag to move
        </div>
      </motion.div>
    </>
  );
}