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
  const visualSrc = movie.backdrop ?? movie.image;
  const hasBackdrop = Boolean(movie.backdrop);
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
      className={`group relative aspect-[16/9] w-full min-w-0 cursor-pointer overflow-hidden rounded-xl bg-surface-container shadow-lg ring-1 ring-white/10 transition-all duration-300 ease-out md:[@media(hover:hover)_and_(pointer:fine)]:hover:z-20 md:[@media(hover:hover)_and_(pointer:fine)]:hover:scale-[1.035] md:[@media(hover:hover)_and_(pointer:fine)]:hover:shadow-[0_18px_46px_rgba(0,0,0,0.62),inset_0_0_0_1px_rgba(255,255,255,0.16)] ${className}`}
      onMouseEnter={() => {
        setHovered(true);
        setHoveredMovie(movie);
      }}
      onMouseLeave={() => {
        setHovered(false);
        setHoveredMovie(null);
      }}
    >
      {hasBackdrop ? (
        <Image
          src={visualSrc}
          alt={movie.title}
          fill
          className={`object-cover transition-all duration-500 ease-out md:[@media(hover:hover)_and_(pointer:fine)]:group-hover:scale-105 ${trailerKey ? 'opacity-0' : 'opacity-100'}`}
          sizes="(max-width: 768px) 280px, 320px"
        />
      ) : (
        <>
          <Image
            src={visualSrc}
            alt=""
            fill
            aria-hidden
            className={`scale-110 object-cover opacity-45 blur-md transition-transform duration-500 ease-out md:[@media(hover:hover)_and_(pointer:fine)]:group-hover:scale-[1.15] ${trailerKey ? 'opacity-0' : ''}`}
            sizes="(max-width: 768px) 280px, 320px"
          />
          <div className="absolute inset-0 bg-black/25" />
          <Image
            src={movie.image}
            alt={movie.title}
            fill
            className={`object-contain p-2 drop-shadow-2xl transition-all duration-500 ease-out md:[@media(hover:hover)_and_(pointer:fine)]:group-hover:scale-[1.04] ${trailerKey ? 'opacity-0' : 'opacity-100'}`}
            sizes="(max-width: 768px) 280px, 320px"
          />
        </>
      )}
      {trailerKey && (
        <div className="absolute inset-0 z-[1] bg-black">
          <TrailerEmbed
            trailerKey={trailerKey}
            title={movie.title}
            className="scale-[1.18]"
          />
        </div>
      )}

      {movie.source === 'anilist' && (
        <span className="absolute top-2 left-2 z-20 px-2 py-0.5 bg-primary/90 text-white text-[10px] font-bold rounded uppercase">
          Anime
        </span>
      )}

      <div
        className="absolute inset-0 z-10 bg-gradient-to-t from-black/95 via-black/35 to-transparent opacity-85 shadow-[inset_0_-110px_90px_rgba(0,0,0,0.78)] transition-opacity duration-300 md:opacity-0 md:[@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-100"
      />

      <div className="absolute inset-x-0 bottom-0 z-20 flex max-h-full flex-col justify-end overflow-hidden p-3 transition-all duration-300 sm:p-4 md:translate-y-3 md:opacity-0 md:[@media(hover:hover)_and_(pointer:fine)]:group-hover:translate-y-0 md:[@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-100">
        <div className="mb-3 flex items-center gap-2">
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
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/55 bg-black/35 text-white shadow-lg backdrop-blur transition hover:border-white hover:bg-black/55 active:scale-95"
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
            className="ml-auto flex h-9 w-9 items-center justify-center rounded-full border border-white/45 bg-black/35 text-white shadow-lg backdrop-blur transition hover:border-white hover:bg-black/55 active:scale-95"
            aria-label="More info"
          >
            <Info className="h-4 w-4" />
          </button>
        </div>
        <h3 className="font-display font-bold text-white truncate drop-shadow-md mb-1">{movie.title}</h3>
        <p className="font-body text-xs text-white/65 line-clamp-1">{movie.meta}</p>

        {showProgress && movie.progress !== undefined && (
          <div className="mt-2 w-full h-1 bg-surface-variant rounded-full overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${movie.progress}%` }} />
          </div>
        )}
      </div>
    </motion.div>
  );
});
