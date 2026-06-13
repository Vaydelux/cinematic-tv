'use client';

import { useCallback, useContext, useEffect, useRef, useState, type MouseEvent } from 'react';
import { AnimatePresence, motion, type Variants } from 'motion/react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { AlertCircle, Info, Play, RefreshCw } from 'lucide-react';
import { ContentRail } from '@/components/ContentRail';
import { fetchAnilist, fetchTmdb, useCatalogQuery } from '@/hooks/useCatalogQuery';
import { useContinueWatching } from '@/hooks/useContinueWatching';
import { getCatalogGenre } from '@/lib/catalog/genres';
import { getWatchPath } from '@/lib/catalog/unifier';
import { dedupeSearchResults } from '@/lib/catalog/unifier';
import { getUserSettings } from '@/lib/user-settings';
import { MovieContext } from '@/lib/context';
import { mapAnilistToMediaItem } from '@/lib/anilist/mappers';
import { mapTmdbToMediaItem } from '@/lib/tmdb/mappers';
import type { MediaItem } from '@/lib/types';
import type { AniListMediaResponse, AniListPageResponse } from '@/lib/anilist/types';
import type { TmdbListResponse, TmdbMovieDetails, TmdbMovieResult, TmdbTvDetails } from '@/lib/tmdb/types';

const VIEW_EASE = [0.16, 1, 0.3, 1] as const;

const viewVariants = {
  hidden: { opacity: 0, scale: 0.98, filter: 'blur(8px)', y: 20 },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)', y: 0, transition: { duration: 0.5, ease: VIEW_EASE } },
  exit: { opacity: 0, scale: 0.98, filter: 'blur(8px)', y: -20, transition: { duration: 0.4, ease: VIEW_EASE } },
} satisfies Variants;

const HERO_HEIGHT =
  'h-[70vh] min-h-[460px] max-h-[760px] sm:min-h-[540px] md:h-[80vh] md:min-h-[600px] md:max-h-[880px]';

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

type RailKey = Exclude<keyof HomeData['rails'], 'continueWatching'>;

type RailState = {
  items: MediaItem[];
  page: number;
  hasMore: boolean;
  loadingMore: boolean;
};

type DiscoverResponse = {
  items: MediaItem[];
  hasMore: boolean;
  nextPage?: number | null;
};

const SERVER_RAILS: { key: RailKey; title: string; prefix: string }[] = [
  { key: 'trendingToday', title: 'Trending Today', prefix: 'today-' },
  { key: 'trendingMovies', title: 'Trending Movies', prefix: 'tm-' },
  { key: 'trendingTv', title: 'Trending TV', prefix: 'tt-' },
  { key: 'popularMovies', title: 'Popular Movies', prefix: 'pm-' },
  { key: 'popularTv', title: 'Popular TV', prefix: 'pt-' },
  { key: 'trendingAnime', title: 'Trending Anime', prefix: 'anime-t-' },
  { key: 'popularAnime', title: 'Popular Anime', prefix: 'anime-p-' },
  { key: 'topRatedAnime', title: 'Top Rated Anime', prefix: 'anime-top-' },
  { key: 'airingAnime', title: 'Currently Airing', prefix: 'anime-air-' },
];
const GENRE_SENTINEL_AFTER_RAILS = 5;
const INITIAL_HOME_GENRE_RAILS = 4;
const HOME_GENRE_RAIL_BATCH = 2;

function makeRailState(items: MediaItem[] = []): RailState {
  return { items, page: 1, hasMore: items.length > 0, loadingMore: false };
}

