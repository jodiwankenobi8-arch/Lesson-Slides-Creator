import { useState } from 'react';
import { SlideLayout } from './SlideLayout';
import { CheckCircle } from 'lucide-react';

interface ICanStatementsSlideProps {
  statements?: string[];
}

export function ICanStatementsSlide({ statements = [] }: ICanStatementsSlideProps) {
  const [checkedStates, setCheckedStates] = useState<boolean[]>(
    new Array(statements.length).fill(false)
  );

  const toggleCheck = (index: number) => {
    const newStates = [...checkedStates];
    newStates[index] = !newStates[index];
    setCheckedStates(newStates);
  };

  const defaultStatements = [
    'Read long A words with silent E',
    'Read sight words fast without sounding them out',
    'Tell why an author wrote a story'
  ];

  const displayStatements = statements.length > 0 ? statements : defaultStatements;

  return (
    <SlideLayout 
      title="I Can Statements"
      subtitle="Today's Learning Goals"
    >
      <div className="flex flex-col gap-6 w-full max-w-4xl">
        {displayStatements.map((statement, index) => (
          <div
            key={index}
            onClick={() => toggleCheck(index)}
            className="flex items-center gap-4 p-6 bg-white rounded-2xl cursor-pointer transition-all hover:scale-105 border-4"
            style={{
              borderColor: checkedStates[index] ? '#6FA8DC' : '#CFE8E5',
              backgroundColor: checkedStates[index] ? '#E8F4F8' : 'white'
            }}
          >
            <CheckCircle 
              className="shrink-0 transition-all"
              size={40}
              style={{
                color: checkedStates[index] ? '#6FA8DC' : '#D1D5DB',
                fill: checkedStates[index] ? '#6FA8DC' : 'transparent'
              }}
            />
            <p className="font-['Nunito',sans-serif] text-[#2F3E46] text-3xl flex-1">
              {statement}
            </p>
          </div>
        ))}
      </div>
    </SlideLayout>
  );
}
