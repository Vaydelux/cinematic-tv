'use client';

import { memo, useContext, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Plus, Info, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { MovieContext } from '@/lib/context';
import { getWatchPath } from '@/lib/catalog/unifier';
import { useWatchlist } from '@/hooks/useWatchlist';
import type { MediaItem } from '@/lib/types';

const HOVER_DELAY_MS = 400;

type Props = {
  movie: MediaItem;
  showProgress?: boolean;
  layoutIdPrefix?: string;
  staggerIndex?: number;
  onItemHover?: (item: MediaItem) => void;
};

export const NetflixTile = memo(function NetflixTile({
  movie,
  showProgress = false,
  layoutIdPrefix = '',
  staggerIndex = 0,
  onItemHover,
}: Props) {
  const router = useRouter();
  const { setActiveMovie } = useContext(MovieContext);
  const { toggle, isInList } = useWatchlist();
  const [expanded, setExpanded] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finalLayoutId = `${layoutIdPrefix}movie-${movie.id}`;
  const inList = isInList(movie);

  const clearHoverTimer = () => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
  };

  const handleEnter = () => {
    onItemHover?.(movie);
    clearHoverTimer();
    hoverTimer.current = setTimeout(() => setExpanded(true), HOVER_DELAY_MS);
  };

  const handleLeave = () => {
    clearHoverTimer();
    setExpanded(false);
  };

  useEffect(() => () => clearHoverTimer(), []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay: Math.min(staggerIndex * 0.035, 0.3), ease: [0.16, 1, 0.3, 1] }}
      className="relative aspect-video w-[46vw] min-w-[146px] max-w-[260px] shrink-0 overflow-visible md:h-[169px] md:w-[300px] md:max-w-none"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {/* Expanded card overlays neighbors while the rail keeps a fixed footprint. */}
      <motion.div
        layoutId={finalLayoutId}
        animate={{
          width: expanded ? '115%' : '100%',
          x: expanded ? '-7.5%' : '0%',
          y: expanded ? -12 : 0,
        }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className={`absolute bottom-0 left-0 cursor-pointer ${expanded ? 'z-[60]' : 'z-0'}`}
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
          className={`rounded-md overflow-hidden bg-[#181818] ${
            expanded ? 'shadow-[0_8px_32px_rgba(0,0,0,0.7)] ring-1 ring-white/[0.12]' : 'shadow-md ring-1 ring-white/5'
          }`}
        >
          <div className="relative aspect-[16/9] w-full">
            <Image
              src={movie.image}
              alt={movie.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 260px, 300px"
            />
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

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="px-3 py-3 overflow-hidden"
              >
                <p className="font-display font-bold text-white text-sm leading-tight truncate">
                  {movie.title}
                </p>
                <p className="text-[11px] text-white/50 truncate mt-1">{movie.meta}</p>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(getWatchPath(movie));
                    }}
                    className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:bg-white/90 transition shrink-0"
                    aria-label="Play"
                  >
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggle(movie);
                    }}
                    className="w-8 h-8 rounded-full border-2 border-white/50 text-white flex items-center justify-center hover:border-white transition shrink-0"
                    aria-label={inList ? 'Remove from list' : 'Add to list'}
                  >
                    {inList ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMovie({ ...movie, matchedLayoutId: finalLayoutId });
                    }}
                    className="w-8 h-8 rounded-full border-2 border-white/40 text-white/90 flex items-center justify-center hover:border-white transition shrink-0 ml-auto"
                    aria-label="More info"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
});
