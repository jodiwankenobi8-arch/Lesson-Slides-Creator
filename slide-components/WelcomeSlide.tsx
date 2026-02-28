import { SlideLayout } from './SlideLayout';
import birdImage from "figma:asset/3c5f456ff361271f7d99297678004fcd37902fc2.png";

interface WelcomeSlideProps {
  date?: string;
}

export function WelcomeSlide({ date }: WelcomeSlideProps) {
  return (
    <SlideLayout type="welcome">
      <div className="flex flex-col items-center gap-6">
        {/* Reading Bird Mascot */}
        <img 
          src={birdImage} 
          alt="Reading bird mascot" 
          className="w-48 h-48 object-contain"
        />
        
        {/* Welcome Message */}
        <h1 className="font-['Poppins',sans-serif] font-medium text-[#2F3E46] text-7xl text-center leading-tight">
          Welcome Readers!
        </h1>
        
        <p className="font-['Nunito',sans-serif] text-[#6FA8DC] text-4xl text-center">
          Get your brain ready to learn!
        </p>
        
        {date && (
          <p className="font-['Nunito',sans-serif] text-[#2F3E46] text-2xl mt-4">
            {date}
          </p>
        )}
      </div>
    </SlideLayout>
  );
}
