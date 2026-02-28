import { UFLISlideLayout } from './UFLISlideLayout';

interface StoryPageSlideProps {
  imageUrl: string;
  pageNumber?: number;
}

export function StoryPageSlide({ imageUrl, pageNumber }: StoryPageSlideProps) {
  return (
    <UFLISlideLayout>
      <div className="relative w-full h-full flex items-center justify-center">
        <img 
          src={imageUrl} 
          alt={pageNumber ? `Story page ${pageNumber}` : 'Story page'}
          className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
        />
        {pageNumber && (
          <div className="absolute bottom-4 right-4 bg-[#6FA8DC] text-white px-6 py-3 rounded-full shadow-lg">
            <span className="font-['Nunito',sans-serif] font-bold text-2xl">
              Page {pageNumber}
            </span>
          </div>
        )}
      </div>
    </UFLISlideLayout>
  );
}
