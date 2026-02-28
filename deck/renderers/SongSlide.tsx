import { YouTubeEmbed } from '../components/YouTubeEmbed';
import type { SongContent } from '../../types/slides';

interface SongSlideProps {
  content: SongContent;
}

export function SongSlide({ content }: SongSlideProps) {
  return (
    <div className="song-slide flex flex-col h-full p-12">
      <h2 className="text-5xl font-bold mb-8 text-center">
        🎵 {content.title}
      </h2>
      
      <div className="flex-1 flex flex-col items-center justify-center">
        {content.youtubeUrl ? (
          <YouTubeEmbed url={content.youtubeUrl} title={content.title} />
        ) : (
          <div className="text-center">
            <div className="text-8xl mb-6">🎵</div>
            <div className="text-3xl font-semibold">{content.title}</div>
            {content.lyrics && (
              <div className="mt-8 text-xl whitespace-pre-wrap max-w-2xl">
                {content.lyrics}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
