import svgPaths from "../../imports/svg-h9imbi5xbp";
import imgImageReadingBirdMascot from "figma:asset/3c5f456ff361271f7d99297678004fcd37902fc2.png";
import { Slide } from '../types';
import { Home, List, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';

interface KindergartenSlideProps {
  slide: Slide;
  currentIndex?: number;
  totalSlides?: number;
  onNavigate?: (direction: 'prev' | 'next' | 'home' | 'toc') => void;
  showControls?: boolean;
}

function WaveDecoration() {
  return (
    <div className="absolute left-0 top-[555.2px] w-full h-[128px]">
      <div className="h-full w-full overflow-clip relative">
        <div className="absolute inset-[-20.83%_0_0_0]">
          <svg className="absolute block inset-0" fill="none" preserveAspectRatio="none" viewBox="0 0 1160 154.667">
            <path d={svgPaths.p39251840} fill="#6FA8DC" opacity="0.3" />
          </svg>
        </div>
        <div className="absolute inset-[-4.17%_0_0_0]">
          <svg className="absolute block inset-0" fill="none" preserveAspectRatio="none" viewBox="0 0 1160 133.333">
            <path d={svgPaths.p65a6e00} fill="#6FA8DC" opacity="0.2" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function getYouTubeEmbedUrl(url: string | undefined): string | null {
  if (!url) return null;
  
  // Extract video ID from various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}?autoplay=1&mute=1`;
    }
  }
  
  return null;
}

export function KindergartenSlide({ slide, currentIndex, totalSlides, onNavigate, showControls }: KindergartenSlideProps) {
  // Video slide type
  if (slide.type === 'video' && slide.videoUrl) {
    const embedUrl = getYouTubeEmbedUrl(slide.videoUrl);
    
    return (
      <div className="size-full bg-[#f4e9da] relative overflow-clip flex items-center justify-center">
        <WaveDecoration />
        <div className="w-full h-full p-12 flex flex-col items-center justify-center z-10">
          {slide.title && (
            <h2 className="font-['Poppins',sans-serif] font-medium text-[48px] text-[#2f3e46] mb-8 text-center">
              {slide.title}
            </h2>
          )}
          {embedUrl ? (
            <div className="w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl">
              <iframe
                width="100%"
                height="100%"
                src={embedUrl}
                title={slide.title || 'Video'}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          ) : (
            <div className="w-full max-w-4xl aspect-video rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--ao-cream)' }}>
              <p className="text-xl" style={{ color: 'var(--ao-muted)' }}>Video URL not available</p>
            </div>
          )}
        </div>
        {showControls && (
          <div className="absolute bottom-4 left-4 right-4 flex justify-between">
            <Button
              onClick={() => onNavigate?.('prev')}
              disabled={currentIndex === 0}
              className="bg-[#6fa8dc] text-white"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              onClick={() => onNavigate?.('next')}
              disabled={currentIndex === totalSlides - 1}
              className="bg-[#6fa8dc] text-white"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Book page slide type
  if (slide.type === 'book-page' && slide.metadata?.image) {
    return (
      <div className="size-full bg-[#f4e9da] relative overflow-clip flex items-center justify-center">
        <WaveDecoration />
        <div className="w-full h-full p-8 flex items-center justify-center z-10">
          <img 
            src={slide.metadata.image} 
            alt={`${slide.title} - ${slide.content}`}
            className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
          />
        </div>
        {showControls && (
          <div className="absolute bottom-4 left-4 right-4 flex justify-between">
            <Button
              onClick={() => onNavigate?.('prev')}
              disabled={currentIndex === 0}
              className="bg-[#6fa8dc] text-white"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              onClick={() => onNavigate?.('next')}
              disabled={currentIndex === totalSlides - 1}
              className="bg-[#6fa8dc] text-white"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        )}
      </div>
    );
  }

  // UFLI activity slide with screenshot
  if (slide.type === 'ufli-activity' && slide.metadata?.screenshot) {
    return (
      <div className="size-full bg-[#f4e9da] relative overflow-clip flex items-center justify-center">
        <WaveDecoration />
        <div className="w-full h-full p-8 flex items-center justify-center z-10">
          <img 
            src={slide.metadata.screenshot} 
            alt={slide.title}
            className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
          />
        </div>
        {showControls && (
          <div className="absolute bottom-4 left-4 right-4 flex justify-between">
            <Button
              onClick={() => onNavigate?.('prev')}
              disabled={currentIndex === 0}
              className="bg-[#6fa8dc] text-white"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              onClick={() => onNavigate?.('next')}
              disabled={currentIndex === totalSlides - 1}
              className="bg-[#6fa8dc] text-white"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Vocabulary detail with image
  if (slide.type === 'vocabulary-detail' && slide.metadata?.image) {
    return (
      <div className="size-full bg-[#f4e9da] relative overflow-clip">
        <WaveDecoration />
        <div className="absolute left-0 top-0 w-full h-[683.2px] flex items-center justify-center">
          <div className="flex items-center gap-12 px-12">
            <div className="flex-1 flex flex-col items-center">
              <img 
                src={slide.metadata.image} 
                alt={slide.title}
                className="max-w-md max-h-96 object-contain rounded-2xl shadow-xl"
              />
            </div>
            <div className="flex-1 flex flex-col items-center gap-4">
              <h2 className="font-['Poppins',sans-serif] font-bold text-[64px] text-[#2f3e46]">
                {slide.title}
              </h2>
              {slide.content && (
                <p className="font-['Nunito',sans-serif] text-[32px] text-[#2f3e46] text-center max-w-xl">
                  {slide.content}
                </p>
              )}
            </div>
          </div>
        </div>
        {showControls && (
          <div className="absolute bottom-4 left-4 right-4 flex justify-between">
            <Button
              onClick={() => onNavigate?.('prev')}
              disabled={currentIndex === 0}
              className="bg-[#6fa8dc] text-white"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              onClick={() => onNavigate?.('next')}
              disabled={currentIndex === totalSlides - 1}
              className="bg-[#6fa8dc] text-white"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Default slide layout
  return (
    <div className="size-full bg-[#f4e9da] relative overflow-clip">
      <WaveDecoration />
      
      <div className="absolute left-0 top-0 w-full h-[683.2px] flex flex-col items-center justify-center">
        <div className="flex flex-col items-center justify-center pb-32">
          <div className="flex flex-col gap-1 items-center">
            {/* Bird Mascot */}
            {slide.showMascot !== false && (
              <div className="size-48 relative">
                <img 
                  alt="Reading bird mascot" 
                  className="absolute inset-0 size-full object-contain" 
                  src={imgImageReadingBirdMascot} 
                />
              </div>
            )}
            
            {/* Heading */}
            <div className="relative">
              <p className="font-['Poppins',sans-serif] font-medium leading-[72px] text-[#2f3e46] text-[72px] text-center">
                {slide.title}
              </p>
            </div>
            
            {/* Subheading */}
            {slide.subtitle && (
              <div className="relative">
                <p className="font-['Nunito',sans-serif] font-normal leading-[40px] text-[#6fa8dc] text-[36px] text-center">
                  {slide.subtitle}
                </p>
              </div>
            )}

            {/* Content */}
            {slide.content && slide.type !== 'title' && (
              <div className="mt-8 max-w-3xl">
                <p className="font-['Nunito',sans-serif] font-normal leading-relaxed text-[#2f3e46] text-[28px] text-center">
                  {slide.content}
                </p>
              </div>
            )}

            {/* List Items */}
            {slide.items && slide.items.length > 0 && (
              <div className="mt-8 max-w-2xl space-y-4">
                {slide.items.map((item, idx) => (
                  <div 
                    key={idx}
                    className="bg-white rounded-2xl p-6 shadow-md border-2 border-[#6fa8dc]/20"
                  >
                    <p className="font-['Nunito',sans-serif] text-[24px] text-[#2f3e46] text-center">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {showControls && (
          <div className="absolute bottom-4 left-4 right-4 flex justify-between">
            <Button
              onClick={() => onNavigate?.('prev')}
              disabled={currentIndex === 0}
              className="bg-[#6fa8dc] text-white"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              onClick={() => onNavigate?.('next')}
              disabled={currentIndex === totalSlides - 1}
              className="bg-[#6fa8dc] text-white"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}