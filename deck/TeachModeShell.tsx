import { useState, useEffect } from 'react';
import { DeckPlayer } from './DeckPlayer';
import type { DeckPlan } from '../types/slides';

interface TeachModeShellProps {
  deckPlan: DeckPlan;
  onExit: () => void;
}

type EngagementPrompt = 
  | 'turn-talk'
  | 'say-with-me'
  | 'show-fingers'
  | 'hands-on-head'
  | 'stand-if-rhymes'
  | null;

const ENGAGEMENT_PROMPTS: Record<Exclude<EngagementPrompt, null>, string> = {
  'turn-talk': '👥 Turn & Talk',
  'say-with-me': '🗣️ Say it with me!',
  'show-fingers': '✋ Show me on your fingers',
  'hands-on-head': '🙌 Hands on head if you hear ___',
  'stand-if-rhymes': '🎵 Stand if it rhymes',
};

export function TeachModeShell({ deckPlan, onExit }: TeachModeShellProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showEngagement, setShowEngagement] = useState<EngagementPrompt>(null);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleExit = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    onExit();
  };

  // Auto-dismiss engagement prompt after 3 seconds
  useEffect(() => {
    if (showEngagement) {
      const timer = setTimeout(() => {
        setShowEngagement(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showEngagement]);

  return (
    <div className="teach-mode-shell h-screen bg-black">
      {/* Teach mode controls overlay */}
      <div className="teach-mode-overlay fixed top-0 left-0 right-0 z-50 p-4 bg-gradient-to-b from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity">
        <div className="flex items-center justify-between">
          <div className="text-white text-lg font-medium">
            Teach Mode
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={toggleFullscreen}
              className="px-4 py-2 bg-white/20 text-white rounded hover:bg-white/30 transition-colors"
            >
              {isFullscreen ? '🔲 Exit Fullscreen' : '⛶ Fullscreen'}
            </button>
            
            <button
              onClick={handleExit}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Exit Teach Mode
            </button>
          </div>
        </div>
      </div>

      {/* Engagement prompt buttons */}
      <div className="engagement-panel fixed right-4 top-1/2 -translate-y-1/2 z-50 space-y-2 opacity-0 hover:opacity-100 transition-opacity">
        <button
          onClick={() => setShowEngagement('turn-talk')}
          className="w-14 h-14 rounded-full text-white text-2xl transition-colors shadow-lg flex items-center justify-center"
          style={{ backgroundColor: 'var(--ao-navy)' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--ao-text)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--ao-navy)'}
          title="Turn & Talk"
        >
          💬
        </button>
        <button
          onClick={() => setShowEngagement('say-with-me')}
          className="w-14 h-14 rounded-full text-white text-2xl transition-colors shadow-lg flex items-center justify-center"
          style={{ backgroundColor: 'var(--ao-sky)' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--ao-navy)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--ao-sky)'}
          title="Say it with me!"
        >
          🗣️
        </button>
        <button
          onClick={() => setShowEngagement('show-fingers')}
          className="w-14 h-14 rounded-full bg-green-500 text-white text-2xl hover:bg-green-600 transition-colors shadow-lg flex items-center justify-center"
          title="Show me on your fingers"
        >
          ✋
        </button>
        <button
          onClick={() => setShowEngagement('hands-on-head')}
          className="w-14 h-14 rounded-full text-white text-2xl transition-colors shadow-lg flex items-center justify-center"
          style={{ backgroundColor: 'var(--ao-tan)' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--ao-text)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--ao-tan)'}
          title="Hands on head if you hear ___"
        >
          🙌
        </button>
        <button
          onClick={() => setShowEngagement('stand-if-rhymes')}
          className="w-14 h-14 rounded-full bg-pink-500 text-white text-2xl hover:bg-pink-600 transition-colors shadow-lg flex items-center justify-center"
          title="Stand if it rhymes"
        >
          🎵
        </button>
      </div>

      {/* Engagement prompt overlay */}
      {showEngagement && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[60] pointer-events-none">
          <div className="bg-white px-12 py-8 rounded-3xl text-5xl font-bold animate-bounce shadow-2xl">
            {ENGAGEMENT_PROMPTS[showEngagement]}
          </div>
        </div>
      )}

      {/* Deck player */}
      <DeckPlayer deckPlan={deckPlan} teachMode={true} />
      
      {/* Keyboard shortcuts help (show on hover) */}
      <div className="keyboard-help fixed bottom-4 left-4 bg-black/70 text-white p-4 rounded-lg text-sm opacity-0 hover:opacity-100 transition-opacity z-50">
        <div className="font-semibold mb-2">Keyboard Shortcuts</div>
        <div className="space-y-1">
          <div>→ or Space: Next slide</div>
          <div>← : Previous slide</div>
          <div>Home: First slide</div>
          <div>End: Last slide</div>
        </div>
      </div>
    </div>
  );
}