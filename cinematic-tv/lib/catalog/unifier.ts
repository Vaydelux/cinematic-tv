import type { MediaItem } from '@/lib/types';
import { mapTmdbToMediaItem } from '@/lib/tmdb/mappers';
import { mapAnilistToMediaItem } from '@/lib/anilist/mappers';
import type { TmdbMovieResult } from '@/lib/tmdb/types';
import type { AniListMedia } from '@/lib/anilist/types';

export function normalizeTmdbList(results: TmdbMovieResult[]): MediaItem[] {
  return results.map((r) => mapTmdbToMediaItem(r));
}

export function normalizeAnilistList(results: AniListMedia[]): MediaItem[] {
  return results.map((r) => mapAnilistToMediaItem(r));
}

export function dedupeSearchResults(items: MediaItem[]): MediaItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.tmdbId
      ? `tmdb-${item.tmdbId}`
      : item.anilistId
        ? `anilist-${item.anilistId}`
        : item.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function getWatchPath(item: MediaItem): string {
  const source = item.source;
  const type = item.mediaType;
  const id = item.source === 'anilist' ? item.anilistId : item.tmdbId;
  if (!id) return '/';
  const base = `/watch/${source}/${type}/${id}`;
  if (type === 'tv' || type === 'anime') {
    const s = item.season ?? 1;
    const e = item.episode ?? 1;
    return `${base}?season=${s}&episode=${e}`;
  }
  return base;
}
