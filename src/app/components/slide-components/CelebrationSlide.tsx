import { SlideLayout } from './SlideLayout';

export function CelebrationSlide() {
  return (
    <SlideLayout type="welcome" showWaves={true}>
      <div className="flex flex-col items-center gap-8">
        <div className="text-9xl mb-4 animate-bounce">
          🎉
        </div>
        
        <h1 className="font-['Poppins',sans-serif] font-bold text-[#2F3E46] text-8xl text-center leading-tight">
          Amazing Work, Readers!
        </h1>
        
        <p className="font-['Nunito',sans-serif] text-[#6FA8DC] text-5xl text-center">
          You did it!
        </p>
        
        <div className="flex gap-8 mt-8 text-7xl">
          <span className="animate-pulse" style={{ animationDelay: '0ms' }}>⭐</span>
          <span className="animate-pulse" style={{ animationDelay: '200ms' }}>⭐</span>
          <span className="animate-pulse" style={{ animationDelay: '400ms' }}>⭐</span>
        </div>
      </div>
    </SlideLayout>
  );
}
