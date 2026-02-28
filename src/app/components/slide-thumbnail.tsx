import { Slide } from '../types';

interface SlideThumbnailProps {
  slide: Slide;
  index: number;
  isActive: boolean;
  onClick: () => void;
}

export function SlideThumbnail({ slide, index, isActive, onClick }: SlideThumbnailProps) {
  const getThumbnailPreview = () => {
    switch (slide.type) {
      case 'title':
        return (
          <div 
            className="size-full flex flex-col items-center justify-center p-2"
            style={{ backgroundColor: slide.background || '#4F46E5' }}
          >
            <div className="text-white text-center">
              <div className="font-bold text-xs mb-1 truncate">{slide.title}</div>
              {slide.subtitle && (
                <div className="text-[0.6rem] opacity-75 truncate">{slide.subtitle}</div>
              )}
            </div>
          </div>
        );
      
      default:
        return (
          <div className="size-full flex flex-col p-2 bg-white">
            <div className="font-bold text-xs mb-1 truncate" style={{ color: 'var(--ao-text)' }}>{slide.title}</div>
            <div className="text-[0.6rem] line-clamp-3" style={{ color: 'var(--ao-muted)' }}>{slide.content}</div>
          </div>
        );
    }
  };

  return (
    <button
      onClick={onClick}
      className={`w-full aspect-video rounded-lg overflow-hidden border-2 transition-all ${
        isActive 
          ? 'ring-2' 
          : 'hover:opacity-80'
      }`}
      style={isActive ? { borderColor: 'var(--ao-navy)', boxShadow: '0 0 0 2px rgba(207, 227, 245, 0.5)' } : { borderColor: 'var(--ao-border)' }}
    >
      <div className="relative size-full">
        <div className="absolute top-1 left-1 bg-black/70 text-white text-[0.6rem] px-1.5 py-0.5 rounded z-10">
          {index + 1}
        </div>
        {getThumbnailPreview()}
      </div>
    </button>
  );
}