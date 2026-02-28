import { ReactNode } from 'react';

interface SlideLayoutProps {
  type?: 'welcome' | 'instruction' | 'video' | 'interactive' | 'placeholder' | 'review';
  title?: string;
  subtitle?: string;
  children: ReactNode;
  showWaves?: boolean;
}

export function SlideLayout({ 
  type = 'instruction', 
  title, 
  subtitle, 
  children,
  showWaves = false 
}: SlideLayoutProps) {
  return (
    <div className="relative w-full h-full bg-[#F4E9DA] overflow-hidden flex flex-col">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-12 relative z-10">
        {title && (
          <h1 
            className="font-['Poppins',sans-serif] font-medium text-[#2F3E46] text-center mb-2"
            style={{ fontSize: type === 'welcome' ? '72px' : '60px', lineHeight: '1.2' }}
          >
            {title}
          </h1>
        )}
        
        {subtitle && (
          <p 
            className="font-['Nunito',sans-serif] text-[#6FA8DC] text-center mb-8"
            style={{ fontSize: '36px', lineHeight: '1.2' }}
          >
            {subtitle}
          </p>
        )}
        
        <div className="w-full flex-1 flex items-center justify-center">
          {children}
        </div>
      </div>

      {/* Animated Waves - Only show on welcome type or when explicitly enabled */}
      {(type === 'welcome' || showWaves) && (
        <div className="absolute bottom-0 left-0 right-0 h-32 overflow-hidden">
          <svg 
            className="absolute bottom-0 w-full h-full" 
            viewBox="0 0 1528 128" 
            fill="none" 
            preserveAspectRatio="none"
          >
            {/* First wave layer */}
            <path
              d="M0,0 Q300,50 600,0 T1200,0 T1800,0 L1800,128 L0,128 Z"
              fill="#6FA8DC"
              opacity="0.3"
              className="animate-wave"
            />
            {/* Second wave layer */}
            <path
              d="M0,20 Q300,70 600,20 T1200,20 T1800,20 L1800,128 L0,128 Z"
              fill="#6FA8DC"
              opacity="0.2"
              className="animate-wave-slow"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