export function HomeView() {
  const router = useRouter();
  const { setActiveMovie } = useContext(MovieContext);
  const [heroPreview, setHeroPreview] = useState<MediaItem | null>(null);
  const [railStates, setRailStates] = useState<Record<string, RailState>>({});
  const [showGenreRails, setShowGenreRails] = useState(false);
  const [visibleGenreRailCount, setVisibleGenreRailCount] = useState(INITIAL_HOME_GENRE_RAILS);
  const genreSentinelRef = useRef<HTMLDivElement>(null);
  const genreBatchSentinelRef = useRef<HTMLDivElement>(null);
  const genreBatchScrollRef = useRef(0);
  const initializedGenreRailsRef = useRef(new Set<string>());
  const railLoadingKeysRef = useRef(new Set<string>());
  const hoverDescriptionCacheRef = useRef(new Map<string, string | undefined>());
  const { items: cwItems } = useContinueWatching();
  const [settings] = useState(() => getUserSettings());
  const homeQuery = new URLSearchParams({
    source: settings.contentSource,
    adult: String(settings.showAdult),
  }).toString();

  const { data, loading, error } = useCatalogQuery<HomeData>(`home:${homeQuery}`, async () => {
    const res = await fetch(`/api/home?${homeQuery}`);
    if (!res.ok) throw new Error('Failed to load home');
    return res.json();
  });

  useEffect(() => {
    if (!data) return;
    setRailStates((current) => {
      const next = { ...current };
      SERVER_RAILS.forEach((rail) => {
        next[rail.key] = makeRailState(data.rails[rail.key]);
      });
      return next;
    });
  }, [data]);

  useEffect(() => {
    const sentinel = genreSentinelRef.current;
    if (!sentinel || showGenreRails || settings.homeGenreIds.length === 0) return undefined;
    const scrollRoot = sentinel.closest('main');
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setShowGenreRails(true);
      },
      { root: scrollRoot, rootMargin: '800px 0px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [data, settings.homeGenreIds.length, showGenreRails]);

  const setRailLoading = useCallback((key: string, loadingMore: boolean) => {
    setRailStates((current) => ({
      ...current,
      [key]: { ...(current[key] ?? makeRailState()), loadingMore },
    }));
  }, []);

  const appendRailItems = useCallback((key: string, items: MediaItem[], page: number, hasMore: boolean) => {
    setRailStates((current) => {
      const existing = current[key] ?? makeRailState();
      return {
        ...current,
        [key]: {
          items: dedupeSearchResults([...existing.items, ...items]),
          page,
          hasMore,
          loadingMore: false,
        },
      };
    });
  }, []);

  const loadMoreServerRail = useCallback(
    async (key: RailKey) => {
      const state = railStates[key];
      if (!state || state.loadingMore || !state.hasMore) return;
      if (railLoadingKeysRef.current.has(key)) return;
      const nextPage = state.page + 1;
      railLoadingKeysRef.current.add(key);
      setRailLoading(key, true);
      try {
        let items: MediaItem[] = [];
        let hasMore = false;

        if (key === 'trendingToday' || key === 'trendingMovies' || key === 'trendingTv') {
          const mediaType = key === 'trendingTv' ? 'tv' : 'movie';
          const window = key === 'trendingToday' ? 'day' : 'week';
          const data = await fetchTmdb<TmdbListResponse<TmdbMovieResult>>(`trending/${mediaType}/${window}`, {
            page: String(nextPage),
            language: 'en-US',
          });
          items = data.results.map((item) => mapTmdbToMediaItem({ ...item, media_type: mediaType }));
          hasMore = nextPage < data.total_pages;
        } else if (key === 'popularMovies' || key === 'popularTv') {
          const mediaType = key === 'popularMovies' ? 'movie' : 'tv';
          const data = await fetchTmdb<TmdbListResponse<TmdbMovieResult>>(`${mediaType}/popular`, {
            page: String(nextPage),
            language: 'en-US',
          });
          items = data.results.map((item) => mapTmdbToMediaItem({ ...item, media_type: mediaType }));
          hasMore = nextPage < data.total_pages;
        } else {
          const operation =
            key === 'trendingAnime'
              ? 'trendingAnime'
              : key === 'popularAnime'
                ? 'popularAnime'
                : key === 'topRatedAnime'
                  ? 'topRatedAnime'
                  : 'airingAnime';
          const data = await fetchAnilist<AniListPageResponse>(operation, {
            page: nextPage,
            perPage: 20,
            isAdult: settings.showAdult,
          });
          items = (data.Page?.media ?? []).map((item) => mapAnilistToMediaItem(item));
          hasMore = Boolean(data.Page?.pageInfo?.hasNextPage);
        }

        appendRailItems(key, items, nextPage, hasMore && items.length > 0);
      } catch {
        appendRailItems(key, [], nextPage, false);
      } finally {
        railLoadingKeysRef.current.delete(key);
      }
    },
    [appendRailItems, railStates, setRailLoading, settings.showAdult]
  );

  const loadMoreGenreRail = useCallback(
    async (genreId: string) => {
      const key = `genre:${genreId}`;
      const state = railStates[key] ?? makeRailState();
      if (state.loadingMore || (!state.hasMore && state.items.length > 0)) return;
      if (railLoadingKeysRef.current.has(key)) return;
      const nextPage = state.items.length ? state.page + 1 : 1;
      railLoadingKeysRef.current.add(key);
      setRailLoading(key, true);
      try {
        const qs = new URLSearchParams({
          source: settings.contentSource,
          genre: genreId,
          sort: 'popular',
          page: String(nextPage),
          adult: String(settings.showAdult),
        });
        const res = await fetch(`/api/discover?${qs}`);
        if (!res.ok) throw new Error('Failed to load genre rail');
        const data = (await res.json()) as DiscoverResponse;
        appendRailItems(key, data.items, nextPage, data.hasMore && data.items.length > 0);
      } catch {
        appendRailItems(key, [], nextPage, false);
      } finally {
        railLoadingKeysRef.current.delete(key);
      }
    },
    [appendRailItems, railStates, setRailLoading, settings.contentSource, settings.showAdult]
  );

  useEffect(() => {
    if (!showGenreRails) return;
    settings.homeGenreIds.slice(0, visibleGenreRailCount).forEach((genreId) => {
      const key = `genre:${genreId}`;
      if (!railStates[key] && !initializedGenreRailsRef.current.has(key)) {
        initializedGenreRailsRef.current.add(key);
        setRailStates((current) => ({ ...current, [key]: makeRailState() }));
        loadMoreGenreRail(genreId);
      }
    });
  }, [loadMoreGenreRail, railStates, settings.homeGenreIds, showGenreRails, visibleGenreRailCount]);

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
  const mediaCacheKey = useCallback((item: MediaItem) => `${item.source}:${item.mediaType}:${item.tmdbId ?? item.anilistId ?? item.id}`, []);
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
  const leadingServerRails = SERVER_RAILS.slice(0, GENRE_SENTINEL_AFTER_RAILS);
  const trailingServerRails = SERVER_RAILS.slice(GENRE_SENTINEL_AFTER_RAILS);
  const visibleHomeGenreIds = showGenreRails
    ? settings.homeGenreIds.slice(0, visibleGenreRailCount)
    : [];

  useEffect(() => {
    if (!heroPreview || heroPreview.description) return undefined;
    const key = mediaCacheKey(heroPreview);
    if (hoverDescriptionCacheRef.current.has(key)) {
      const cachedDescription = hoverDescriptionCacheRef.current.get(key);
      if (cachedDescription) {
        setHeroPreview((current) => (current && mediaCacheKey(current) === key ? { ...current, description: cachedDescription } : current));
      }
      return undefined;
    }

    const timer = window.setTimeout(async () => {
      let description: string | undefined;
      try {
        if (heroPreview.source === 'tmdb' && heroPreview.tmdbId) {
          if (heroPreview.mediaType === 'movie') {
            const detail = await fetchTmdb<TmdbMovieDetails>(`movie/${heroPreview.tmdbId}`, { language: 'en-US' });
            description = detail.overview || undefined;
          } else if (heroPreview.mediaType === 'tv') {
            const detail = await fetchTmdb<TmdbTvDetails>(`tv/${heroPreview.tmdbId}`, { language: 'en-US' });
            description = detail.overview || undefined;
          }
        } else if (heroPreview.source === 'anilist' && heroPreview.anilistId) {
          const detail = await fetchAnilist<AniListMediaResponse>('mediaById', { id: heroPreview.anilistId });
          description = detail.Media ? mapAnilistToMediaItem(detail.Media).description : undefined;
        }
      } catch {
        description = undefined;
      }

      hoverDescriptionCacheRef.current.set(key, description);
      if (description) {
        setHeroPreview((current) => (current && mediaCacheKey(current) === key ? { ...current, description } : current));
      }
    }, 550);

    return () => window.clearTimeout(timer);
  }, [heroPreview, mediaCacheKey]);

  useEffect(() => {
    if (showGenreRails || settings.homeGenreIds.length === 0) return;
    if (data && !hasServerRails) setShowGenreRails(true);
  }, [data, hasServerRails, settings.homeGenreIds.length, showGenreRails]);

  useEffect(() => {
    if (!data || showGenreRails || settings.homeGenreIds.length === 0) return undefined;
    const scrollRoot = document.querySelector('main');
    if (!scrollRoot) return undefined;
    const activateOnScroll = () => {
      if (scrollRoot.scrollTop > 700) setShowGenreRails(true);
    };
    activateOnScroll();
    scrollRoot.addEventListener('scroll', activateOnScroll, { passive: true });
    return () => scrollRoot.removeEventListener('scroll', activateOnScroll);
  }, [data, settings.homeGenreIds.length, showGenreRails]);

  useEffect(() => {
    if (!showGenreRails || visibleGenreRailCount >= settings.homeGenreIds.length) return undefined;
    const sentinel = genreBatchSentinelRef.current;
    if (!sentinel) return undefined;
    const scrollRoot = sentinel.closest('main');
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        const scrollTop = scrollRoot?.scrollTop ?? 0;
        if (Math.abs(scrollTop - genreBatchScrollRef.current) < 300) return;
        genreBatchScrollRef.current = scrollTop;
        setVisibleGenreRailCount((count) =>
          Math.min(count + HOME_GENRE_RAIL_BATCH, settings.homeGenreIds.length)
        );
      },
      { root: scrollRoot, rootMargin: '700px 0px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [settings.homeGenreIds.length, showGenreRails, visibleGenreRailCount]);

  const renderServerRail = (rail: (typeof SERVER_RAILS)[number]) => {
    const state = railStates[rail.key] ?? makeRailState(data?.rails[rail.key]);
    return (
      <ContentRail
        key={rail.key}
        title={rail.title}
        items={state.items}
        prefix={rail.prefix}
        onItemHover={handleItemHover}
        onEndReached={() => loadMoreServerRail(rail.key)}
        loadingMore={state.loadingMore}
        hasMore={state.hasMore}
      />
    );
  };

  if (loading) {
    return (
      <motion.div variants={viewVariants} initial={false} animate="visible" exit="exit" className="w-full min-h-screen px-4 py-6 sm:px-6 sm:py-8 md:px-16 md:py-10">
        <div className="h-[56vh] min-h-[380px] rounded-2xl bg-surface-container animate-pulse cinema-ring sm:min-h-[460px]" />
        <div className="mt-8 space-y-5">
          {[1, 2, 3].map((row) => (
            <div key={row}>
              <div className="h-6 w-48 rounded bg-surface-container animate-pulse mb-3" />
              <div className="flex gap-2 overflow-hidden">
                {[1, 2, 3, 4].map((tile) => (
                  <div key={tile} className="h-32 w-64 shrink-0 rounded-xl bg-surface-container animate-pulse" />
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
        <div className="premium-panel max-w-md rounded-2xl p-6 text-center">
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
    <motion.div variants={viewVariants} initial={false} animate="visible" exit="exit" className="relative w-full min-h-screen min-w-0 overflow-x-hidden bg-transparent pb-28">
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
                className="object-cover"
                sizes="100vw"
                priority={!isHoverPreview}
                loading="eager"
              />
              <div className="hero-top-scrim absolute inset-0" />
              <div className="hero-side-scrim absolute inset-0" />
              <div className="hero-accent-gradient absolute inset-0 opacity-70" />
              <div className="hero-bottom-scrim absolute inset-x-0 bottom-0 h-48" />
            </motion.div>
          </AnimatePresence>

          <section className="absolute inset-x-0 bottom-0 flex items-end px-4 pb-12 sm:px-6 sm:pb-16 md:px-16 md:pb-24">
            <AnimatePresence mode="wait">
              <motion.div
                key={displayHero.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="relative flex min-w-0 max-w-4xl flex-col gap-3 sm:gap-4"
              >
                <div className="flex flex-wrap gap-2 text-[11px] md:text-xs font-bold tracking-widest uppercase text-white/70">
                  {!isHoverPreview && (
                    <span className="rounded-full bg-primary px-3 py-1 text-primary-contrast shadow-lg shadow-black/30">Featured</span>
                  )}
                  {displayHero.genres?.slice(0, 3).map((genre) => (
                    <span key={genre} className="rounded border border-white/[0.15] bg-white/[0.08] px-2 py-1">
                      {genre}
                    </span>
                  ))}
                </div>
                <h1 className="max-w-4xl break-words font-display text-3xl font-black leading-[0.95] tracking-tight text-white drop-shadow-2xl min-[420px]:text-4xl sm:text-5xl md:text-7xl">
                  {displayHero.title}
                </h1>
                <div className="flex flex-wrap gap-2 text-xs font-bold text-white/75">
                  <span className="rounded-full border border-white/15 bg-white/[0.08] px-3 py-1">{displayHero.meta}</span>
                  {displayHero.voteAverage != null && (
                    <span className="rounded-full border border-white/15 bg-white/[0.08] px-3 py-1">{displayHero.voteAverage.toFixed(1)} rating</span>
                  )}
                </div>
                {displayHero.description && (
                  <p className="hidden md:block max-w-2xl text-sm leading-6 text-white/[0.72] line-clamp-3">
                    {displayHero.description}
                  </p>
                )}
                <div className="pointer-events-auto mt-2 flex flex-wrap items-center gap-2 sm:mt-4 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => router.push(getWatchPath(displayHero))}
                    className="flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-black text-black shadow-xl transition hover:bg-white/90 active:scale-95 sm:px-7 sm:py-3"
                  >
                    <Play className="w-5 h-5 fill-current" /> Play
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMovie({ ...displayHero, matchedLayoutId: `hero-${displayHero.id}` })}
                    className="flex items-center gap-2 rounded-lg border border-white/15 bg-black/45 px-4 py-2.5 text-sm font-black text-white shadow-xl backdrop-blur transition hover:bg-black/60 active:scale-95 sm:px-7 sm:py-3"
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
        {leadingServerRails.map(renderServerRail)}
        <div ref={genreSentinelRef} className="h-1" aria-hidden />
        {trailingServerRails.map(renderServerRail)}
        {visibleHomeGenreIds.map((genreId) => {
            const genre = getCatalogGenre(genreId);
            if (!genre) return null;
            const key = `genre:${genreId}`;
            const state = railStates[key] ?? makeRailState();
            return (
              <ContentRail
                key={key}
                title={`${genre.name} Picks`}
                items={state.items}
                prefix={`${key}-`}
                onItemHover={handleItemHover}
                onEndReached={() => loadMoreGenreRail(genreId)}
                loadingMore={state.loadingMore}
                hasMore={state.hasMore}
              />
            );
          })}
        {showGenreRails && visibleGenreRailCount < settings.homeGenreIds.length && (
          <div ref={genreBatchSentinelRef} className="h-1" aria-hidden />
        )}
      </div>
    </motion.div>
  );
}
