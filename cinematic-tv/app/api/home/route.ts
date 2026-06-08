import { NextRequest, NextResponse } from 'next/server';
import { bootstrapTmdbConfig, getTrending, getPopular } from '@/lib/tmdb/client';
import { mapTmdbToMediaItem } from '@/lib/tmdb/mappers';
import { anilistQuery } from '@/lib/anilist/client';
import { mapAnilistToMediaItem } from '@/lib/anilist/mappers';
import type { AniListPageResponse } from '@/lib/anilist/types';
import type { TmdbMovieResult } from '@/lib/tmdb/types';
import { createLogger, getRequestId } from '@/lib/logger';

type HomeSource = 'all' | 'tmdb' | 'anilist';

function parseSource(value: string | null): HomeSource {
  return value === 'tmdb' || value === 'anilist' || value === 'all' ? value : 'all';
}

function animeVariables(isAdult: boolean) {
  return { page: 1, perPage: 20, isAdult };
}

export async function GET(req: NextRequest) {
  const log = createLogger('api:home', getRequestId(req));
  const start = Date.now();
  const source = parseSource(req.nextUrl.searchParams.get('source'));
  const includeAdult = req.nextUrl.searchParams.get('adult') === 'true';

  try {
    const includeTmdb = source !== 'anilist';
    const includeAnime = source !== 'tmdb';
    const tmdbReady = includeTmdb ? bootstrapTmdbConfig() : Promise.resolve();

    const tasks: { name: string; promise: Promise<unknown> }[] = [];

    if (includeTmdb) {
      tasks.push(
        { name: 'trendingMovieWeek', promise: tmdbReady.then(() => getTrending('movie', 'week')) },
        { name: 'trendingTvWeek', promise: tmdbReady.then(() => getTrending('tv', 'week')) },
        { name: 'trendingMovieDay', promise: tmdbReady.then(() => getTrending('movie', 'day')) },
        { name: 'popularMovies', promise: tmdbReady.then(() => getPopular('movie')) },
        { name: 'popularTv', promise: tmdbReady.then(() => getPopular('tv')) }
      );
    }

    if (includeAnime) {
      tasks.push(
        { name: 'trendingAnime', promise: anilistQuery<AniListPageResponse>('trendingAnime', animeVariables(includeAdult)) },
        { name: 'popularAnime', promise: anilistQuery<AniListPageResponse>('popularAnime', animeVariables(includeAdult)) },
        { name: 'topRatedAnime', promise: anilistQuery<AniListPageResponse>('topRatedAnime', animeVariables(includeAdult)) },
        { name: 'airingAnime', promise: anilistQuery<AniListPageResponse>('airingAnime', animeVariables(includeAdult)) }
      );
    }

    const settled = await Promise.allSettled(tasks.map((task) => task.promise));
    const results = new Map<string, unknown>();

    settled.forEach((result, i) => {
      const name = tasks[i]?.name ?? 'unknown';
      if (result.status === 'fulfilled') {
        results.set(name, result.value);
      } else {
        log.warn('home rail failed', {
          rail: name,
          reason: result.reason instanceof Error ? result.reason.message : String(result.reason),
        });
      }
    });

    const tmdbList = (name: string) => (results.get(name) as TmdbMovieResult[] | undefined) ?? [];
    const animePage = (name: string) =>
      (results.get(name) as AniListPageResponse | undefined)?.Page?.media ?? [];

    const trendingMovieWeek = tmdbList('trendingMovieWeek');
    const trendingAnime = animePage('trendingAnime');
    const hero =
      trendingMovieWeek[0]
        ? mapTmdbToMediaItem(trendingMovieWeek[0])
        : trendingAnime[0]
          ? mapAnilistToMediaItem(trendingAnime[0])
          : null;

    const failedCount = settled.filter((result) => result.status === 'rejected').length;
    log.info('home batch ok', {
      durationMs: Date.now() - start,
      failedRails: failedCount,
      totalRails: tasks.length,
      source,
      includeAdult,
    });

    return NextResponse.json(
      {
        hero,
        rails: {
          continueWatching: [],
          trendingToday: tmdbList('trendingMovieDay').slice(0, 12).map((item) => mapTmdbToMediaItem(item)),
          trendingMovies: trendingMovieWeek.slice(0, 12).map((item) => mapTmdbToMediaItem(item)),
          trendingTv: tmdbList('trendingTvWeek').slice(0, 12).map((item) => mapTmdbToMediaItem(item)),
          popularMovies: tmdbList('popularMovies').slice(0, 12).map((item) => mapTmdbToMediaItem(item)),
          popularTv: tmdbList('popularTv').slice(0, 12).map((item) => mapTmdbToMediaItem(item)),
          trendingAnime: trendingAnime.map((item) => mapAnilistToMediaItem(item)),
          popularAnime: animePage('popularAnime').map((item) => mapAnilistToMediaItem(item)),
          topRatedAnime: animePage('topRatedAnime').map((item) => mapAnilistToMediaItem(item)),
          airingAnime: animePage('airingAnime').map((item) => mapAnilistToMediaItem(item)),
        },
      },
      {
        headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=900' },
      }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to load home';
    log.error('home batch exception', e, { durationMs: Date.now() - start });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
