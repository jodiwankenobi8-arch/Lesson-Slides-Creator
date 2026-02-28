import { Slide } from '../types';

interface SlideRendererProps {
  slide: Slide;
}

export function SlideRenderer({ slide }: SlideRendererProps) {
  const renderSlide = () => {
    switch (slide.type) {
      case 'title':
        return (
          <div 
            className="size-full flex flex-col items-center justify-center text-white p-12"
            style={{ backgroundColor: slide.background || '#4F46E5' }}
          >
            <h1 className="text-6xl font-bold mb-6 text-center">{slide.title}</h1>
            {slide.subtitle && (
              <p className="text-3xl mb-4 text-center opacity-90">{slide.subtitle}</p>
            )}
            {slide.content && (
              <p className="text-xl opacity-75 text-center">{slide.content}</p>
            )}
          </div>
        );

      case 'objectives':
        return (
          <div className="size-full flex flex-col p-12 bg-white">
            <h2 className="text-5xl font-bold mb-6" style={{ color: 'var(--ao-text)' }}>{slide.title}</h2>
            {slide.content && (
              <p className="text-2xl mb-8" style={{ color: 'var(--ao-muted)' }}>{slide.content}</p>
            )}
            {slide.items && (
              <ul className="space-y-4">
                {slide.items.map((item, idx) => (
                  <li key={idx} className="flex items-start text-xl" style={{ color: 'var(--ao-text)' }}>
                    <span className="inline-flex items-center justify-center size-8 rounded-full text-white font-bold mr-4 mt-1 flex-shrink-0" style={{ backgroundColor: 'var(--ao-navy)' }}>
                      {idx + 1}
                    </span>
                    <span className="flex-1 pt-1">{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );

      case 'vocabulary':
        return (
          <div className="size-full flex flex-col p-12" style={{ background: 'linear-gradient(to bottom right, var(--ao-cream), var(--ao-white))' }}>
            <h2 className="text-5xl font-bold mb-6" style={{ color: 'var(--ao-navy)' }}>{slide.title}</h2>
            {slide.content && (
              <p className="text-2xl mb-8" style={{ color: 'var(--ao-muted)' }}>{slide.content}</p>
            )}
            {slide.items && (
              <div className="space-y-6">
                {slide.items.map((item, idx) => {
                  const [term, definition] = item.split(' - ');
                  return (
                    <div key={idx} className="bg-white rounded-lg p-6 shadow-sm border" style={{ borderColor: 'var(--ao-sky)' }}>
                      <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--ao-navy)' }}>{term}</h3>
                      <p className="text-xl" style={{ color: 'var(--ao-text)' }}>{definition}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );

      case 'content':
        return (
          <div className="size-full flex flex-col p-12 bg-white">
            <h2 className="text-5xl font-bold mb-6" style={{ color: 'var(--ao-text)' }}>{slide.title}</h2>
            {slide.content && (
              <p className="text-2xl mb-8" style={{ color: 'var(--ao-muted)' }}>{slide.content}</p>
            )}
            {slide.items && (
              <ul className="space-y-6">
                {slide.items.map((item, idx) => (
                  <li key={idx} className="text-2xl p-6 rounded-lg border-l-4" style={{ backgroundColor: 'var(--ao-cream)', borderColor: 'var(--ao-navy)', color: 'var(--ao-text)' }}>
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );

      case 'reading':
        return (
          <div className="size-full flex flex-col p-12" style={{ backgroundColor: 'var(--ao-cream)' }}>
            <h2 className="text-5xl font-bold mb-6" style={{ color: 'var(--ao-text)' }}>{slide.title}</h2>
            {slide.subtitle && (
              <p className="text-xl mb-6 italic" style={{ color: 'var(--ao-text)' }}>{slide.subtitle}</p>
            )}
            <div className="flex-1 bg-white rounded-lg p-8 shadow-sm border" style={{ borderColor: 'var(--ao-tan)' }}>
              <p className="text-xl leading-relaxed" style={{ color: 'var(--ao-text)' }}>{slide.content}</p>
            </div>
          </div>
        );

      case 'discussion':
        return (
          <div className="size-full flex flex-col p-12" style={{ background: 'linear-gradient(to bottom right, var(--ao-cream), var(--ao-white))' }}>
            <h2 className="text-5xl font-bold mb-6" style={{ color: 'var(--ao-text)' }}>{slide.title}</h2>
            {slide.content && (
              <p className="text-2xl mb-8" style={{ color: 'var(--ao-muted)' }}>{slide.content}</p>
            )}
            {slide.items && (
              <div className="space-y-5">
                {slide.items.map((item, idx) => (
                  <div key={idx} className="flex items-start">
                    <span className="text-4xl mr-4" style={{ color: 'var(--ao-green)' }}>💬</span>
                    <p className="text-xl pt-2" style={{ color: 'var(--ao-text)' }}>{item}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'activity':
        return (
          <div className="size-full flex flex-col p-12" style={{ background: 'linear-gradient(to bottom right, var(--ao-cream), var(--ao-white))' }}>
            <h2 className="text-5xl font-bold mb-6" style={{ color: 'var(--ao-navy)' }}>{slide.title}</h2>
            {slide.subtitle && (
              <div className="text-white text-xl px-6 py-3 rounded-lg mb-6 inline-block self-start" style={{ backgroundColor: 'var(--ao-red)' }}>
                {slide.subtitle}
              </div>
            )}
            {slide.content && (
              <p className="text-2xl mb-8 font-semibold" style={{ color: 'var(--ao-text)' }}>{slide.content}</p>
            )}
            {slide.items && (
              <ul className="space-y-4">
                {slide.items.map((item, idx) => (
                  <li key={idx} className="flex items-start text-xl" style={{ color: 'var(--ao-text)' }}>
                    <span className="inline-flex items-center justify-center size-8 rounded-full text-white font-bold mr-4 mt-1 flex-shrink-0" style={{ backgroundColor: 'var(--ao-red)' }}>
                      {idx + 1}
                    </span>
                    <span className="flex-1 pt-1">{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );

      case 'summary':
        return (
          <div className="size-full flex flex-col p-12" style={{ background: 'linear-gradient(to bottom right, var(--ao-cream), var(--ao-white))' }}>
            <h2 className="text-5xl font-bold mb-6" style={{ color: 'var(--ao-text)' }}>{slide.title}</h2>
            {slide.content && (
              <p className="text-2xl mb-8" style={{ color: 'var(--ao-muted)' }}>{slide.content}</p>
            )}
            {slide.items && (
              <div className="space-y-6">
                {slide.items.map((item, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-6 shadow-sm border-l-4" style={{ borderColor: 'var(--ao-red)' }}>
                    <p className="text-xl" style={{ color: 'var(--ao-text)' }}>{item}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="size-full flex items-center justify-center" style={{ backgroundColor: 'var(--ao-cream)' }}>
            <p className="text-2xl" style={{ color: 'var(--ao-muted)' }}>Unknown slide type</p>
          </div>
        );
    }
  };

  return (
    <div className="size-full bg-white rounded-lg shadow-xl overflow-hidden">
      {renderSlide()}
    </div>
  );
}