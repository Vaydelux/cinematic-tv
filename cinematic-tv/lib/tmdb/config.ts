import type { TmdbConfiguration, TmdbGenre } from './types';

const DEFAULT_BASE = 'https://image.tmdb.org/t/p/';
export const MEDIA_PLACEHOLDER = '/media-placeholder.svg';

let cachedConfig: TmdbConfiguration | null = null;
const movieGenres = new Map<number, string>();
const tvGenres = new Map<number, string>();

export function setCachedConfiguration(config: TmdbConfiguration) {
  cachedConfig = config;
}

export function setGenreMaps(movies: TmdbGenre[], tv: TmdbGenre[]) {
  movies.forEach((g) => movieGenres.set(g.id, g.name));
  tv.forEach((g) => tvGenres.set(g.id, g.name));
}

export function getImageBaseUrl(): string {
  return cachedConfig?.images.secure_base_url ?? DEFAULT_BASE;
}

export function buildImageUrl(
  path: string | null | undefined,
  size: 'w154' | 'w342' | 'w500' | 'w780' | 'original' = 'w500'
): string {
  if (!path) return MEDIA_PLACEHOLDER;
  return `${getImageBaseUrl()}${size}${path}`;
}

export function resolveGenreNames(ids: number[] | undefined, mediaType: 'movie' | 'tv'): string[] {
  if (!ids?.length) return [];
  const map = mediaType === 'movie' ? movieGenres : tvGenres;
  return ids.map((id) => map.get(id)).filter(Boolean) as string[];
}

export function resolveGenreId(name: string, mediaType: 'movie' | 'tv'): number | undefined {
  const map = mediaType === 'movie' ? movieGenres : tvGenres;
  for (const [id, genreName] of map.entries()) {
    if (genreName.toLowerCase() === name.toLowerCase()) return id;
  }
  return undefined;
}

export function getMovieGenres() {
  return Array.from(movieGenres.entries()).map(([id, name]) => ({ id, name }));
}

export function getTvGenres() {
  return Array.from(tvGenres.entries()).map(([id, name]) => ({ id, name }));
}
