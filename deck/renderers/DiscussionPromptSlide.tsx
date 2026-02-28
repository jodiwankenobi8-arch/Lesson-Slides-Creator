import type { DiscussionPromptContent } from '../../types/slides';

interface DiscussionPromptSlideProps {
  content: DiscussionPromptContent;
}

export function DiscussionPromptSlide({ content }: DiscussionPromptSlideProps) {
  return (
    <div className="discussion-prompt-slide flex flex-col h-full p-12">
      <h2 className="text-5xl font-bold mb-12 text-center">
        💬 Let's Talk About It
      </h2>
      
      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-4xl text-center">
          {content.imageUrl && (
            <div className="mb-8">
              <img
                src={content.imageUrl}
                alt="Discussion prompt"
                className="max-h-96 mx-auto rounded-lg shadow-xl"
              />
            </div>
          )}
          
          <div className="text-4xl font-semibold leading-relaxed p-8 bg-white rounded-2xl shadow-lg">
            {content.question}
          </div>
          
          {content.skillTag && (
            <div className="mt-6 text-xl text-gray-600">
              Focus: {content.skillTag.replace(/_/g, ' ')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
