import { getCached, setCache } from '@/lib/cache';
import type { IntroSegment } from '@/lib/player/types';

const INTRODB_BASE = 'https://api.theintrodb.org/v3/media';
const TTL = 86400;

type IntroDbResponse = {
  intro?: { start_ms: number; end_ms: number }[];
  outro?: { start_ms: number; end_ms: number }[];
  recap?: { start_ms: number; end_ms: number }[];
};

export async function fetchIntroSegments(params: {
  id: string;
  season?: number;
  episode?: number;
}): Promise<IntroSegment[]> {
  const cacheKey = `introdb:${params.id}:${params.season ?? 0}:${params.episode ?? 0}`;
  const cached = getCached<IntroSegment[]>(cacheKey);
  if (cached) return cached;

  const qs = new URLSearchParams({ id: params.id });
  if (params.season != null) qs.set('season', String(params.season));
  if (params.episode != null) qs.set('episode', String(params.episode));

  const res = await fetch(`${INTRODB_BASE}?${qs}`, {
    headers: { Accept: 'application/json' },
    next: { revalidate: TTL },
  });

  if (!res.ok) return [];

  const data = (await res.json()) as IntroDbResponse;
  const segments: IntroSegment[] = [];

  for (const seg of data.intro ?? []) {
    segments.push({ type: 'intro', startMs: seg.start_ms, endMs: seg.end_ms });
  }
  for (const seg of data.outro ?? []) {
    segments.push({ type: 'outro', startMs: seg.start_ms, endMs: seg.end_ms });
  }
  for (const seg of data.recap ?? []) {
    segments.push({ type: 'recap', startMs: seg.start_ms, endMs: seg.end_ms });
  }

  setCache(cacheKey, segments, TTL);
  return segments;
}
