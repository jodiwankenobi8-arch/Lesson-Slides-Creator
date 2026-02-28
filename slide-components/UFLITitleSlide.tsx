import { SlideLayout } from './SlideLayout';

interface UFLITitleSlideProps {
  lessonNumber: string;
  dayNumber: string;
  phoneticsConcept: string;
}

export function UFLITitleSlide({ lessonNumber, dayNumber, phoneticsConcept }: UFLITitleSlideProps) {
  return (
    <SlideLayout 
      title="UFLI Phonics Lesson"
      subtitle="Science of Reading Instruction"
    >
      <div className="flex flex-col items-center gap-8 max-w-3xl">
        <div className="bg-white p-12 rounded-3xl shadow-lg border-4 border-[#6FA8DC] w-full">
          <div className="flex flex-col gap-6 items-center">
            <div className="flex gap-8 text-center">
              <div className="flex-1">
                <p className="font-['Nunito',sans-serif] text-[#6FA8DC] text-2xl mb-2">
                  Lesson
                </p>
                <p className="font-['Poppins',sans-serif] font-bold text-[#2F3E46] text-6xl">
                  {lessonNumber}
                </p>
              </div>
              
              <div className="flex-1">
                <p className="font-['Nunito',sans-serif] text-[#6FA8DC] text-2xl mb-2">
                  Day
                </p>
                <p className="font-['Poppins',sans-serif] font-bold text-[#2F3E46] text-6xl">
                  {dayNumber}
                </p>
              </div>
            </div>
            
            <div className="h-1 w-32 bg-[#CFE8E5] rounded-full" />
            
            <div className="text-center">
              <p className="font-['Nunito',sans-serif] text-[#6FA8DC] text-2xl mb-2">
                Today's Focus
              </p>
              <p className="font-['Poppins',sans-serif] font-bold text-[#2F3E46] text-5xl">
                {phoneticsConcept}
              </p>
            </div>
          </div>
        </div>
      </div>
    </SlideLayout>
  );
}
