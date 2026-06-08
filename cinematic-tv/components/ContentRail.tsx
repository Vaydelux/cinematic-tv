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
};

export function ContentRail({ title, items, prefix, showProgress, embedded, onItemHover }: Props) {
  const pad = embedded ? 'px-0' : 'px-5 md:px-16';
  const scrollPad = embedded ? 'pl-0' : 'pl-5 md:pl-16';
  const endPad = embedded ? 'pr-0' : 'pr-5 md:pr-16';
  const arrowL = embedded ? 'left-0' : 'left-2 md:left-8';
  const arrowR = embedded ? 'right-0' : 'right-2 md:right-8';
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const [hovered, setHovered] = useState(false);

  const updateArrows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanLeft(scrollLeft > 8);
    setCanRight(scrollLeft < scrollWidth - clientWidth - 8);
  }, []);

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
      className="relative mb-4 min-w-0 group/rail"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className={`mb-3 flex items-center gap-3 ${pad}`}>
        <span className="h-5 w-1 rounded-full bg-primary" />
        <h2 className="font-display text-xl font-bold tracking-tight text-on-surface md:text-2xl">{title}</h2>
      </div>

      {/* Expansion zone leaves headroom for hover growth. */}
      <div className="relative">
        <div
          className={`pointer-events-none absolute left-0 top-0 bottom-0 w-14 md:w-24 z-30 bg-gradient-to-r from-background via-background/80 to-transparent transition-opacity duration-300 ${
            canLeft && hovered ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <div
          className={`pointer-events-none absolute right-0 top-0 bottom-0 w-14 md:w-24 z-30 bg-gradient-to-l from-background via-background/80 to-transparent transition-opacity duration-300 ${
            canRight && hovered ? 'opacity-100' : 'opacity-0'
          }`}
        />

        <button
          type="button"
          onClick={() => scroll('left')}
          aria-label={`Scroll ${title} left`}
          className={`absolute ${arrowL} top-[calc(50%+40px)] -translate-y-1/2 z-40 flex items-center justify-center text-white transition-all duration-300 ${
            canLeft && hovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/75 shadow-xl backdrop-blur-sm hover:bg-black/90">
            <ChevronLeft className="w-6 h-6" />
          </span>
        </button>

        <button
          type="button"
          onClick={() => scroll('right')}
          aria-label={`Scroll ${title} right`}
          className={`absolute ${arrowR} top-[calc(50%+40px)] -translate-y-1/2 z-40 flex items-center justify-center text-white transition-all duration-300 ${
            canRight && hovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/75 shadow-xl backdrop-blur-sm hover:bg-black/90">
            <ChevronRight className="w-6 h-6" />
          </span>
        </button>

        <div
          ref={scrollRef}
          className={`min-w-0 overflow-x-auto overflow-y-visible hide-scrollbar scroll-smooth ${scrollPad}`}
          style={{ paddingTop: '7rem', paddingBottom: '1.5rem', marginTop: '-7rem' }}
        >
          <div className={`flex w-max gap-1.5 md:gap-2 ${endPad}`}>
            {items.map((movie, index) => (
              <NetflixTile
                key={`${prefix}-${movie.id}`}
                movie={movie}
                showProgress={showProgress}
                layoutIdPrefix={prefix}
                staggerIndex={index}
                onItemHover={onItemHover}
                compact={embedded}
                expandOnHover={!embedded}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
}
