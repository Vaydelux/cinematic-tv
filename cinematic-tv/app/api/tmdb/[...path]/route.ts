import { NextRequest, NextResponse } from 'next/server';
import { requireTmdbToken } from '@/lib/env';
import { fetchWithBackoff, getCached, setCache } from '@/lib/cache';
import { createLogger, getRequestId } from '@/lib/logger';

const ALLOWED_PREFIXES = [
  'configuration',
  'genre',
  'trending',
  'movie',
  'tv',
  'search',
  'discover',
  'find',
];

const SAFE_PARAMS = new Set([
  'language',
  'region',
  'page',
  'query',
  'append_to_response',
  'include_adult',
  'include_image_language',
  'with_genres',
  'sort_by',
  'primary_release_year',
  'first_air_date_year',
  'external_source',
]);

const TTL_MAP: Record<string, number> = {
  configuration: 86400,
  genre: 86400,
  trending: 900,
  search: 300,
  discover: 900,
  find: 3600,
  movie: 3600,
  tv: 3600,
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const log = createLogger('api:tmdb', getRequestId(req));
  const start = Date.now();

  try {
    const { path } = await params;
    const tmdbPath = path.join('/');

    if (!ALLOWED_PREFIXES.some((p) => tmdbPath.startsWith(p))) {
      log.warn('blocked path', { tmdbPath });
      return NextResponse.json({ error: 'Path not allowed', code: 403 }, { status: 403 });
    }

    const url = new URL(req.url);
    const forwardParams = new URLSearchParams();
    url.searchParams.forEach((value, key) => {
      if (SAFE_PARAMS.has(key)) forwardParams.set(key, value);
    });

    const cacheKey = `proxy:tmdb:${tmdbPath}:${forwardParams.toString()}`;
    const cached = getCached<unknown>(cacheKey);
    if (cached) {
      log.debug('cache hit', { tmdbPath, durationMs: Date.now() - start });
      return NextResponse.json(cached, {
        headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' },
      });
    }

    const prefix = tmdbPath.split('/')[0];
    const ttl = TTL_MAP[prefix] ?? 900;

    const apiUrl = `https://api.themoviedb.org/3/${tmdbPath}?${forwardParams.toString()}`;
    const res = await fetchWithBackoff(apiUrl, {
      headers: {
        Authorization: `Bearer ${requireTmdbToken()}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      const retryAfter = res.headers.get('Retry-After');
      const body = await res.text();
      log.error('TMDB upstream error', undefined, {
        tmdbPath,
        status: res.status,
        retryAfter,
        body: body.slice(0, 200),
        durationMs: Date.now() - start,
      });
      return NextResponse.json(
        { error: body, code: res.status, retryAfter },
        { status: res.status }
      );
    }

    const data = await res.json();
    setCache(cacheKey, data, ttl);
    log.info('proxy ok', { tmdbPath, status: res.status, durationMs: Date.now() - start });
    return NextResponse.json(data, {
      headers: { 'Cache-Control': `public, s-maxage=${ttl}, stale-while-revalidate=${ttl * 2}` },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    const status = message.includes('not configured') ? 503 : 500;
    log.error('proxy exception', e, { durationMs: Date.now() - start, status });
    return NextResponse.json({ error: message, code: status }, { status });
  }
}
