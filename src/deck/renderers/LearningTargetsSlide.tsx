import type { LearningTargetsContent } from '../../types/slides';

interface LearningTargetsSlideProps {
  content: LearningTargetsContent;
}

export function LearningTargetsSlide({ content }: LearningTargetsSlideProps) {
  return (
    <div className="learning-targets-slide flex flex-col h-full p-12">
      <h2 className="text-5xl font-bold mb-8">
        🎯 Learning Targets
      </h2>
      
      {content.skillFocus && (
        <div className="mb-6 text-2xl text-gray-700">
          <strong>Focus:</strong> {content.skillFocus}
        </div>
      )}
      
      <div className="flex-1 flex flex-col justify-center">
        <ul className="space-y-6">
          {content.iCanStatements.map((statement, idx) => (
            <li key={idx} className="flex items-start gap-4">
              <span className="text-4xl">✓</span>
              <span className="text-3xl flex-1">{statement}</span>
            </li>
          ))}
        </ul>
      </div>
      
      {content.standardsCodes && content.standardsCodes.length > 0 && (
        <div className="mt-8 text-lg text-gray-600">
          <strong>Standards:</strong> {content.standardsCodes.join(', ')}
        </div>
      )}
    </div>
  );
}
