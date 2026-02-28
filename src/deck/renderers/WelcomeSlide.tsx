import type { WelcomeContent } from '../../types/slides';

interface WelcomeSlideProps {
  content: WelcomeContent;
}

export function WelcomeSlide({ content }: WelcomeSlideProps) {
  return (
    <div className="welcome-slide flex flex-col items-center justify-center h-full text-center px-8">
      <h1 className="text-6xl font-bold mb-6">
        {content.title}
      </h1>
      
      {content.subtitle && (
        <p className="text-3xl text-gray-700">
          {content.subtitle}
        </p>
      )}
      
      {content.backgroundImage && (
        <div className="absolute inset-0 -z-10 opacity-20">
          <img
            src={content.backgroundImage}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      )}
    </div>
  );
}
