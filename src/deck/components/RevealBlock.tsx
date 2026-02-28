import { useState, ReactNode } from 'react';

interface RevealBlockProps {
  children: ReactNode;
  mode?: 'click' | 'one-by-one' | 'all-at-once';
  items?: string[];
  revealLabel?: string;
}

export function RevealBlock({ 
  children, 
  mode = 'click', 
  items = [], 
  revealLabel = 'Show Answer' 
}: RevealBlockProps) {
  const [revealed, setRevealed] = useState(false);
  const [revealedIndices, setRevealedIndices] = useState<number[]>([]);

  const handleRevealAll = () => {
    setRevealed(true);
  };

  const handleRevealNext = () => {
    if (revealedIndices.length < items.length) {
      setRevealedIndices([...revealedIndices, revealedIndices.length]);
    }
  };

  const handleReset = () => {
    setRevealed(false);
    setRevealedIndices([]);
  };

  // Simple click reveal
  if (mode === 'click') {
    return (
      <div className="reveal-block">
        {!revealed ? (
          <button
            onClick={handleRevealAll}
            className="px-8 py-4 text-white text-xl rounded-lg"
            style={{ backgroundColor: 'var(--ao-navy)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--ao-text)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--ao-navy)'}
          >
            Click to Reveal
          </button>
        ) : (
          <div className="revealed-content">
            {children}
            <button
              onClick={handleReset}
              className="mt-4 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
            >
              Hide
            </button>
          </div>
        )}
      </div>
    );
  }

  // Reveal items one by one
  if (mode === 'one-by-one') {
    return (
      <div className="reveal-block-items">
        <ul className="space-y-4">
          {items.map((item, idx) => (
            <li
              key={idx}
              className={`text-2xl transition-opacity duration-300 ${
                revealedIndices.includes(idx) ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {item}
            </li>
          ))}
        </ul>
        
        <div className="mt-6 flex gap-4">
          {revealedIndices.length < items.length && (
            <button
              onClick={handleRevealNext}
              className="px-6 py-3 text-white rounded-lg"
              style={{ backgroundColor: 'var(--ao-navy)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--ao-text)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--ao-navy)'}
            >
              Reveal Next ({revealedIndices.length + 1}/{items.length})
            </button>
          )}
          
          {revealedIndices.length > 0 && (
            <button
              onClick={handleReset}
              className="px-6 py-3 bg-gray-400 text-white rounded-lg hover:bg-gray-500"
            >
              Reset
            </button>
          )}
        </div>
      </div>
    );
  }

  // Reveal all at once
  if (mode === 'all-at-once') {
    return (
      <div className="reveal-block-all">
        {!revealed ? (
          <button
            onClick={handleRevealAll}
            className="px-8 py-4 text-white text-xl rounded-lg"
            style={{ backgroundColor: 'var(--ao-navy)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--ao-text)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--ao-navy)'}
          >
            {revealLabel}
          </button>
        ) : (
          <div className="revealed-items">
            <ul className="space-y-3">
              {items.map((item, idx) => (
                <li key={idx} className="text-2xl animate-fadeIn">
                  {item}
                </li>
              ))}
            </ul>
            <button
              onClick={handleReset}
              className="mt-4 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
            >
              Hide
            </button>
          </div>
        )}
      </div>
    );
  }

  return <div>{children}</div>;
}