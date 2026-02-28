import { useState } from 'react';

interface YouTubeEmbedProps {
  url: string;
  title?: string;
}

export function YouTubeEmbed({ url, title = 'Video' }: YouTubeEmbedProps) {
  const [embedError, setEmbedError] = useState(false);

  // Extract video ID from YouTube URL
  const getVideoId = (youtubeUrl: string): string | null => {
    try {
      const urlObj = new URL(youtubeUrl);
      
      // Handle youtu.be short links
      if (urlObj.hostname === 'youtu.be') {
        return urlObj.pathname.slice(1);
      }
      
      // Handle youtube.com links
      if (urlObj.hostname.includes('youtube.com')) {
        return urlObj.searchParams.get('v');
      }
      
      return null;
    } catch {
      return null;
    }
  };

  const videoId = getVideoId(url);

  // Fallback to link if embed fails or no video ID
  if (!videoId || embedError) {
    return (
      <div className="youtube-fallback text-center">
        <div className="mb-4 text-xl">
          🎥 {title}
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-8 py-4 bg-red-600 text-white text-xl rounded-lg hover:bg-red-700 inline-block"
        >
          Open Video in YouTube
        </a>
        <div className="mt-4 text-sm text-gray-600">
          (Opens in new tab)
        </div>
      </div>
    );
  }

  const embedUrl = `https://www.youtube.com/embed/${videoId}`;

  return (
    <div className="youtube-embed">
      <div className="aspect-video w-full max-w-4xl mx-auto">
        <iframe
          src={embedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full rounded-lg"
          onError={() => setEmbedError(true)}
        />
      </div>
      <div className="mt-4 text-center">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
          style={{ color: 'var(--ao-navy)' }}
        >
          Watch on YouTube
        </a>
      </div>
    </div>
  );
}