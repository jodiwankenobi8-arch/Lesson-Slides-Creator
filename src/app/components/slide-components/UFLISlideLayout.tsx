import { ReactNode } from 'react';
import { Timer } from './Timer';

interface UFLISlideLayoutProps {
  children: ReactNode;
  timerProps?: {
    minutes: number;
    seconds: number;
    running: boolean;
    onToggle: () => void;
  } | null;
}

export function UFLISlideLayout({ children, timerProps }: UFLISlideLayoutProps) {
  return (
    <div className="relative w-full h-full bg-[#F4E9DA] overflow-hidden">
      {/* Timer in top-right corner */}
      {timerProps && (
        <div className="absolute top-6 right-6 z-20">
          <Timer {...timerProps} />
        </div>
      )}
      
      {/* Content Area - 80% of screen */}
      <div className="w-[80%] h-[80%] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
