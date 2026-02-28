import { useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize, Minimize } from 'lucide-react';
import {
  WelcomeSlide,
  ICanStatementsSlide,
  VideoSlide,
  UFLITitleSlide,
  SightWordSlide,
  StoryPageSlide,
  CelebrationSlide
} from './slide-components';

interface SlidePreviewProps {
  formData: any;
}

export function SlidePreview({ formData }: SlidePreviewProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Generate slides based on form data
  const slides = [];

  // 1. Welcome Slide
  slides.push({
    component: <WelcomeSlide date={formData.date} />,
    title: 'Welcome'
  });

  // 2. I Can Statements
  if (formData.iCanStatements && formData.iCanStatements.length > 0) {
    slides.push({
      component: <ICanStatementsSlide statements={formData.iCanStatements} />,
      title: 'Learning Goals'
    });
  }

  // 3. Video Slides
  if (formData.videos && formData.videos.length > 0) {
    formData.videos.forEach((video: any, index: number) => {
      if (video.url) {
        slides.push({
          component: (
            <VideoSlide
              title={video.title || `Video ${index + 1}`}
              subtitle={video.subtitle}
              videoUrl={video.url}
            />
          ),
          title: video.title || `Video ${index + 1}`
        });
      }
    });
  }

  // 4. UFLI Title Slide
  if (formData.ufliLesson && formData.ufliDay && formData.phoneticsConcept) {
    slides.push({
      component: (
        <UFLITitleSlide
          lessonNumber={formData.ufliLesson}
          dayNumber={formData.ufliDay}
          phoneticsConcept={formData.phoneticsConcept}
        />
      ),
      title: 'UFLI Lesson'
    });
  }

  // 5. Sight Word Slides
  if (formData.sightWords && formData.sightWords.length > 0) {
    formData.sightWords.forEach((word: string) => {
      // Introduction slide
      slides.push({
        component: <SightWordSlide word={word} />,
        title: `Sight Word: ${word}`
      });
      // Spelling slide
      slides.push({
        component: <SightWordSlide word={word} showSpelling={true} />,
        title: `Spell: ${word}`
      });
    });
  }

  // 6. Story Pages
  if (formData.savvasPages && formData.savvasPages.length > 0) {
    formData.savvasPages.forEach((page: any, index: number) => {
      if (page.image) {
        slides.push({
          component: (
            <StoryPageSlide
              imageUrl={page.image}
              pageNumber={page.pageNumber || index + 1}
            />
          ),
          title: `Story Page ${page.pageNumber || index + 1}`
        });
      }
    });
  }

  // 7. Celebration Slide
  slides.push({
    component: <CelebrationSlide />,
    title: 'Celebration'
  });

  const goToNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const goToPrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (slides.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">No slides to preview. Please fill out the form first.</p>
      </div>
    );
  }

  return (
    <div className={isFullscreen ? "fixed inset-0 z-50 bg-black flex flex-col" : "flex flex-col h-full"}>
      {/* Slide Display */}
      <div className="flex-1 bg-gray-100 relative overflow-hidden flex items-center justify-center">
        <div className={isFullscreen ? "w-full h-full" : "w-full h-full"} style={{ aspectRatio: '16/9' }}>
          {slides[currentSlide].component}
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="bg-white border-t border-gray-200 p-4 flex items-center justify-between gap-4">
        <button
          onClick={goToPrevious}
          disabled={currentSlide === 0}
          className="flex items-center gap-2 px-4 py-2 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          style={{ backgroundColor: currentSlide === 0 ? undefined : 'var(--ao-navy)' }}
        >
          <ChevronLeft size={20} />
          Previous
        </button>

        <div className="text-center flex-1">
          <p className="text-sm text-gray-600">
            Slide {currentSlide + 1} of {slides.length}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {slides[currentSlide].title}
          </p>
        </div>

        <button
          onClick={goToNext}
          disabled={currentSlide === slides.length - 1}
          className="flex items-center gap-2 px-4 py-2 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          style={{ backgroundColor: currentSlide === slides.length - 1 ? undefined : 'var(--ao-navy)' }}
        >
          Next
          <ChevronRight size={20} />
        </button>

        <button
          onClick={toggleFullscreen}
          className="flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors hover:opacity-90"
          style={{ backgroundColor: 'var(--processing-border)' }}
        >
          {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
          {isFullscreen ? 'Exit' : 'Fullscreen'}
        </button>
      </div>
    </div>
  );
}