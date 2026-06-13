'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
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
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || loadingMore || !onEndReached) return undefined;
    const scrollRoot = sentinel.closest('main');
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onEndReached();
      },
      { root: scrollRoot, rootMargin: '700px 0px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, onEndReached]);

  if (!items.length) return null;

  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.45 }}
      className="relative mb-7 min-w-0"
    >
      <div className={`mb-3 flex min-w-0 items-center gap-3 ${pad}`}>
        <span className="h-5 w-1 rounded-full bg-primary" />
        <h2 className="min-w-0 truncate font-display text-lg font-bold tracking-tight text-on-surface sm:text-xl md:text-2xl">{title}</h2>
      </div>

      <div
        className={`grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 ${pad}`}
      >
        {items.map((movie, index) => (
          <NetflixTile
            key={`${prefix}-${movie.id}`}
            movie={movie}
            showProgress={showProgress}
            layoutIdPrefix={prefix}
            staggerIndex={index}
            onItemHover={onItemHover}
            compact={embedded}
          />
        ))}
        {loadingMore && (
          <div className="flex min-h-[260px] items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
      </div>
      <div ref={sentinelRef} className="h-1" aria-hidden />
    </motion.section>
  );
}
