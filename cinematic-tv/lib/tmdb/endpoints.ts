import type { TmdbMovieDetails, TmdbTvDetails } from './types';
import { tmdbFetch } from './client';
import { mapMovieDetails, mapTvDetails } from './mappers';

const APPEND = 'videos,credits,recommendations,external_ids';

export async function getMovieDetails(id: number) {
  const data = await tmdbFetch<TmdbMovieDetails>(
    `movie/${id}`,
    { language: 'en-US', append_to_response: APPEND },
    3600
  );
  return { raw: data, item: mapMovieDetails(data), recommendations: data.recommendations?.results ?? [] };
}

export async function getTvDetails(id: number) {
  const data = await tmdbFetch<TmdbTvDetails>(
    `tv/${id}`,
    { language: 'en-US', append_to_response: APPEND },
    3600
  );
  return { raw: data, item: mapTvDetails(data), recommendations: data.recommendations?.results ?? [] };
}

export async function getTvSeason(tvId: number, season: number) {
  return tmdbFetch<{ episodes: { episode_number: number; season_number: number; name: string; overview: string; still_path: string | null; runtime: number | null }[] }>(
    `tv/${tvId}/season/${season}`,
    { language: 'en-US' },
    3600
  );
}

export async function findByImdb(imdbId: string) {
  return tmdbFetch<{ movie_results: { id: number }[]; tv_results: { id: number }[] }>(
    `find/${imdbId}`,
    { external_source: 'imdb_id' },
    3600
  );
}
