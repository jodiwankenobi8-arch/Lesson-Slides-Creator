import { RevealBlock } from '../components/RevealBlock';
import { PhonicsWordRenderer } from './PhonicsWordRenderer';
import type { WordPracticeContent } from '../../types/slides';

interface WordPracticeSlideProps {
  content: WordPracticeContent;
}

export function WordPracticeSlide({ content }: WordPracticeSlideProps) {
  // GUARDRAIL: Use data-driven annotations OR plain text
  // NO regex fallback unless explicitly enabled by teacher toggle
  const getAnnotationsForWord = (word: string) => {
    // If phonicsAnnotations provided from LLM, use them
    if (content.phonicsAnnotations) {
      const wordAnnotation = content.phonicsAnnotations.find(a => a.word === word);
      return wordAnnotation?.annotations;
    }
    
    // Otherwise render plain text (no highlighting)
    return undefined;
  };

  return (
    <div className="word-practice-slide flex flex-col h-full p-12">
      <h2 className="text-5xl font-bold mb-8">
        {content.sightWords ? '👀 Sight Words' : '📝 Word Practice'}
      </h2>
      
      <div className="flex-1 flex items-center justify-center">
        {content.mode === 'reveal' ? (
          <RevealBlock mode="one-by-one" items={content.words}>
            <div className="text-4xl font-bold">
              {content.words.map((word, idx) => (
                <div key={idx} className="mb-4">
                  <PhonicsWordRenderer 
                    word={word} 
                    annotations={getAnnotationsForWord(word)}
                    fontSize="4xl"
                  />
                </div>
              ))}
            </div>
          </RevealBlock>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            {content.words.map((word, idx) => (
              <div
                key={idx}
                className="text-5xl font-bold text-center p-6 bg-white rounded-xl shadow-lg"
              >
                <PhonicsWordRenderer 
                  word={word} 
                  annotations={getAnnotationsForWord(word)}
                  fontSize="5xl"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}