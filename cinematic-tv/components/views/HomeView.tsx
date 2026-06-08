'use client';

import { useCallback, useContext, useState, type MouseEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { AlertCircle, Info, Play, RefreshCw } from 'lucide-react';
import { ContentRail } from '@/components/ContentRail';
import { useCatalogQuery } from '@/hooks/useCatalogQuery';
import { useContinueWatching } from '@/hooks/useContinueWatching';
import { getWatchPath } from '@/lib/catalog/unifier';
import { getUserSettings } from '@/lib/user-settings';
import { MovieContext } from '@/lib/context';
import type { MediaItem } from '@/lib/types';

const viewVariants = {
  hidden: { opacity: 0, scale: 0.98, filter: 'blur(8px)', y: 20 },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)', y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, scale: 0.98, filter: 'blur(8px)', y: -20, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

const HERO_HEIGHT =
  'h-[72vh] min-h-[500px] max-h-[820px] sm:min-h-[540px] md:h-[76vh]';

type HomeData = {
  hero: MediaItem | null;
  rails: {
    continueWatching: MediaItem[];
    trendingToday: MediaItem[];
    trendingMovies: MediaItem[];
    trendingTv: MediaItem[];
    popularMovies: MediaItem[];
    popularTv: MediaItem[];
    trendingAnime: MediaItem[];
    popularAnime: MediaItem[];
    topRatedAnime: MediaItem[];
    airingAnime: MediaItem[];
  };
};

export function HomeView() {
  const router = useRouter();
  const { setActiveMovie } = useContext(MovieContext);
  const [heroPreview, setHeroPreview] = useState<MediaItem | null>(null);
  const { items: cwItems } = useContinueWatching();
  const settings = getUserSettings();
  const homeQuery = new URLSearchParams({
    source: settings.contentSource,
    adult: String(settings.showAdult),
  }).toString();

  const { data, loading, error } = useCatalogQuery<HomeData>(`home:${homeQuery}`, async () => {
    const res = await fetch(`/api/home?${homeQuery}`);
    if (!res.ok) throw new Error('Failed to load home');
    return res.json();
  });

  const cwMedia: MediaItem[] = cwItems.map((e) => ({
    id: `${e.source}-${e.mediaType}-${e.tmdbId ?? e.anilistId}`,
    source: e.source as 'tmdb' | 'anilist',
    tmdbId: e.tmdbId,
    anilistId: e.anilistId,
    mediaType: e.mediaType as MediaItem['mediaType'],
    title: e.title,
    meta: 'Continue Watching',
    image: e.posterPath,
    backdrop: e.backdropPath,
    season: e.season,
    episode: e.episode,
    progress: e.progressPercent ?? 0,
  }));

  const defaultHero = data?.hero;
  const displayHero = heroPreview ?? defaultHero;
  const isHoverPreview = heroPreview != null;
  const handleItemHover = useCallback((item: MediaItem | null) => {
    setHeroPreview(item);
  }, []);
  const handleRailsLeave = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      const next = event.relatedTarget;
      if (next instanceof Node && event.currentTarget.contains(next)) return;
      setHeroPreview(null);
    },
    [],
  );
  const hasServerRails =
    data &&
    Object.entries(data.rails).some(([key, items]) => key !== 'continueWatching' && items.length > 0);

  if (loading) {
    return (
      <motion.div variants={viewVariants} initial={false} animate="visible" exit="exit" className="w-full min-h-screen px-4 py-8 sm:px-6 md:px-16 md:py-10">
        <div className="h-[52vh] min-h-[360px] rounded-lg bg-surface-container animate-pulse cinema-ring sm:min-h-[440px]" />
        <div className="mt-8 space-y-5">
          {[1, 2, 3].map((row) => (
            <div key={row}>
              <div className="h-6 w-48 rounded bg-surface-container animate-pulse mb-3" />
              <div className="flex gap-2 overflow-hidden">
                {[1, 2, 3, 4].map((tile) => (
                  <div key={tile} className="h-32 w-64 shrink-0 rounded bg-surface-container animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div variants={viewVariants} initial={false} animate="visible" exit="exit" className="min-h-screen flex items-center justify-center p-4 sm:p-6">
        <div className="cinema-panel cinema-ring max-w-md rounded-lg p-6 text-center">
          <AlertCircle className="mx-auto mb-4 h-9 w-9 text-primary" />
          <h1 className="font-display text-2xl font-bold text-on-surface">Catalog unavailable</h1>
          <p className="mt-2 text-sm text-on-surface-variant">{error}</p>
          <p className="mt-1 text-sm text-on-surface-variant">Check provider keys and network access in Settings.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90"
          >
            <RefreshCw className="h-4 w-4" />
            Reload
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div variants={viewVariants} initial={false} animate="visible" exit="exit" className="relative w-full min-h-screen min-w-0 bg-transparent pb-24">
      {displayHero && (
        <div
          className={`pointer-events-none absolute inset-x-0 top-0 z-[1] ${HERO_HEIGHT} overflow-hidden`}
          aria-hidden={isHoverPreview}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={displayHero.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0"
            >
              <Image
                src={displayHero.backdrop ?? displayHero.image}
                alt=""
                fill
                className="object-cover scale-105"
                priority={!isHoverPreview}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-black/10" />
              <div className="absolute inset-0 bg-gradient-to-r from-background via-background/55 to-transparent opacity-90" />
              <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
            </motion.div>
          </AnimatePresence>

          <section className="absolute inset-x-0 bottom-0 flex items-end px-4 pb-14 sm:px-6 md:px-16 md:pb-20">
            <AnimatePresence mode="wait">
              <motion.div
                key={displayHero.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="relative max-w-3xl flex flex-col gap-4"
              >
                <div className="flex flex-wrap gap-2 text-[11px] md:text-xs font-bold tracking-widest uppercase text-white/70">
                  {!isHoverPreview && (
                    <span className="rounded bg-primary px-2 py-1 text-white">Featured</span>
                  )}
                  {displayHero.genres?.slice(0, 3).map((genre) => (
                    <span key={genre} className="rounded border border-white/[0.15] bg-white/[0.08] px-2 py-1">
                      {genre}
                    </span>
                  ))}
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-7xl font-display font-bold text-white drop-shadow-2xl tracking-tight leading-[0.98] break-words">
                  {displayHero.title}
                </h1>
                <p className="text-base md:text-lg text-on-surface-variant max-w-xl text-shadow">{displayHero.meta}</p>
                {displayHero.description && (
                  <p className="hidden md:block max-w-2xl text-sm leading-6 text-white/[0.72] line-clamp-3">
                    {displayHero.description}
                  </p>
                )}
                <div className="pointer-events-auto mt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => router.push(getWatchPath(displayHero))}
                    className="flex items-center gap-2 rounded-md bg-white px-4 py-2.5 text-sm font-bold text-black shadow-xl transition hover:bg-white/90 active:scale-95 sm:px-6 sm:py-3"
                  >
                    <Play className="w-5 h-5 fill-current" /> Play
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMovie({ ...displayHero, matchedLayoutId: `hero-${displayHero.id}` })}
                    className="flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.12] px-4 py-2.5 text-sm font-bold text-white shadow-xl backdrop-blur transition hover:bg-white/[0.18] active:scale-95 sm:px-6 sm:py-3"
                  >
                    <Info className="w-5 h-5" /> More Info
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </section>
        </div>
      )}

      {displayHero && <div className={`pointer-events-none ${HERO_HEIGHT}`} aria-hidden />}

      {!defaultHero && !hasServerRails && cwMedia.length === 0 && (
        <div className="relative z-[1] mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 text-center sm:px-6">
          <div className="mb-4 h-12 w-12 rounded-lg bg-primary/[0.15] flex items-center justify-center">
            <Info className="h-6 w-6 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Nothing to show yet</h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            Adjust content source settings or verify provider access to fill the catalog.
          </p>
        </div>
      )}

      <div
        className={`relative z-20 flex min-w-0 flex-col gap-5 ${displayHero ? 'mt-2 md:mt-4' : 'pt-10'}`}
        onMouseLeave={handleRailsLeave}
      >
        <ContentRail title="Continue Watching" items={cwMedia} prefix="cw-" showProgress onItemHover={handleItemHover} />
        <ContentRail title="Trending Today" items={data?.rails.trendingToday ?? []} prefix="today-" onItemHover={handleItemHover} />
        <ContentRail title="Trending Movies" items={data?.rails.trendingMovies ?? []} prefix="tm-" onItemHover={handleItemHover} />
        <ContentRail title="Trending TV" items={data?.rails.trendingTv ?? []} prefix="tt-" onItemHover={handleItemHover} />
        <ContentRail title="Popular Movies" items={data?.rails.popularMovies ?? []} prefix="pm-" onItemHover={handleItemHover} />
        <ContentRail title="Popular TV" items={data?.rails.popularTv ?? []} prefix="pt-" onItemHover={handleItemHover} />
        <ContentRail title="Trending Anime" items={data?.rails.trendingAnime ?? []} prefix="anime-t-" onItemHover={handleItemHover} />
        <ContentRail title="Popular Anime" items={data?.rails.popularAnime ?? []} prefix="anime-p-" onItemHover={handleItemHover} />
        <ContentRail title="Top Rated Anime" items={data?.rails.topRatedAnime ?? []} prefix="anime-top-" onItemHover={handleItemHover} />
        <ContentRail title="Currently Airing" items={data?.rails.airingAnime ?? []} prefix="anime-air-" onItemHover={handleItemHover} />
      </div>
    </motion.div>
  );
}
