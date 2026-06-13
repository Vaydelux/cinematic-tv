'use client';

import { memo, useContext, useState } from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
import { Play, Plus, Info, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { MovieContext } from '@/lib/context';
import { getWatchPath } from '@/lib/catalog/unifier';
import { useWatchlist } from '@/hooks/useWatchlist';
import { useHoverTrailer } from '@/hooks/useHoverTrailer';
import { TrailerEmbed } from '@/components/TrailerEmbed';
import type { MediaItem } from '@/lib/types';

type Props = {
  movie: MediaItem;
  showProgress?: boolean;
  layoutIdPrefix?: string;
  staggerIndex?: number;
  onItemHover?: (item: MediaItem) => void;
  compact?: boolean;
};

export const NetflixTile = memo(function NetflixTile({
  movie,
  showProgress = false,
  layoutIdPrefix = '',
  onItemHover,
  compact = false,
}: Props) {
  const router = useRouter();
  const { setActiveMovie } = useContext(MovieContext);
  const { toggle, isInList } = useWatchlist();
  const [hovered, setHovered] = useState(false);
  const finalLayoutId = `${layoutIdPrefix}movie-${movie.id}`;
  const inList = isInList(movie);
  const trailerKey = useHoverTrailer(movie, hovered);

  const handleEnter = () => {
    setHovered(true);
    onItemHover?.(movie);
  };

  const handleLeave = () => {
    setHovered(false);
  };

  return (
    <div
      className="group relative min-w-0"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <motion.div
        layoutId={finalLayoutId}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full cursor-pointer"
        style={{ willChange: 'transform' }}
      >
        <div
          role="button"
          tabIndex={0}
          onClick={() => setActiveMovie({ ...movie, matchedLayoutId: finalLayoutId })}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              setActiveMovie({ ...movie, matchedLayoutId: finalLayoutId });
            }
          }}
          className="overflow-hidden rounded-lg bg-surface-container shadow-md ring-1 ring-white/10 transition-shadow duration-300 hover:shadow-[0_14px_36px_rgba(0,0,0,0.48)] hover:ring-white/20"
        >
          <div className="relative aspect-[2/3] w-full overflow-hidden bg-black">
            <Image
              src={movie.image}
              alt=""
              fill
              aria-hidden
              className={`scale-105 object-cover opacity-25 blur-sm transition-opacity duration-300 ${trailerKey ? 'opacity-0' : ''}`}
              sizes={compact ? '(max-width: 640px) 50vw, 180px' : '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 17vw'}
            />
            <Image
              src={movie.image}
              alt={movie.title}
              fill
              className={`object-contain transition-opacity duration-300 ${trailerKey ? 'opacity-0' : 'opacity-100'}`}
              sizes={compact ? '(max-width: 640px) 50vw, 180px' : '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 17vw'}
            />
            {trailerKey && (
              <div className="absolute inset-0 z-[1] bg-black">
                <TrailerEmbed
                  trailerKey={trailerKey}
                  title={movie.title}
                />
              </div>
            )}
            {movie.source === 'anilist' && (
              <span className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-primary/90 text-white text-[10px] font-bold rounded uppercase">
                Anime
              </span>
            )}
            {showProgress && movie.progress !== undefined && movie.progress > 0 && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-10">
                <div className="h-full bg-primary" style={{ width: `${movie.progress}%` }} />
              </div>
            )}
          </div>

          <div className="border-t border-white/10 bg-surface px-2.5 py-2.5">
            <p className="line-clamp-2 min-h-[2.25rem] font-display text-sm font-bold leading-tight text-on-surface">
              {movie.title}
            </p>
            <p className="mt-1 truncate text-[11px] text-on-surface-variant">{movie.meta}</p>
            <div className="mt-2 flex items-center gap-2 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(getWatchPath(movie));
                }}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-black transition hover:bg-white/90"
                aria-label="Play"
              >
                <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggle(movie);
                }}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/35 text-white transition hover:border-white"
                aria-label={inList ? 'Remove from list' : 'Add to list'}
              >
                {inList ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMovie({ ...movie, matchedLayoutId: finalLayoutId });
                }}
                className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/30 text-white/90 transition hover:border-white"
                aria-label="More info"
              >
                <Info className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
});
