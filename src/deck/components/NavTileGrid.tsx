import type { SlideModel } from '../../types/slides';

interface NavTileGridProps {
  slides: SlideModel[];
  currentIndex: number;
  onNavigate: (index: number) => void;
}

export function NavTileGrid({ slides, currentIndex, onNavigate }: NavTileGridProps) {
  const getSectionLabel = (type: string): string => {
    const labels: Record<string, string> = {
      welcome: '👋 Welcome',
      learning_targets: '🎯 Targets',
      songs_roadmap: '🎵 Songs',
      phonemic_awareness: '👂 Listening',
      letter_drill: '🔤 Letters',
      blending_board: '🔀 Blending',
      new_concept: '💡 New Concept',
      word_practice: '📝 Practice',
      vocab_intro: '📚 Vocabulary',
      story_page: '📖 Story',
      discussion_prompt: '💬 Discussion',
      turn_and_talk: '🗣️ Turn & Talk',
      review_exit: '✅ Review',
      celebration: '🎉 Celebrate',
    };
    
    return labels[type] || type.replace(/_/g, ' ');
  };

  // Group slides into major sections
  const sections = slides.reduce((acc, slide, index) => {
    const label = getSectionLabel(slide.type);
    
    // Create new section for certain slide types
    const sectionStarts = [
      'welcome',
      'learning_targets',
      'songs_roadmap',
      'phonemic_awareness',
      'new_concept',
      'word_practice',
      'vocab_intro',
      'book_cover',
      'discussion_prompt',
      'review_exit',
      'celebration',
    ];
    
    if (sectionStarts.includes(slide.type) || acc.length === 0) {
      acc.push({
        label,
        slideIndex: index,
        type: slide.type,
      });
    }
    
    return acc;
  }, [] as { label: string; slideIndex: number; type: string }[]);

  return (
    <div className="nav-tile-grid">
      <div className="text-center mb-6 text-xl font-semibold">
        Jump to Section
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
        {sections.map((section, idx) => (
          <button
            key={section.slideIndex}
            onClick={() => onNavigate?.(section.slideIndex)}
            className={`p-4 rounded-lg text-center transition-all ${
              currentIndex === section.slideIndex
                ? 'text-white shadow-lg scale-105'
                : 'bg-white border-2 border-gray-300 hover:shadow-md'
            }`}
            style={currentIndex === section.slideIndex ? { backgroundColor: 'var(--ao-navy)' } : {}}
            onMouseEnter={(e) => {
              if (currentIndex !== section.slideIndex) {
                e.currentTarget.style.borderColor = 'var(--ao-sky)';
              }
            }}
            onMouseLeave={(e) => {
              if (currentIndex !== section.slideIndex) {
                e.currentTarget.style.borderColor = '';
              }
            }}
          >
            <div className="text-lg font-medium">{section.label}</div>
            <div className="text-sm opacity-75 mt-1">
              Slide {section.slideIndex + 1}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}