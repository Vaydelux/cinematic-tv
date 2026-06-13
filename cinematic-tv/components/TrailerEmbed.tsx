'use client';

type Props = {
  trailerKey: string;
  title: string;
  interactive?: boolean;
  className?: string;
  showTitle?: boolean;
};

function trailerUrl(trailerKey: string, interactive: boolean) {
  const params = new URLSearchParams({
    autoplay: '1',
    mute: interactive ? '0' : '1',
    controls: interactive ? '1' : '0',
    playsinline: '1',
    rel: '0',
    modestbranding: '1',
    enablejsapi: '0',
  });

  if (!interactive) {
    params.set('loop', '1');
    params.set('playlist', trailerKey);
    params.set('disablekb', '1');
    params.set('fs', '0');
  }

  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(trailerKey)}?${params.toString()}`;
}

export function TrailerEmbed({ trailerKey, title, interactive = false, className = '', showTitle = true }: Props) {
  return (
    <div className={`relative h-full w-full overflow-hidden bg-black ${className}`}>
      {showTitle && (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-black/88 via-black/55 to-transparent px-3 pb-6 pt-2">
          <p className="truncate text-xs font-bold text-white drop-shadow sm:text-sm">{title} trailer</p>
        </div>
      )}
      <iframe
        className={`h-full w-full border-0 ${interactive ? '' : 'pointer-events-none'}`}
        src={trailerUrl(trailerKey, interactive)}
        title={`${title} trailer`}
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen={interactive}
        loading="lazy"
      />
    </div>
  );
}

