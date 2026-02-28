/**
 * Apple Icon for Apple Orchard Planner
 * Minimal line icon for decorative accents
 */

export function AppleIcon({ 
  className = '', 
  size = 24 
}: { 
  className?: string; 
  size?: number;
}) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={className}
    >
      {/* Leaf */}
      <path d="M12 3c1.5 0 2.5 1 2.5 2.5S13.5 8 12 8" />
      
      {/* Apple body */}
      <path d="M12 8c-3.5 0-6.5 2-6.5 6.5C5.5 18.5 8 21 12 21s6.5-2.5 6.5-6.5C18.5 10 15.5 8 12 8z" />
      
      {/* Indent at top */}
      <path d="M12 8c-1 0-1.5-.5-1.5-1.5S11 5 12 5s1.5.5 1.5 1.5S13 8 12 8z" />
    </svg>
  );
}

export function AppleDivider({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex-1 h-px bg-[#E5E5E5]" />
      <AppleIcon size={16} className="text-[#C84C4C] opacity-50" />
      <div className="flex-1 h-px bg-[#E5E5E5]" />
    </div>
  );
}

export function LeafCheckmark({ className = '' }: { className?: string }) {
  return (
    <svg 
      width="16" 
      height="16" 
      viewBox="0 0 16 16" 
      fill="none" 
      className={className}
    >
      <path 
        d="M2 8l4 4 8-8" 
        stroke="#6FA86B" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M13 3c.5.5.5 1.5 0 2s-1.5.5-2 0" 
        stroke="#6FA86B" 
        strokeWidth="1.5" 
        strokeLinecap="round"
      />
    </svg>
  );
}
