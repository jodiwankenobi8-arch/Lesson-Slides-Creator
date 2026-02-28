import { SlideLayout } from './SlideLayout';

interface SightWordSlideProps {
  word: string;
  showSpelling?: boolean;
}

export function SightWordSlide({ word, showSpelling = false }: SightWordSlideProps) {
  const letters = word.split('');

  if (showSpelling) {
    return (
      <SlideLayout 
        title={`Let's Spell: ${word}`}
        subtitle="Sound out each letter"
      >
        <div className="flex gap-8 items-center justify-center">
          {letters.map((letter, index) => (
            <div
              key={index}
              className="bg-white border-4 border-[#6FA8DC] rounded-2xl p-8 shadow-lg min-w-[100px] flex items-center justify-center"
            >
              <span className="font-['Poppins',sans-serif] font-bold text-[#2F3E46] text-8xl">
                {letter}
              </span>
            </div>
          ))}
        </div>
      </SlideLayout>
    );
  }

  return (
    <SlideLayout 
      title="Sight Word"
      subtitle="Read it fast!"
    >
      <div className="bg-white border-8 border-[#6FA8DC] rounded-3xl p-16 shadow-2xl">
        <p className="font-['Poppins',sans-serif] font-bold text-[#2F3E46] text-9xl">
          {word}
        </p>
      </div>
    </SlideLayout>
  );
}
