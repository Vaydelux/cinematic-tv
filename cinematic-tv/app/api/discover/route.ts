import { NextRequest, NextResponse } from 'next/server';
import { anilistQuery } from '@/lib/anilist/client';
import { mapAnilistToMediaItem } from '@/lib/anilist/mappers';
import type { AniListPageResponse } from '@/lib/anilist/types';
import { getCatalogGenre } from '@/lib/catalog/genres';
import { dedupeSearchResults } from '@/lib/catalog/unifier';
import { createLogger, getRequestId } from '@/lib/logger';
import { bootstrapTmdbConfig, tmdbFetch } from '@/lib/tmdb/client';
import { mapTmdbToMediaItem } from '@/lib/tmdb/mappers';
import type { TmdbListResponse, TmdbMovieResult } from '@/lib/tmdb/types';
import type { CatalogSource, MediaItem } from '@/lib/types';

type DiscoverSort = 'latest' | 'popular' | 'top-rated';

function parseSource(value: string | null): AppSource {
  return value === 'tmdb' || value === 'anilist' || value === 'all' ? value : 'all';
}

type AppSource = CatalogSource | 'all';

function parseSort(value: string | null): DiscoverSort {
  return value === 'latest' || value === 'top-rated' ? value : 'popular';
}

function parsePage(value: string | null) {
  const page = Number(value);
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

function tmdbSort(sort: DiscoverSort, mediaType: 'movie' | 'tv') {
  if (sort === 'latest') return mediaType === 'movie' ? 'primary_release_date.desc' : 'first_air_date.desc';
  if (sort === 'top-rated') return 'vote_average.desc';
  return 'popularity.desc';
}

function anilistSort(sort: DiscoverSort) {
  if (sort === 'latest') return ['START_DATE_DESC'];
  if (sort === 'top-rated') return ['SCORE_DESC'];
  return ['POPULARITY_DESC'];
}

async function discoverTmdb(
  mediaType: 'movie' | 'tv',
  genreId: number | undefined,
  sort: DiscoverSort,
  page: number
) {
  const params: Record<string, string> = {
    language: 'en-US',
    page: String(page),
    sort_by: tmdbSort(sort, mediaType),
  };
  if (genreId) params.with_genres = String(genreId);

  if (sort === 'top-rated') params['vote_count.gte'] = mediaType === 'movie' ? '200' : '50';

  const data = await tmdbFetch<TmdbListResponse<TmdbMovieResult>>(`discover/${mediaType}`, params);
  return {
    items: data.results.map((item) => mapTmdbToMediaItem({ ...item, media_type: mediaType })),
    hasMore: page < data.total_pages,
  };
}

async function discoverAnime(
  genre: string | undefined,
  sort: DiscoverSort,
  page: number,
  isAdult: boolean
) {
  const data = await anilistQuery<AniListPageResponse>('discoverAnime', {
    page,
    perPage: 24,
    isAdult,
    genreIn: genre ? [genre] : undefined,
    sort: anilistSort(sort),
  });

  return {
    items: (data.Page?.media ?? []).map((item) => mapAnilistToMediaItem(item)),
    hasMore: Boolean(data.Page?.pageInfo?.hasNextPage),
  };
}

export async function GET(req: NextRequest) {
  const log = createLogger('api:discover', getRequestId(req));
  const start = Date.now();
  const source = parseSource(req.nextUrl.searchParams.get('source'));
  const sort = parseSort(req.nextUrl.searchParams.get('sort'));
  const page = parsePage(req.nextUrl.searchParams.get('page'));
  const genreParam = req.nextUrl.searchParams.get('genre');
  const genre = getCatalogGenre(genreParam);
  const includeAdult = req.nextUrl.searchParams.get('adult') === 'true';

  if (genreParam && !genre) {
    return NextResponse.json({ error: 'Unknown genre' }, { status: 400 });
  }

  try {
    const includeTmdb = source !== 'anilist';
    const includeAnime = source !== 'tmdb';
    if (includeTmdb) await bootstrapTmdbConfig();

    const tasks: Promise<{ items: MediaItem[]; hasMore: boolean }>[] = [];
    if (includeTmdb) {
      if (!genreParam || genre?.tmdbMovieId) {
        tasks.push(discoverTmdb('movie', genre?.tmdbMovieId, sort, page));
      }
      if (!genreParam || genre?.tmdbTvId) {
        tasks.push(discoverTmdb('tv', genre?.tmdbTvId, sort, page));
      }
    }
    if (includeAnime && (!genreParam || genre?.anilistGenre)) {
      tasks.push(discoverAnime(genre?.anilistGenre, sort, page, includeAdult));
    }

    const settled = await Promise.allSettled(tasks);
    const fulfilled = settled.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []));
    const failed = settled.filter((result) => result.status === 'rejected');

    failed.forEach((result) => {
      if (result.status === 'rejected') {
        log.warn('discover source failed', {
          genre: genre?.id ?? 'all',
          reason: result.reason instanceof Error ? result.reason.message : String(result.reason),
        });
      }
    });

    const items = dedupeSearchResults(fulfilled.flatMap((result) => result.items));
    const hasMore = fulfilled.some((result) => result.hasMore);

    log.info('discover ok', {
      durationMs: Date.now() - start,
      genre: genre?.id ?? 'all',
      source,
      sort,
      page,
      count: items.length,
      failedSources: failed.length,
    });

    return NextResponse.json(
      {
        items,
        hasMore,
        nextPage: hasMore ? page + 1 : null,
      },
      {
        headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=900' },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to discover titles';
    log.error('discover exception', error, { durationMs: Date.now() - start });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
