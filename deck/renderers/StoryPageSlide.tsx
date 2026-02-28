import type { StoryPageContent } from '../../types/slides';

interface StoryPageSlideProps {
  content: StoryPageContent;
}

export function StoryPageSlide({ content }: StoryPageSlideProps) {
  return (
    <div className="story-page-slide flex flex-col h-full p-12">
      {content.pageNumber && (
        <div className="text-2xl text-gray-600 mb-4">
          Page {content.pageNumber}
        </div>
      )}
      
      <div className="flex-1 flex items-center justify-center gap-8">
        {content.imageUrl && (
          <div className="flex-1 max-w-2xl">
            <img
              src={content.imageUrl}
              alt={`Story page ${content.pageNumber || ''}`}
              className="w-full h-auto rounded-lg shadow-xl"
            />
          </div>
        )}
        
        {content.text && (
          <div className={`flex-1 ${content.imageUrl ? 'max-w-xl' : 'max-w-3xl'}`}>
            <p className="text-3xl leading-relaxed">
              {content.text}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
