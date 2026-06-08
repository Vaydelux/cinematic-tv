'use client';

import { Movie } from '@/lib/types';
import Image from 'next/image';
import { useState, useContext, memo } from 'react';
import { motion } from 'motion/react';
import { MovieContext } from '@/lib/context';

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
  const [isHovered, setIsHovered] = useState(false);
  const { setActiveMovie, setHoveredMovie } = useContext(MovieContext);
  const finalLayoutId = `${layoutIdPrefix}movie-${movie.id}`;

  return (
    <motion.div
      layoutId={finalLayoutId}
      onClick={() => setActiveMovie({ ...movie, matchedLayoutId: finalLayoutId })}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          setActiveMovie({ ...movie, matchedLayoutId: finalLayoutId });
        }
      }}
      className={`relative aspect-[16/9] min-w-[280px] md:min-w-[320px] rounded-lg overflow-hidden bg-surface-container group cursor-pointer transition-transform duration-300 hover:scale-[1.03] hover:z-10 shadow-lg hover:shadow-2xl ring-1 ring-white/10 ${className}`}
      onMouseEnter={() => {
        setIsHovered(true);
        setHoveredMovie(movie);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        setHoveredMovie(null);
      }}
    >
      <Image
        src={movie.image}
        alt={movie.title}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 280px, 320px"
      />

      {movie.source === 'anilist' && (
        <span className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-primary/90 text-white text-[10px] font-bold rounded uppercase">
          Anime
        </span>
      )}

      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-80 md:opacity-0'
        }`}
      />

      <div
        className={`absolute inset-x-0 bottom-0 p-4 flex flex-col justify-end transition-all duration-300 ${
          isHovered ? 'opacity-100 translate-y-0' : 'md:opacity-0 md:translate-y-4'
        }`}
      >
        <h3 className="font-display font-bold text-white truncate drop-shadow-md mb-1">{movie.title}</h3>
        <p className="font-body text-xs text-on-surface-variant line-clamp-1">{movie.meta}</p>

        {showProgress && movie.progress !== undefined && (
          <div className="mt-2 w-full h-1 bg-surface-variant rounded-full overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${movie.progress}%` }} />
          </div>
        )}
      </div>
    </motion.div>
  );
});
