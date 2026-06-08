import { requireTmdbToken } from '@/lib/env';
import { fetchWithBackoff, getCached, isCircuitOpen, setCache } from '@/lib/cache';
import type { TmdbConfiguration, TmdbListResponse, TmdbMovieResult } from './types';
import { setCachedConfiguration, setGenreMaps } from './config';

const TMDB_BASE = 'https://api.themoviedb.org/3';

const TTL = {
  config: 86400,
  lists: 900,
  search: 300,
  details: 3600,
};

export async function tmdbFetch<T>(
  path: string,
  params: Record<string, string> = {},
  ttlSeconds = TTL.lists
): Promise<T> {
  const cacheKey = `tmdb:${path}:${JSON.stringify(params)}`;
  const cached = getCached<T>(cacheKey);
  if (cached) return cached;

  if (isCircuitOpen()) {
    throw new Error('TMDB circuit breaker open');
  }

  const qs = new URLSearchParams(params).toString();
  const url = `${TMDB_BASE}/${path}${qs ? `?${qs}` : ''}`;

  const res = await fetchWithBackoff(url, {
    headers: {
      Authorization: `Bearer ${requireTmdbToken()}`,
      Accept: 'application/json',
    },
    next: { revalidate: ttlSeconds },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`TMDB ${res.status}: ${err}`);
  }

  const data = (await res.json()) as T;
  setCache(cacheKey, data, ttlSeconds);
  return data;
}

export async function bootstrapTmdbConfig() {
  const cached = getCached<TmdbConfiguration>('tmdb:configuration');
  if (cached) {
    setCachedConfiguration(cached);
    return;
  }

  const [config, movieGenres, tvGenres] = await Promise.all([
    tmdbFetch<TmdbConfiguration>('configuration', {}, TTL.config),
    tmdbFetch<{ genres: { id: number; name: string }[] }>('genre/movie/list', {}, TTL.config),
    tmdbFetch<{ genres: { id: number; name: string }[] }>('genre/tv/list', {}, TTL.config),
  ]);

  setCachedConfiguration(config);
  setGenreMaps(movieGenres.genres, tvGenres.genres);
  setCache('tmdb:configuration', config, TTL.config);
}

export async function getTrending(
  mediaType: 'movie' | 'tv',
  window: 'day' | 'week' = 'week'
): Promise<TmdbMovieResult[]> {
  const data = await tmdbFetch<TmdbListResponse<TmdbMovieResult>>(
    `trending/${mediaType}/${window}`,
    { language: 'en-US' },
    TTL.lists
  );
  return data.results;
}

export async function getPopular(mediaType: 'movie' | 'tv'): Promise<TmdbMovieResult[]> {
  const data = await tmdbFetch<TmdbListResponse<TmdbMovieResult>>(
    `${mediaType}/popular`,
    { language: 'en-US' },
    TTL.lists
  );
  return data.results;
}

export async function searchMulti(query: string, page = 1): Promise<TmdbMovieResult[]> {
  const data = await tmdbFetch<TmdbListResponse<TmdbMovieResult>>(
    'search/multi',
    { query, page: String(page), language: 'en-US', include_adult: 'false' },
    TTL.search
  );
  return data.results.filter((r) => r.media_type === 'movie' || r.media_type === 'tv' || r.title || r.name);
}

export async function discoverMedia(
  mediaType: 'movie' | 'tv',
  opts: { genreId?: number; page?: number } = {}
): Promise<TmdbMovieResult[]> {
  const params: Record<string, string> = {
    language: 'en-US',
    sort_by: 'popularity.desc',
    page: String(opts.page ?? 1),
  };
  if (opts.genreId) params.with_genres = String(opts.genreId);

  const data = await tmdbFetch<TmdbListResponse<TmdbMovieResult>>(
    `discover/${mediaType}`,
    params,
    TTL.lists
  );
  return data.results;
}
