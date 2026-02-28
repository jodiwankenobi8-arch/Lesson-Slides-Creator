import { TimerWidget } from '../components/TimerWidget';
import type { TurnAndTalkContent } from '../../types/slides';

interface TurnAndTalkSlideProps {
  content: TurnAndTalkContent;
}

export function TurnAndTalkSlide({ content }: TurnAndTalkSlideProps) {
  return (
    <div className="turn-and-talk-slide flex flex-col h-full p-12">
      <h2 className="text-5xl font-bold mb-8 text-center">
        🗣️ Turn and Talk
      </h2>
      
      <div className="flex-1 flex flex-col items-center justify-center gap-12">
        <div className="max-w-3xl text-center">
          <div className="text-4xl font-semibold mb-6 p-8 bg-white rounded-2xl shadow-lg">
            {content.prompt}
          </div>
          
          {content.partnerPrompt && (
            <div className="text-2xl text-gray-700 mt-4">
              {content.partnerPrompt}
            </div>
          )}
        </div>
        
        <TimerWidget durationSeconds={content.timerSeconds} />
      </div>
    </div>
  );
}
