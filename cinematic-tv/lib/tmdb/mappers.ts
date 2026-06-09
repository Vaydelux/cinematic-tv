import type { CastMember, EpisodeItem, MediaItem, MediaType, SeasonInfo } from '@/lib/types';
import type {
  TmdbCastMember,
  TmdbEpisode,
  TmdbMovieDetails,
  TmdbMovieResult,
  TmdbSeason,
  TmdbTvDetails,
  TmdbVideo,
} from './types';
import { buildImageUrl, resolveGenreNames } from './config';

function formatRuntime(minutes?: number): string {
  if (!minutes) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatYear(date?: string): string {
  return date ? date.slice(0, 4) : '';
}

function pickTrailerKey(videos?: TmdbVideo[]): string | undefined {
  if (!videos?.length) return undefined;
  const trailer = videos.find((v) => v.site === 'YouTube' && v.type === 'Trailer');
  const teaser = videos.find((v) => v.site === 'YouTube' && v.type === 'Teaser');
  return (trailer ?? teaser)?.key;
}

function inferMediaType(item: TmdbMovieResult): MediaType {
  if (item.media_type) return item.media_type;
  return item.title ? 'movie' : 'tv';
}

type ListMapOptions = {
  includeDescription?: boolean;
};

export function mapTmdbToMediaItem(
  item: TmdbMovieResult,
  genreNames?: string[],
  options: ListMapOptions = {}
): MediaItem {
  const mediaType = inferMediaType(item);
  const title = item.title ?? item.name ?? 'Unknown';
  const year = formatYear(item.release_date ?? item.first_air_date);
  const genres = genreNames ?? resolveGenreNames(item.genre_ids, mediaType === 'movie' ? 'movie' : 'tv');

  return {
    id: `tmdb-${mediaType}-${item.id}`,
    source: 'tmdb',
    tmdbId: item.id,
    mediaType,
    title,
    meta: year ? `${year}${genres.length ? ` • ${genres[0]}` : ''}` : genres[0] ?? '',
    image: buildImageUrl(item.poster_path, 'w342'),
    backdrop: buildImageUrl(item.backdrop_path, 'w780'),
    description: options.includeDescription ? item.overview || undefined : undefined,
    genres,
    voteAverage: item.vote_average,
  };
}

export function mapMovieDetails(details: TmdbMovieDetails): MediaItem {
  const genres = details.genres?.map((g) => g.name) ?? [];
  const year = formatYear(details.release_date);
  return {
    id: `tmdb-movie-${details.id}`,
    source: 'tmdb',
    tmdbId: details.id,
    mediaType: 'movie',
    imdbId: details.external_ids?.imdb_id ?? undefined,
    title: details.title ?? 'Unknown',
    meta: [year, formatRuntime(details.runtime), genres[0]].filter(Boolean).join(' • '),
    image: buildImageUrl(details.poster_path, 'w342'),
    backdrop: buildImageUrl(details.backdrop_path, 'w780'),
    description: details.overview || undefined,
    genres,
    voteAverage: details.vote_average,
    trailerKey: pickTrailerKey(details.videos?.results),
  };
}

export function mapTvDetails(details: TmdbTvDetails): MediaItem {
  const genres = details.genres?.map((g) => g.name) ?? [];
  const year = formatYear(details.first_air_date);
  return {
    id: `tmdb-tv-${details.id}`,
    source: 'tmdb',
    tmdbId: details.id,
    mediaType: 'tv',
    imdbId: details.external_ids?.imdb_id ?? undefined,
    title: details.name ?? 'Unknown',
    meta: [year, `${details.number_of_seasons} Season${details.number_of_seasons !== 1 ? 's' : ''}`, genres[0]]
      .filter(Boolean)
      .join(' • '),
    image: buildImageUrl(details.poster_path, 'w342'),
    backdrop: buildImageUrl(details.backdrop_path, 'w780'),
    description: details.overview || undefined,
    genres,
    voteAverage: details.vote_average,
    trailerKey: pickTrailerKey(details.videos?.results),
    season: 1,
    episode: 1,
  };
}

export function mapCast(cast?: TmdbCastMember[]): CastMember[] {
  return (cast ?? []).slice(0, 12).map((c) => ({
    id: c.id,
    name: c.name,
    character: c.character,
    profileUrl: c.profile_path ? buildImageUrl(c.profile_path, 'w154') : undefined,
  }));
}

export function mapSeasons(seasons: TmdbSeason[]): SeasonInfo[] {
  return seasons
    .filter((s) => s.season_number > 0)
    .map((s) => ({
      seasonNumber: s.season_number,
      name: s.name,
      episodeCount: s.episode_count,
      posterUrl: s.poster_path ? buildImageUrl(s.poster_path, 'w154') : undefined,
    }));
}

export function mapEpisodes(episodes: TmdbEpisode[]): EpisodeItem[] {
  return episodes.map((e) => ({
    episodeNumber: e.episode_number,
    seasonNumber: e.season_number,
    name: e.name,
    overview: e.overview,
    stillUrl: e.still_path ? buildImageUrl(e.still_path, 'w342') : undefined,
    runtime: e.runtime ?? undefined,
  }));
}
