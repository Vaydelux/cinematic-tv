'use client';

import { useEffect, useState } from 'react';
import { fetchAnilist, fetchTmdb } from '@/hooks/useCatalogQuery';
import type { AniListMediaResponse } from '@/lib/anilist/types';
import type { MediaItem } from '@/lib/types';
import type { TmdbVideo } from '@/lib/tmdb/types';

const HOVER_TRAILER_DELAY_MS = 650;

type TmdbVideosResponse = {
  results?: TmdbVideo[];
};

const trailerCache = new Map<string, string | undefined>();
const trailerInflight = new Map<string, Promise<string | undefined>>();

function mediaCacheKey(item: MediaItem) {
  return `${item.source}:${item.mediaType}:${item.tmdbId ?? item.anilistId ?? item.id}`;
}

function pickTmdbTrailer(videos?: TmdbVideo[]) {
  if (!videos?.length) return undefined;
  const trailer = videos.find((video) => video.site === 'YouTube' && video.type === 'Trailer');
  const teaser = videos.find((video) => video.site === 'YouTube' && video.type === 'Teaser');
  return (trailer ?? teaser)?.key;
}

function pickAniListTrailer(data: AniListMediaResponse) {
  const trailer = data.Media?.trailer;
  if (!trailer || trailer.site !== 'youtube') return undefined;
  return trailer.id || undefined;
}

async function resolveTrailerKey(item: MediaItem) {
  const key = mediaCacheKey(item);
  if (trailerCache.has(key)) return trailerCache.get(key);
  const inflight = trailerInflight.get(key);
  if (inflight) return inflight;

  const promise = (async () => {
    let trailerKey: string | undefined;
    if (item.trailerKey) {
      trailerKey = item.trailerKey;
    } else if (item.source === 'tmdb' && item.tmdbId && (item.mediaType === 'movie' || item.mediaType === 'tv')) {
      const data = await fetchTmdb<TmdbVideosResponse>(`${item.mediaType}/${item.tmdbId}/videos`, {
        language: 'en-US',
      });
      trailerKey = pickTmdbTrailer(data.results);
    } else if (item.source === 'anilist' && item.anilistId) {
      const data = await fetchAnilist<AniListMediaResponse>('mediaById', { id: item.anilistId });
      trailerKey = pickAniListTrailer(data);
    }

    trailerCache.set(key, trailerKey);
    trailerInflight.delete(key);
    return trailerKey;
  })().catch(() => {
    trailerCache.set(key, undefined);
    trailerInflight.delete(key);
    return undefined;
  });

  trailerInflight.set(key, promise);
  return promise;
}

export function useHoverTrailer(item: MediaItem, active: boolean) {
  const [trailerKey, setTrailerKey] = useState<string | null>(null);

  useEffect(() => {
    if (!active) {
      setTrailerKey(null);
      return undefined;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      resolveTrailerKey(item).then((key) => {
        if (!cancelled) setTrailerKey(key ?? null);
      });
    }, HOVER_TRAILER_DELAY_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      setTrailerKey(null);
    };
  }, [active, item]);

  return trailerKey;
}

