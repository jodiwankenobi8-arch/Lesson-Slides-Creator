import { ErrorBoundary } from 'react-error-boundary';
import { useDeckNavigation } from './useDeckNavigation';
import { slideRenderers, hasRenderer } from './renderers';
import type { DeckPlan, SlideModel } from '../types/slides';

interface DeckPlayerProps {
  deckPlan: DeckPlan;
  teachMode?: boolean;
}

function SlideErrorFallback({ error }: { error: Error }) {
  return (
    <div className="slide-error flex flex-col items-center justify-center h-full p-12 bg-red-50">
      <div className="text-6xl mb-6">⚠️</div>
      <h2 className="text-3xl font-bold text-red-800 mb-4">
        Slide Error
      </h2>
      <p className="text-xl text-red-700 max-w-2xl text-center">
        {error.message}
      </p>
      <p className="text-sm text-gray-600 mt-4">
        Press arrow keys to continue to next slide
      </p>
    </div>
  );
}

function UnknownSlideRenderer({ slide }: { slide: SlideModel }) {
  return (
    <div className="unknown-slide flex flex-col items-center justify-center h-full p-12">
      <div className="text-6xl mb-6">🚧</div>
      <h2 className="text-3xl font-bold mb-4">
        Slide Type Not Yet Implemented
      </h2>
      <p className="text-xl text-gray-700">
        Type: <code className="bg-gray-200 px-2 py-1 rounded">{slide.type}</code>
      </p>
      <pre className="mt-6 bg-gray-100 p-4 rounded max-w-2xl overflow-auto text-sm">
        {JSON.stringify(slide.content, null, 2)}
      </pre>
    </div>
  );
}

function SlideRenderer({ slide, onNavigate }: { slide: SlideModel; onNavigate: (index: number) => void }) {
  if (!hasRenderer(slide.type)) {
    return <UnknownSlideRenderer slide={slide} />;
  }

  const Renderer = slideRenderers[slide.type];
  
  // Type assertion needed because discriminated union
  // @ts-expect-error - Dynamic component rendering with discriminated union
  return <Renderer content={slide.content} onNavigate={onNavigate} />;
}

export function DeckPlayer({ deckPlan, teachMode = false }: DeckPlayerProps) {
  const { state, controls } = useDeckNavigation(deckPlan.slides.length);
  
  if (deckPlan.slides.length === 0) {
    return (
      <div className="deck-player-empty flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4">📋</div>
          <div className="text-2xl text-gray-600">No slides in this deck</div>
        </div>
      </div>
    );
  }

  const currentSlide = deckPlan.slides[state.currentIndex];

  return (
    <div className={`deck-player ${teachMode ? 'teach-mode' : ''} h-screen flex flex-col bg-gray-100`}>
      {/* Slide content area */}
      <div className="flex-1 relative">
        <ErrorBoundary FallbackComponent={SlideErrorFallback}>
          <SlideRenderer slide={currentSlide} onNavigate={controls.goToSlide} />
        </ErrorBoundary>
      </div>

      {/* Navigation controls (hidden in teach mode) */}
      {!teachMode && (
        <div className="deck-controls bg-white border-t border-gray-300 p-4 flex items-center justify-between">
          <button
            onClick={controls.prevSlide}
            disabled={state.isFirstSlide}
            className="px-6 py-2 bg-gray-600 text-white rounded disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-700"
          >
            ← Previous
          </button>

          <div className="flex items-center gap-4">
            <span className="text-lg font-medium">
              {state.currentIndex + 1} / {state.totalSlides}
            </span>
            <span className="text-sm text-gray-600">
              {currentSlide.type.replace(/_/g, ' ')}
            </span>
          </div>

          <button
            onClick={controls.nextSlide}
            disabled={state.isLastSlide}
            className="px-6 py-2 text-white rounded disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--ao-navy)' }}
            onMouseEnter={(e) => !state.isLastSlide && (e.currentTarget.style.backgroundColor = 'var(--ao-text)')}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--ao-navy)'}
          >
            Next →
          </button>
        </div>
      )}

      {/* Teach mode controls (minimal) */}
      {teachMode && (
        <div className="teach-mode-controls fixed bottom-4 right-4 bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg text-sm">
          {state.currentIndex + 1} / {state.totalSlides}
        </div>
      )}
    </div>
  );
}