import { useState, useEffect, useCallback } from 'react';

export interface DeckNavigationState {
  currentIndex: number;
  totalSlides: number;
  isFirstSlide: boolean;
  isLastSlide: boolean;
}

export interface DeckNavigationControls {
  goToSlide: (index: number) => void;
  nextSlide: () => void;
  prevSlide: () => void;
  goToFirst: () => void;
  goToLast: () => void;
}

export function useDeckNavigation(totalSlides: number) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToSlide = useCallback(
    (index: number) => {
      if (index >= 0 && index < totalSlides) {
        setCurrentIndex(index);
      }
    },
    [totalSlides]
  );

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, totalSlides - 1));
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const goToFirst = useCallback(() => {
    setCurrentIndex(0);
  }, []);

  const goToLast = useCallback(() => {
    setCurrentIndex(totalSlides - 1);
  }, [totalSlides]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Arrow keys and clicker support
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        prevSlide();
      } else if (e.key === 'Home') {
        e.preventDefault();
        goToFirst();
      } else if (e.key === 'End') {
        e.preventDefault();
        goToLast();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide, goToFirst, goToLast]);

  const state: DeckNavigationState = {
    currentIndex,
    totalSlides,
    isFirstSlide: currentIndex === 0,
    isLastSlide: currentIndex === totalSlides - 1,
  };

  const controls: DeckNavigationControls = {
    goToSlide,
    nextSlide,
    prevSlide,
    goToFirst,
    goToLast,
  };

  return { state, controls };
}
