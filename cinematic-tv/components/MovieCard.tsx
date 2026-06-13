'use client';

import { Movie } from '@/lib/types';
import Image from 'next/image';
import { useContext, memo, useState } from 'react';
import { motion } from 'motion/react';
import { Check, Info, Play, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { MovieContext } from '@/lib/context';
import { getWatchPath } from '@/lib/catalog/unifier';
import { useWatchlist } from '@/hooks/useWatchlist';
import { useHoverTrailer } from '@/hooks/useHoverTrailer';
import { TrailerEmbed } from '@/components/TrailerEmbed';

export const MovieCard = memo(function MovieCard({
  movie,
  showProgress = false,
  className = '',
  layoutIdPrefix = '',
}: {
  movie: Movie;
  showProgress?: boolean;
  className?: string;
  layoutIdPrefix?: string;
}) {
  const router = useRouter();
  const { setActiveMovie, setHoveredMovie } = useContext(MovieContext);
  const { toggle, isInList } = useWatchlist();
  const [hovered, setHovered] = useState(false);
  const finalLayoutId = `${layoutIdPrefix}movie-${movie.id}`;
  const inList = isInList(movie);
  const trailerKey = useHoverTrailer(movie, hovered);
  const openInfo = () => setActiveMovie({ ...movie, matchedLayoutId: finalLayoutId });

  return (
    <motion.div
      layoutId={finalLayoutId}
      onClick={openInfo}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openInfo();
        }
      }}
      className={`group relative w-full min-w-0 cursor-pointer overflow-hidden rounded-lg bg-surface-container shadow-lg ring-1 ring-white/10 transition-all duration-300 ease-out md:[@media(hover:hover)_and_(pointer:fine)]:hover:z-20 md:[@media(hover:hover)_and_(pointer:fine)]:hover:-translate-y-1 md:[@media(hover:hover)_and_(pointer:fine)]:hover:shadow-[0_18px_46px_rgba(0,0,0,0.58)] md:[@media(hover:hover)_and_(pointer:fine)]:hover:ring-white/20 ${className}`}
      onMouseEnter={() => {
        setHovered(true);
        setHoveredMovie(movie);
      }}
      onMouseLeave={() => {
        setHovered(false);
        setHoveredMovie(null);
      }}
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-black">
        <Image
          src={movie.image}
          alt=""
          fill
          aria-hidden
          className={`scale-110 object-cover opacity-35 blur-md transition-opacity duration-500 ease-out ${trailerKey ? 'opacity-0' : ''}`}
          sizes="(max-width: 640px) 46vw, (max-width: 1280px) 25vw, 220px"
        />
        <Image
          src={movie.image}
          alt={movie.title}
          fill
          className={`object-contain drop-shadow-2xl transition-opacity duration-500 ease-out ${trailerKey ? 'opacity-0' : 'opacity-100'}`}
          sizes="(max-width: 640px) 46vw, (max-width: 1280px) 25vw, 220px"
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
          <span className="absolute top-2 left-2 z-20 px-2 py-0.5 bg-primary/90 text-white text-[10px] font-bold rounded uppercase">
            Anime
          </span>
        )}

        <div
          className="absolute inset-x-0 bottom-0 z-10 h-20 bg-gradient-to-t from-black/82 via-black/30 to-transparent"
        />

        {showProgress && movie.progress !== undefined && (
          <div className="absolute bottom-0 left-0 right-0 z-20 h-1 bg-white/20">
            <div className="h-full bg-primary" style={{ width: `${movie.progress}%` }} />
          </div>
        )}
      </div>

      <div className="flex min-h-[118px] flex-col border-t border-white/10 bg-surface px-3 py-3">
        <h3 className="line-clamp-2 min-h-[2.5rem] font-display text-sm font-bold leading-tight text-on-surface sm:text-base">{movie.title}</h3>
        <p className="mt-1 truncate font-body text-xs text-on-surface-variant">{movie.meta}</p>

        <div className="mt-auto flex items-center gap-2 pt-3">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              router.push(getWatchPath(movie));
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black shadow-lg transition hover:bg-white/90 active:scale-95"
            aria-label="Play"
          >
            <Play className="h-4 w-4 fill-current ml-0.5" />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              toggle(movie);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/35 bg-white/[0.06] text-white shadow-lg transition hover:border-white hover:bg-white/10 active:scale-95"
            aria-label={inList ? 'Remove from list' : 'Add to list'}
          >
            {inList ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              openInfo();
            }}
            className="ml-auto flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-white/[0.06] text-white shadow-lg transition hover:border-white hover:bg-white/10 active:scale-95"
            aria-label="More info"
          >
            <Info className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
});
