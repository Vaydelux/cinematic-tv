'use client';

import { motion, type Variants } from 'motion/react';
import { MovieCard } from '@/components/MovieCard';
import { useWatchlist } from '@/hooks/useWatchlist';
import { Bookmark } from 'lucide-react';
import type { MediaItem } from '@/lib/types';

const VIEW_EASE = [0.16, 1, 0.3, 1] as const;

const viewVariants = {
  hidden: { opacity: 0, scale: 0.98, filter: 'blur(8px)', y: 20 },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)', y: 0, transition: { duration: 0.5, ease: VIEW_EASE } },
  exit: { opacity: 0, scale: 0.98, filter: 'blur(8px)', y: -20, transition: { duration: 0.4, ease: VIEW_EASE } },
} satisfies Variants;

export function ListView() {
  const { items } = useWatchlist();

  const mediaItems: MediaItem[] = items.map((e) => ({
    id: `${e.source}-${e.mediaType}-${e.tmdbId ?? e.anilistId}`,
    source: e.source as 'tmdb' | 'anilist',
    tmdbId: e.tmdbId,
    anilistId: e.anilistId,
    mediaType: e.mediaType as MediaItem['mediaType'],
    title: e.title,
    meta: 'In your list',
    image: e.posterPath,
  }));

  return (
    <motion.div variants={viewVariants} initial={false} animate="visible" exit="exit" className="mx-auto min-w-0 max-w-7xl px-4 py-6 sm:px-5 sm:py-8 md:px-10 md:py-12">
      <div className="mb-8 flex min-w-0 items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Saved titles</p>
          <h1 className="font-display text-3xl font-bold sm:text-4xl md:text-5xl">Your Watchlist</h1>
        </div>
        <div className="hidden sm:block rounded-md border border-white/10 bg-white/[0.06] px-3 py-2 text-xs text-on-surface-variant">
          {mediaItems.length} saved
        </div>
      </div>
      {mediaItems.length === 0 ? (
        <div className="cinema-panel cinema-ring flex min-h-[320px] flex-col items-center justify-center rounded-lg p-5 text-center sm:p-8">
          <Bookmark className="mb-4 h-10 w-10 text-primary" />
          <h2 className="font-display text-2xl font-bold">No saved titles</h2>
          <p className="mt-2 max-w-sm text-sm text-on-surface-variant">Add titles from any detail page and they will appear here.</p>
        </div>
      ) : (
        <div className="grid min-w-0 grid-cols-1 gap-4 pb-24 min-[540px]:grid-cols-2 md:gap-5 xl:grid-cols-3 2xl:grid-cols-4">
          {mediaItems.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              className="!min-w-0"
              layoutIdPrefix="list-"
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
