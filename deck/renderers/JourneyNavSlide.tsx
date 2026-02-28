import type { JourneyNavContent } from '../../types/slides';

interface JourneyNavSlideProps {
  content: JourneyNavContent;
  onNavigate: (index: number) => void;
}

export function JourneyNavSlide({ content, onNavigate }: JourneyNavSlideProps) {
  return (
    <div className="journey-nav-slide flex flex-col h-full p-12">
      <h2 className="text-5xl font-bold mb-12 text-center">
        📍 Today's Journey
      </h2>
      
      <div className="flex-1 flex items-center justify-center">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-5xl">
          {content.sections.map((section, idx) => (
            <button
              key={section.index}
              onClick={() => onNavigate(section.index)}
              className="p-8 bg-white rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all border-4 border-transparent"
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--ao-sky)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
            >
              {section.icon && (
                <div className="text-6xl mb-4">{section.icon}</div>
              )}
              <div className="text-2xl font-semibold">{section.label}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}