import type { ReviewExitContent } from '../../types/slides';

interface ReviewExitSlideProps {
  content: ReviewExitContent;
}

export function ReviewExitSlide({ content }: ReviewExitSlideProps) {
  return (
    <div className="review-exit-slide flex flex-col h-full p-12">
      <h2 className="text-5xl font-bold mb-12 text-center">
        ✅ Let's Review
      </h2>
      
      <div className="flex-1 flex flex-col justify-center">
        <div className="text-3xl mb-8 text-center max-w-4xl mx-auto">
          {content.summary}
        </div>
        
        {content.keyPoints && content.keyPoints.length > 0 && (
          <div className="max-w-3xl mx-auto">
            <ul className="space-y-6">
              {content.keyPoints.map((point, idx) => (
                <li key={idx} className="flex items-start gap-4">
                  <span className="text-4xl">✓</span>
                  <span className="text-2xl flex-1">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
