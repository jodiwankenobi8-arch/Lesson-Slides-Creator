import { useEffect, useState } from 'react';

interface TimerProps {
  minutes: number;
  seconds: number;
  running: boolean;
  onToggle: () => void;
}

export function Timer({ minutes, seconds, running, onToggle }: TimerProps) {
  const totalSeconds = minutes * 60 + seconds;
  const initialSeconds = totalSeconds;
  const progress = initialSeconds > 0 ? (totalSeconds / initialSeconds) * 360 : 0;

  return (
    <div 
      className="flex items-center justify-center cursor-pointer relative"
      onClick={onToggle}
      style={{ width: '80px', height: '80px' }}
    >
      {/* Circular Progress Ring */}
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 80 80">
        {/* Background circle */}
        <circle
          cx="40"
          cy="40"
          r="35"
          fill="none"
          stroke="#E5E7EB"
          strokeWidth="6"
        />
        {/* Progress circle */}
        <circle
          cx="40"
          cy="40"
          r="35"
          fill="none"
          stroke="#6FA8DC"
          strokeWidth="6"
          strokeDasharray={`${progress * (2 * Math.PI * 35) / 360} ${2 * Math.PI * 35}`}
          strokeLinecap="round"
          className={running ? 'animate-pulse' : ''}
        />
      </svg>
      
      {/* Timer Text */}
      <div className="relative z-10 flex flex-col items-center">
        <span className="font-['Nunito',sans-serif] font-bold text-[#2F3E46] text-lg">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
      </div>
    </div>
  );
}
