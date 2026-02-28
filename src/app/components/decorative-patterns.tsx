/**
 * Apple Orchard Planner - Decorative Patterns
 * 
 * Charming farmhouse-inspired accent patterns:
 * - Gingham: thin divider strips, card accents, section separators
 * - Polka Dots: soft background panels for empty states
 * 
 * Design Principle: Use sparingly. Never behind dense text.
 */

import { ReactNode } from 'react';

/**
 * Gingham Divider
 * Thin accent strip with classic gingham pattern
 */
export function GinghamDivider({ className = '' }: { className?: string }) {
  return (
    <div 
      className={`h-1 w-full ${className}`}
      style={{
        backgroundImage: `
          repeating-linear-gradient(
            90deg,
            #C84C4C 0px,
            #C84C4C 4px,
            #FFFFFF 4px,
            #FFFFFF 8px
          )
        `,
        opacity: 0.2,
      }}
      aria-hidden="true"
    />
  );
}

/**
 * Gingham Accent Bar
 * Subtle top accent for cards
 */
export function GinghamAccent() {
  return (
    <div 
      className="h-1 w-full rounded-t-2xl"
      style={{
        backgroundImage: `
          repeating-linear-gradient(
            90deg,
            #C84C4C 0px,
            #C84C4C 6px,
            #FFFFFF 6px,
            #FFFFFF 12px
          )
        `,
        opacity: 0.25,
      }}
      aria-hidden="true"
    />
  );
}

/**
 * Polka Dot Panel
 * Soft background for empty states and success panels
 * 
 * @param variant - 'pink' or 'blue' 
 * @param children - Content to display over polka dots
 */
interface PolkaDotPanelProps {
  variant?: 'pink' | 'blue';
  children: ReactNode;
  className?: string;
}

export function PolkaDotPanel({ 
  variant = 'pink', 
  children,
  className = ''
}: PolkaDotPanelProps) {
  const bgColor = variant === 'pink' ? '#F7DDE2' : '#CFE3F5';
  const dotColor = variant === 'pink' ? '#FFFFFF' : '#FFFFFF';
  
  return (
    <div 
      className={`relative rounded-2xl p-8 ${className}`}
      style={{
        backgroundColor: bgColor,
        backgroundImage: `
          radial-gradient(
            circle,
            ${dotColor} 1px,
            transparent 1px
          )
        `,
        backgroundSize: '20px 20px',
        backgroundPosition: '0 0, 10px 10px',
      }}
    >
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

/**
 * Apple Icon (Minimal Line Illustration)
 * Small decorative accent for headings and dividers
 */
export function AppleIcon({ className = '', size = 24 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Leaf */}
      <path
        d="M12 3C13 3 14 4 14 5"
        stroke="#6FA86B"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      
      {/* Apple body */}
      <path
        d="M12 6C8.5 6 6 8.5 6 12C6 15.5 7 18 9 19.5C10 20.5 11 21 12 21C13 21 14 20.5 15 19.5C17 18 18 15.5 18 12C18 8.5 15.5 6 12 6Z"
        stroke="#C84C4C"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Highlight */}
      <path
        d="M9 10C9.5 9.5 10 9 11 9"
        stroke="#C84C4C"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}

/**
 * Leaf Checkmark Icon
 * Success indicator with leaf shape
 */
export function LeafCheckIcon({ className = '', size = 20 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Leaf shape */}
      <path
        d="M4 10C4 6 6 4 10 4C14 4 16 6 16 10C16 14 14 16 10 16C6 16 4 14 4 10Z"
        fill="#6FA86B"
      />
      
      {/* Check mark */}
      <path
        d="M7 10L9 12L13 8"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Apple Bullet Point
 * Tiny apple for list items
 */
export function AppleBullet() {
  return (
    <span className="inline-flex items-center justify-center mr-2">
      <AppleIcon size={12} />
    </span>
  );
}

/**
 * Divider with Apple Icon
 * Centered apple icon in divider line
 */
export function AppleDivider({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-4 my-6 ${className}`}>
      <div className="flex-1 h-px" style={{ backgroundColor: '#E5E5E5' }} />
      <AppleIcon size={20} />
      <div className="flex-1 h-px" style={{ backgroundColor: '#E5E5E5' }} />
    </div>
  );
}
