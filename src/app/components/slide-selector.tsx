import { useState } from 'react';
import { PPTXSlide } from '../utils/pptx-parser';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { CheckCircle2, Image as ImageIcon } from 'lucide-react';
import { cn } from './ui/utils';

interface SlideSelectorProps {
  slides: PPTXSlide[];
  onSlidesSelected: (selectedSlides: PPTXSlide[]) => void;
}

export function SlideSelector({ slides, onSlidesSelected }: SlideSelectorProps) {
  const [selectedSlides, setSelectedSlides] = useState<Set<number>>(new Set());
  const [hoveredSlide, setHoveredSlide] = useState<number | null>(null);

  const toggleSlide = (slideNumber: number) => {
    const newSelected = new Set(selectedSlides);
    if (newSelected.has(slideNumber)) {
      newSelected.delete(slideNumber);
    } else {
      newSelected.add(slideNumber);
    }
    setSelectedSlides(newSelected);
  };

  const selectAll = () => {
    setSelectedSlides(new Set(slides.map(s => s.slideNumber)));
  };

  const clearAll = () => {
    setSelectedSlides(new Set());
  };

  const handleConfirm = () => {
    const selected = slides.filter(s => selectedSlides.has(s.slideNumber));
    onSlidesSelected(selected);
    
    // Store in localStorage for slide generation
    try {
      localStorage.setItem('selectedOriginalSlides', JSON.stringify(selected));
    } catch (e) {
      console.warn('localStorage quota exceeded for selected slides:', e);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Select Slides to Insert</h3>
          <p className="text-sm text-gray-600">
            Choose slides from your original PowerPoint to include in your generated lesson
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={selectAll} variant="outline" size="sm">
            Select All
          </Button>
          <Button onClick={clearAll} variant="outline" size="sm">
            Clear All
          </Button>
        </div>
      </div>

      <div className="rounded-lg p-3 border" style={{ backgroundColor: 'var(--processing-bg)', borderColor: 'var(--processing-border)' }}>
        <p className="text-sm" style={{ color: 'var(--processing-text)' }}>
          <strong>{selectedSlides.size}</strong> of <strong>{slides.length}</strong> slides selected
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[500px] overflow-y-auto p-1">
        {slides.map((slide) => {
          const isSelected = selectedSlides.has(slide.slideNumber);
          const isHovered = hoveredSlide === slide.slideNumber;

          return (
            <Card
              key={slide.slideNumber}
              className={cn(
                "relative cursor-pointer transition-all border-2",
                isSelected 
                  ? "shadow-lg" 
                  : "border-gray-200 hover:shadow-md"
              )}
              style={isSelected ? { borderColor: 'var(--processing-border)', backgroundColor: 'var(--processing-bg)' } : {}}
              onClick={() => toggleSlide(slide.slideNumber)}
              onMouseEnter={() => setHoveredSlide(slide.slideNumber)}
              onMouseLeave={() => setHoveredSlide(null)}
            >
              {/* Checkbox */}
              <div className="absolute top-2 left-2 z-10">
                <div 
                  className="size-6 rounded border-2 flex items-center justify-center"
                  style={isSelected 
                    ? { backgroundColor: 'var(--processing-border)', borderColor: 'var(--processing-border)' }
                    : { backgroundColor: '#FFFFFF', borderColor: '#D1D5DB' }
                  }
                >
                  {isSelected && <CheckCircle2 className="size-4 text-white" />}
                </div>
              </div>

              {/* Slide Number */}
              <div className="absolute top-2 right-2 bg-gray-900/80 text-white text-xs font-bold px-2 py-1 rounded">
                #{slide.slideNumber}
              </div>

              <div className="p-4">
                {/* Slide Preview */}
                <div 
                  className={cn(
                    "aspect-video rounded-lg mb-3 flex items-center justify-center text-sm overflow-hidden",
                    slide.backgroundColor || "bg-gradient-to-br from-gray-100 to-gray-200"
                  )}
                  style={slide.backgroundColor ? { backgroundColor: slide.backgroundColor } : undefined}
                >
                  {slide.images.length > 0 ? (
                    <div className="w-full h-full relative">
                      <img 
                        src={slide.images[0].dataUrl} 
                        alt={`Slide ${slide.slideNumber}`}
                        className="w-full h-full object-cover"
                      />
                      {slide.images.length > 1 && (
                        <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                          +{slide.images.length - 1} more
                        </div>
                      )}
                    </div>
                  ) : slide.title ? (
                    <div className="p-3 text-center">
                      <p className="font-semibold text-gray-800 line-clamp-3">
                        {slide.title}
                      </p>
                    </div>
                  ) : (
                    <div className="text-gray-400">
                      <ImageIcon className="size-8" />
                    </div>
                  )}
                </div>

                {/* Slide Info */}
                <div>
                  <h4 className="font-medium text-sm text-gray-900 line-clamp-2 mb-1">
                    {slide.title || `Slide ${slide.slideNumber}`}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    {slide.images.length > 0 && (
                      <span className="flex items-center gap-1">
                        <ImageIcon className="size-3" />
                        {slide.images.length}
                      </span>
                    )}
                    {slide.content.length > 0 && (
                      <span>{slide.content.length} items</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Hover overlay with content preview */}
              {isHovered && slide.content.length > 0 && (
                <div className="absolute inset-0 bg-black/90 p-3 rounded-lg flex flex-col justify-center overflow-hidden">
                  <div className="text-white text-xs space-y-1">
                    {slide.content.slice(0, 5).map((text, idx) => (
                      <p key={idx} className="line-clamp-1">• {text}</p>
                    ))}
                    {slide.content.length > 5 && (
                      <p className="text-gray-400">+{slide.content.length - 5} more...</p>
                    )}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button 
          onClick={handleConfirm}
          disabled={selectedSlides.size === 0}
          style={{ backgroundColor: 'var(--ao-red)' }}
          className="hover:opacity-90"
        >
          <CheckCircle2 className="size-4 mr-2" />
          Confirm Selection ({selectedSlides.size} slides)
        </Button>
      </div>
    </div>
  );
}
