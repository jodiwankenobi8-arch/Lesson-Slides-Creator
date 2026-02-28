/**
 * Red Gingham Pattern for Apple Orchard Planner
 * Used for: thin divider strips, card accents, section separators
 */

export function GinghamPattern() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }}>
      <defs>
        <pattern id="gingham-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <rect width="20" height="20" fill="#FFFFFF" />
          <rect width="10" height="10" fill="#F7DDE2" />
          <rect x="10" y="10" width="10" height="10" fill="#F7DDE2" />
          <rect width="10" height="10" fill="#C84C4C" opacity="0.15" />
          <rect x="10" y="10" width="10" height="10" fill="#C84C4C" opacity="0.15" />
          <rect x="10" width="10" height="10" fill="#FECDD3" />
          <rect y="10" width="10" height="10" fill="#FECDD3" />
        </pattern>
      </defs>
    </svg>
  );
}

export function GinghamDivider({ className = '' }: { className?: string }) {
  return (
    <div className={`relative h-2 ${className}`}>
      <GinghamPattern />
      <div 
        className="w-full h-full" 
        style={{ 
          background: 'url(#gingham-pattern)',
          borderRadius: '2px'
        }} 
      />
    </div>
  );
}

export function GinghamStrip({ className = '' }: { className?: string }) {
  return (
    <div className={`relative h-1 ${className}`}>
      <GinghamPattern />
      <div 
        className="w-full h-full" 
        style={{ background: 'url(#gingham-pattern)' }} 
      />
    </div>
  );
}
