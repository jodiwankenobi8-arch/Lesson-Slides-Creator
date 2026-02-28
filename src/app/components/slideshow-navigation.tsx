import { Home, List, ChevronLeft, ChevronRight, Maximize, Minimize, X } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { useState } from 'react';
import { Slide } from '../types';

interface SlideshowNavigationProps {
  currentIndex: number;
  totalSlides: number;
  slides: Slide[];
  onNavigate: (index: number) => void;
  onHome: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export function SlideshowNavigation({
  currentIndex,
  totalSlides,
  slides,
  onNavigate,
  onHome,
  isFullscreen,
  onToggleFullscreen,
}: SlideshowNavigationProps) {
  const [showTOC, setShowTOC] = useState(false);

  // Group slides by section
  const sections = [
    { name: 'Introduction & Songs', start: 0, icon: '🎵' },
    { name: 'UFLI Phonics', start: 7, icon: '📝' },
    { name: 'Sight Words', start: -1, icon: '👁️' }, // Will find dynamically
    { name: 'Savvas Reading', start: -1, icon: '📚' },
    { name: 'Celebration', start: -1, icon: '🎉' },
  ];

  // Find section indices dynamically
  const sightWordsIndex = slides.findIndex(s => s.type === 'sight-word-intro' || s.title.toLowerCase().includes('sight words'));
  const savvasIndex = slides.findIndex(s => s.title.toLowerCase().includes('story time'));
  const celebrationIndex = slides.findIndex(s => s.type === 'celebration');

  sections[2].start = sightWordsIndex !== -1 ? sightWordsIndex - 1 : -1;
  sections[3].start = savvasIndex !== -1 ? savvasIndex : -1;
  sections[4].start = celebrationIndex !== -1 ? celebrationIndex : -1;

  const goToPrevious = () => {
    if (currentIndex > 0) {
      onNavigate(currentIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentIndex < totalSlides - 1) {
      onNavigate(currentIndex + 1);
    }
  };

  return (
    <>
      {/* Fixed Navigation Bar */}
      <div className={isFullscreen ? "fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm shadow-md z-50 p-4" : "hidden"}>
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Left: Home & TOC */}
          <div className="flex items-center gap-2">
            <Button
              onClick={onHome}
              variant="outline"
              size="sm"
              className="bg-white"
            >
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
            <Button
              onClick={() => setShowTOC(true)}
              variant="outline"
              size="sm"
              className="bg-white"
            >
              <List className="w-4 h-4 mr-2" />
              Table of Contents
            </Button>
          </div>

          {/* Center: Slide Counter */}
          <div className="text-sm font-medium text-gray-700">
            Slide {currentIndex + 1} of {totalSlides}
          </div>

          {/* Right: Navigation & Fullscreen */}
          <div className="flex items-center gap-2">
            <Button
              onClick={goToPrevious}
              disabled={currentIndex === 0}
              variant="outline"
              size="sm"
              className="bg-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              onClick={goToNext}
              disabled={currentIndex === totalSlides - 1}
              variant="outline"
              size="sm"
              className="bg-white"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              onClick={onToggleFullscreen}
              variant="outline"
              size="sm"
              className="text-white hover:opacity-90"
              style={{ backgroundColor: 'var(--processing-border)' }}
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Table of Contents Dialog */}
      <Dialog open={showTOC} onOpenChange={setShowTOC}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#2f3e46]">Table of Contents</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {sections.map((section, idx) => {
              if (section.start === -1) return null;
              
              return (
                <button
                  key={idx}
                  onClick={() => {
                    onNavigate(section.start);
                    setShowTOC(false);
                  }}
                  className="w-full text-left p-4 rounded-lg border-2 border-[#6fa8dc]/20 hover:border-[#6fa8dc] hover:bg-[#6fa8dc]/10 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{section.icon}</span>
                    <div className="flex-1">
                      <h3 className="font-['Poppins',sans-serif] font-semibold text-lg text-[#2f3e46]">
                        {section.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Starts at slide {section.start + 1}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#6fa8dc]" />
                  </div>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
