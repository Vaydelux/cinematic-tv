'use client';

import { memo, useContext, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Plus, Info, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { MovieContext } from '@/lib/context';
import { getWatchPath } from '@/lib/catalog/unifier';
import { useWatchlist } from '@/hooks/useWatchlist';
import { useHoverTrailer } from '@/hooks/useHoverTrailer';
import { TrailerEmbed } from '@/components/TrailerEmbed';
import type { MediaItem } from '@/lib/types';

const HOVER_DELAY_MS = 400;

type Props = {
  movie: MediaItem;
  showProgress?: boolean;
  layoutIdPrefix?: string;
  staggerIndex?: number;
  onItemHover?: (item: MediaItem) => void;
  compact?: boolean;
  expandOnHover?: boolean;
};

export const NetflixTile = memo(function NetflixTile({
  movie,
  showProgress = false,
  layoutIdPrefix = '',
  staggerIndex = 0,
  onItemHover,
  compact = false,
  expandOnHover = true,
}: Props) {
  const router = useRouter();
  const { setActiveMovie } = useContext(MovieContext);
  const { toggle, isInList } = useWatchlist();
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finalLayoutId = `${layoutIdPrefix}movie-${movie.id}`;
  const inList = isInList(movie);
  const trailerKey = useHoverTrailer(movie, hovered);

  const clearHoverTimer = () => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
  };

  const handleEnter = () => {
    setHovered(true);
    onItemHover?.(movie);
    if (!expandOnHover || window.innerWidth < 768) return;
    clearHoverTimer();
    hoverTimer.current = setTimeout(() => setExpanded(true), HOVER_DELAY_MS);
  };

  const handleLeave = () => {
    setHovered(false);
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
      whileHover={compact ? { y: -4, scale: 1.015 } : undefined}
      className={`group relative aspect-video shrink-0 overflow-visible ${
        compact
          ? 'w-[62vw] min-w-[220px] max-w-[320px] sm:w-[300px] md:h-[160px] md:w-[284px]'
          : 'w-[48vw] min-w-[158px] max-w-[280px] md:h-[178px] md:w-[316px] md:max-w-none'
      }`}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {/* Expanded card overlays neighbors while the rail keeps a fixed footprint. */}
      <motion.div
        layoutId={finalLayoutId}
        animate={{
          x: expanded ? '-7.5%' : '0%',
          y: expanded ? -12 : 0,
          scale: expanded ? 1.12 : 1,
        }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className={`absolute bottom-0 left-0 w-full origin-bottom cursor-pointer ${expanded ? 'z-[60]' : 'z-0'}`}
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
          className={`overflow-hidden rounded-xl bg-[#181818] transition-shadow duration-300 ${
            expanded ? 'shadow-[0_18px_48px_rgba(0,0,0,0.72)] ring-1 ring-white/[0.16]' : 'shadow-md ring-1 ring-white/5'
          }`}
        >
          <div className="relative aspect-[16/9] w-full">
            <Image
              src={movie.image}
              alt={movie.title}
              fill
              className={`object-cover transition-opacity duration-300 ${trailerKey ? 'opacity-0' : 'opacity-100'}`}
              sizes="(max-width: 768px) 280px, 316px"
            />
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
              <span className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-primary/90 text-white text-[10px] font-bold rounded uppercase">
                Anime
              </span>
            )}
            {!expanded && (
              <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-3 opacity-100 transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100">
                <p className="truncate font-display text-sm font-bold text-white drop-shadow">{movie.title}</p>
              </div>
            )}
            {showProgress && movie.progress !== undefined && movie.progress > 0 && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-10">
                <div className="h-full bg-primary" style={{ width: `${movie.progress}%` }} />
              </div>
            )}
          </div>

          <AnimatePresence>
            {expanded && !compact && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden border-t border-white/10 bg-[#151515] px-3 py-3"
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
