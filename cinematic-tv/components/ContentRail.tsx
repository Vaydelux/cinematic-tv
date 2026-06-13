'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { NetflixTile } from '@/components/NetflixTile';
import type { MediaItem } from '@/lib/types';

type Props = {
  title: string;
  items: MediaItem[];
  prefix: string;
  showProgress?: boolean;
  /** Tighter padding when nested inside detail modals */
  embedded?: boolean;
  onItemHover?: (item: MediaItem | null) => void;
  onEndReached?: () => void;
  loadingMore?: boolean;
  hasMore?: boolean;
};

export function ContentRail({
  title,
  items,
  prefix,
  showProgress,
  embedded,
  onItemHover,
  onEndReached,
  loadingMore,
  hasMore = false,
}: Props) {
  const pad = embedded ? 'px-0' : 'px-4 sm:px-5 md:px-16';
  const scrollPad = embedded ? 'pl-0' : 'pl-4 sm:pl-5 md:pl-16';
  const endPad = embedded ? 'pr-0' : 'pr-4 sm:pr-5 md:pr-16';
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateArrows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanLeft(scrollLeft > 8);
    setCanRight(scrollLeft < scrollWidth - clientWidth - 8);
    if (hasMore && !loadingMore && onEndReached && scrollLeft > scrollWidth - clientWidth - 360) {
      onEndReached();
    }
  }, [hasMore, loadingMore, onEndReached]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener('scroll', updateArrows, { passive: true });
    const ro = new ResizeObserver(updateArrows);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', updateArrows);
      ro.disconnect();
    };
  }, [items.length, updateArrows]);

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = Math.max(el.clientWidth * 0.75, 300);
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  if (!items.length) return null;

  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.45 }}
      className="relative mb-7 min-w-0 group/rail"
    >
      <div className={`mb-3 flex min-w-0 items-center gap-3 ${pad}`}>
        <span className="h-5 w-1 rounded-full bg-primary" />
        <h2 className="min-w-0 truncate font-display text-lg font-bold tracking-tight text-on-surface sm:text-xl md:text-2xl">{title}</h2>
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => scroll('left')}
          aria-label={`Scroll ${title} left`}
          className={`absolute left-0 top-0 bottom-0 z-40 flex w-12 items-center justify-center bg-gradient-to-r from-background via-background/80 to-transparent text-white transition-all duration-300 sm:w-16 md:w-20 ${
            canLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/75 shadow-xl backdrop-blur-sm transition hover:bg-black/90 sm:h-10 sm:w-10">
            <ChevronLeft className="h-5 w-5" />
          </span>
        </button>

        <button
          type="button"
          onClick={() => scroll('right')}
          aria-label={`Scroll ${title} right`}
          className={`absolute right-0 top-0 bottom-0 z-40 flex w-12 items-center justify-center bg-gradient-to-l from-background via-background/80 to-transparent text-white transition-all duration-300 sm:w-16 md:w-20 ${
            canRight ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/75 shadow-xl backdrop-blur-sm transition hover:bg-black/90 sm:h-10 sm:w-10">
            <ChevronRight className="h-5 w-5" />
          </span>
        </button>

        <div
          ref={scrollRef}
          className={`min-w-0 overflow-x-auto overflow-y-hidden hide-scrollbar scroll-smooth ${scrollPad}`}
          style={{ scrollPaddingLeft: embedded ? 0 : undefined }}
        >
          <div className={`flex w-max snap-x snap-mandatory gap-3 pb-2 md:gap-4 ${endPad}`}>
            {items.map((movie, index) => (
              <div key={`${prefix}-${movie.id}`} className="snap-start">
                <NetflixTile
                  movie={movie}
                  showProgress={showProgress}
                  layoutIdPrefix={prefix}
                  staggerIndex={index}
                  onItemHover={onItemHover}
                  compact={embedded}
                />
              </div>
            ))}
            {loadingMore && (
              <div className="flex h-[260px] w-24 shrink-0 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.section>
  );
}
