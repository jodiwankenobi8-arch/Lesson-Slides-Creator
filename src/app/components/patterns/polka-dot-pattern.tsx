/**
 * Polka Dot Pattern for Apple Orchard Planner
 * Used for: empty states, reward screens, subtle background panels
 */

export function PolkaDotPattern({ color = 'pink' }: { color?: 'pink' | 'blue' }) {
  const dotColor = color === 'pink' ? '#F7DDE2' : '#CFE3F5';
  
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }}>
      <defs>
        <pattern id={`polka-dot-${color}`} x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <circle cx="10" cy="10" r="3" fill={dotColor} opacity="0.4" />
          <circle cx="30" cy="30" r="3" fill={dotColor} opacity="0.4" />
        </pattern>
      </defs>
    </svg>
  );
}

export function PolkaDotPanel({ 
  color = 'pink', 
  children, 
  className = '' 
}: { 
  color?: 'pink' | 'blue'; 
  children: React.ReactNode;
  className?: string;
}) {
  const bgColor = color === 'pink' ? '#FFF6F8' : '#F8FBFF';
  
  return (
    <div className={`relative rounded-2xl p-8 ${className}`} style={{ backgroundColor: bgColor }}>
      <PolkaDotPattern color={color} />
      <div 
        className="absolute inset-0 rounded-2xl" 
        style={{ background: `url(#polka-dot-${color})` }}
      />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
