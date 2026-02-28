import { SlideLayout } from './SlideLayout';

interface VideoSlideProps {
  title: string;
  subtitle?: string;
  videoUrl: string;
}

export function VideoSlide({ title, subtitle, videoUrl }: VideoSlideProps) {
  // Extract video ID from YouTube URL
  const getYouTubeEmbedUrl = (url: string) => {
    let videoId = '';
    
    // Handle different YouTube URL formats
    if (url.includes('youtube.com/watch?v=')) {
      videoId = url.split('v=')[1]?.split('&')[0] || '';
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
    } else if (url.includes('youtube.com/embed/')) {
      videoId = url.split('embed/')[1]?.split('?')[0] || '';
    }
    
    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : url;
  };

  const embedUrl = getYouTubeEmbedUrl(videoUrl);

  return (
    <SlideLayout 
      type="video"
      title={title}
      subtitle={subtitle}
    >
      <div className="w-full max-w-4xl">
        <div className="bg-[#CFE8E5] p-8 rounded-3xl shadow-lg">
          <iframe
            src={embedUrl}
            width="100%"
            height="450"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="rounded-2xl shadow-md"
          />
        </div>
      </div>
    </SlideLayout>
  );
}
