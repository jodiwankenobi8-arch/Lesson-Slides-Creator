import { useState, useEffect, useCallback } from 'react';

interface TimerWidgetProps {
  durationSeconds: number;
  autoStart?: boolean;
  onComplete?: () => void;
}

export function TimerWidget({ durationSeconds, autoStart = false, onComplete }: TimerWidgetProps) {
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    setTimeLeft(durationSeconds);
    setIsComplete(false);
  }, [durationSeconds]);

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          setIsComplete(true);
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, onComplete]);

  const handleStart = useCallback(() => {
    setIsRunning(true);
  }, []);

  const handlePause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const handleReset = useCallback(() => {
    setTimeLeft(durationSeconds);
    setIsRunning(false);
    setIsComplete(false);
  }, [durationSeconds]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="timer-widget">
      <div className={`timer-display ${isComplete ? 'complete' : ''} ${isRunning ? 'running' : ''}`}>
        <div className="timer-value text-6xl font-bold">
          {formatTime(timeLeft)}
        </div>
      </div>
      
      <div className="timer-controls flex gap-4 mt-4 justify-center">
        {!isRunning && !isComplete && (
          <button
            onClick={handleStart}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Start
          </button>
        )}
        
        {isRunning && (
          <button
            onClick={handlePause}
            className="px-6 py-3 text-white rounded-lg"
            style={{ backgroundColor: 'var(--ao-tan)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--ao-text)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--ao-tan)'}
          >
            Pause
          </button>
        )}
        
        <button
          onClick={handleReset}
          className="px-6 py-3 text-white rounded-lg"
          style={{ backgroundColor: 'var(--ao-tan)' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--ao-text)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--ao-tan)'}
        >
          Reset
        </button>
      </div>
      
      {isComplete && (
        <div className="timer-complete-message text-2xl font-bold text-green-600 mt-4">
          Time's up! ✨
        </div>
      )}
    </div>
  );
}