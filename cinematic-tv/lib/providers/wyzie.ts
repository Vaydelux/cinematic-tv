import { getEnv } from '@/lib/env';
import { getCached, setCache } from '@/lib/cache';
import type { SubtitleTrack } from '@/lib/player/types';

const WYZIE_BASE = 'https://sub.wyzie.io';
const TTL = 43200;

type WyzieSubtitle = {
  id?: string;
  language?: string;
  label?: string;
  url?: string;
  format?: string;
};

export async function fetchWyzieSubtitles(params: {
  id: string;
  season?: number;
  episode?: number;
  language?: string;
  format?: 'vtt' | 'srt' | 'ass';
}): Promise<SubtitleTrack[]> {
  const cacheKey = `wyzie:${params.id}:${params.season ?? 0}:${params.episode ?? 0}:${params.language ?? 'en'}`;
  const cached = getCached<SubtitleTrack[]>(cacheKey);
  if (cached) return cached;

  const env = getEnv();
  if (!env.WYZIE_API_KEY) return [];

  const qs = new URLSearchParams({
    id: params.id,
    key: env.WYZIE_API_KEY,
    language: params.language ?? 'en',
    format: params.format ?? 'vtt',
  });
  if (params.season != null) qs.set('season', String(params.season));
  if (params.episode != null) qs.set('episode', String(params.episode));

  const res = await fetch(`${WYZIE_BASE}/?${qs}`, {
    headers: { Accept: 'application/json' },
    next: { revalidate: TTL },
  });

  if (!res.ok) return [];

  const data = await res.json();
  const list: WyzieSubtitle[] = Array.isArray(data) ? data : (data.subtitles ?? data.results ?? []);

  const tracks: SubtitleTrack[] = list
    .filter((s) => s.url)
    .map((s, i) => ({
      id: s.id ?? `wyzie-${i}`,
      language: s.language ?? params.language ?? 'en',
      label: s.label ?? s.language ?? 'Subtitle',
      url: s.url!,
      format: (s.format as SubtitleTrack['format']) ?? params.format ?? 'vtt',
    }));

  setCache(cacheKey, tracks, TTL);
  return tracks;
}
