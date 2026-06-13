'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, type Variants } from 'motion/react';
import { Film, Loader2, Tags } from 'lucide-react';
import { MovieCard } from '@/components/MovieCard';
import { CATALOG_GENRES } from '@/lib/catalog/genres';
import { dedupeSearchResults } from '@/lib/catalog/unifier';
import { getUserSettings } from '@/lib/user-settings';
import type { MediaItem } from '@/lib/types';

const VIEW_EASE = [0.16, 1, 0.3, 1] as const;

const viewVariants = {
  hidden: { opacity: 0, scale: 0.98, filter: 'blur(8px)', y: 20 },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)', y: 0, transition: { duration: 0.5, ease: VIEW_EASE } },
  exit: { opacity: 0, scale: 0.98, filter: 'blur(8px)', y: -20, transition: { duration: 0.4, ease: VIEW_EASE } },
} satisfies Variants;

type DiscoverSort = 'latest' | 'popular' | 'top-rated';

type DiscoverResponse = {
  items: MediaItem[];
  hasMore: boolean;
  nextPage?: number | null;
};

const SORTS: { id: DiscoverSort; label: string }[] = [
  { id: 'popular', label: 'Popular' },
  { id: 'latest', label: 'Latest' },
  { id: 'top-rated', label: 'Top Rated' },
];

export function GenreView() {
  const settings = getUserSettings();
  const [selectedGenre, setSelectedGenre] = useState(CATALOG_GENRES[0]?.id ?? 'action');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'tmdb' | 'anilist'>(settings.contentSource);
  const [sort, setSort] = useState<DiscoverSort>('popular');
  const [items, setItems] = useState<MediaItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const fetchPage = useCallback(
    async (nextPage: number, append: boolean) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);
      try {
        const qs = new URLSearchParams({
          source: sourceFilter,
          genre: selectedGenre,
          sort,
          page: String(nextPage),
          adult: String(settings.showAdult),
        });
        const res = await fetch(`/api/discover?${qs}`);
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          throw new Error((payload as { error?: string }).error ?? `Discovery failed (${res.status})`);
        }
        const data = (await res.json()) as DiscoverResponse;
        setItems((current) => (append ? dedupeSearchResults([...current, ...data.items]) : data.items));
        setHasMore(data.hasMore);
        setPage(data.nextPage ? data.nextPage - 1 : nextPage);
      } catch (nextError) {
        if (!append) setItems([]);
        setError(nextError instanceof Error ? nextError.message : 'Discovery failed');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [selectedGenre, settings.showAdult, sort, sourceFilter]
  );

  const loadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore) return;
    fetchPage(page + 1, true);
  }, [fetchPage, hasMore, loading, loadingMore, page]);

  useEffect(() => {
    fetchPage(1, false);
  }, [fetchPage]);

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: '600px 0px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <motion.div variants={viewVariants} initial={false} animate="visible" exit="exit" className="mx-auto min-w-0 max-w-7xl px-4 py-6 sm:px-5 sm:py-8 md:px-10 md:py-12">
      <div className="mb-6 flex min-w-0 flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Catalog</p>
          <h1 className="font-display text-3xl font-bold text-on-surface sm:text-4xl md:text-5xl">Genres</h1>
        </div>
        <div className="hidden sm:flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.06] px-3 py-2 text-xs text-on-surface-variant">
          <Tags className="h-4 w-4 text-primary" />
          {CATALOG_GENRES.find((genre) => genre.id === selectedGenre)?.name ?? 'Genre'}
        </div>
      </div>

      <div className="cinema-panel cinema-ring mb-8 min-w-0 rounded-lg p-4 md:p-5">
        <div className="flex min-w-0 gap-2 overflow-x-auto pb-1 hide-scrollbar">
          {(['all', 'tmdb', 'anilist'] as const).map((source) => (
            <button
              key={source}
              type="button"
              onClick={() => setSourceFilter(source)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                sourceFilter === source ? 'bg-primary text-white' : 'bg-white/[0.06] text-on-surface-variant hover:bg-white/10'
              }`}
            >
              {source === 'all' ? 'All' : source === 'tmdb' ? 'Movies & TV' : 'Anime'}
            </button>
          ))}
        </div>

        <div className="mt-3 flex min-w-0 gap-2 overflow-x-auto pb-1 hide-scrollbar">
          {SORTS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSort(item.id)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                sort === item.id ? 'bg-white text-black' : 'bg-white/[0.06] text-on-surface-variant hover:bg-white/10'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-3 flex min-w-0 gap-2 overflow-x-auto pb-1 hide-scrollbar sm:flex-wrap sm:overflow-visible">
          {CATALOG_GENRES.map((genre) => (
            <button
              key={genre.id}
              type="button"
              onClick={() => setSelectedGenre(genre.id)}
              className={`shrink-0 rounded-md px-3 py-2 text-xs font-bold uppercase tracking-wide transition ${
                selectedGenre === genre.id ? 'bg-primary text-primary-contrast' : 'bg-white/[0.06] text-on-surface-variant hover:bg-white/10'
              }`}
            >
              {genre.name}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-on-surface">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      <div className="grid min-w-0 grid-cols-2 gap-3 pb-24 min-[520px]:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {!loading && items.length > 0 && (
          <div className="col-span-full mb-1 flex items-center gap-3">
            <span className="h-5 w-1 rounded-full bg-primary" />
            <h2 className="font-display text-xl font-bold tracking-tight text-on-surface md:text-2xl">
              {SORTS.find((item) => item.id === sort)?.label} {CATALOG_GENRES.find((genre) => genre.id === selectedGenre)?.name}
            </h2>
          </div>
        )}
        {items.map((movie) => (
          <MovieCard key={`genre-${movie.id}`} movie={movie} className="!min-w-0" layoutIdPrefix="genre-" />
        ))}
        {!loading && items.length === 0 && (
          <div className="col-span-full pt-16 text-center text-on-surface-variant">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-white/[0.06]">
              <Film className="h-6 w-6" />
            </div>
            No titles found for this genre.
          </div>
        )}
        {items.length > 0 && (
          <div ref={loadMoreRef} className="col-span-full flex min-h-20 items-center justify-center py-6">
            {loadingMore && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
          </div>
        )}
      </div>
    </motion.div>
  );
}
