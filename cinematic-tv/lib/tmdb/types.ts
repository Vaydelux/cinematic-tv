export type TmdbListResponse<T> = {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
};

export type TmdbMovieResult = {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  genre_ids?: number[];
  vote_average: number;
  media_type?: 'movie' | 'tv';
};

export type TmdbGenre = { id: number; name: string };

export type TmdbVideo = { key: string; site: string; type: string };

export type TmdbCastMember = {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
};

export type TmdbSeason = {
  season_number: number;
  name: string;
  episode_count: number;
  poster_path: string | null;
};

export type TmdbEpisode = {
  episode_number: number;
  season_number: number;
  name: string;
  overview: string;
  still_path: string | null;
  runtime: number | null;
};

export type TmdbExternalIds = { imdb_id?: string | null };

export type TmdbMovieDetails = TmdbMovieResult & {
  runtime?: number;
  genres?: TmdbGenre[];
  videos?: { results: TmdbVideo[] };
  credits?: { cast: TmdbCastMember[] };
  recommendations?: { results: TmdbMovieResult[] };
  external_ids?: TmdbExternalIds;
};

export type TmdbTvDetails = TmdbMovieResult & {
  number_of_seasons: number;
  genres?: TmdbGenre[];
  seasons: TmdbSeason[];
  videos?: { results: TmdbVideo[] };
  credits?: { cast: TmdbCastMember[] };
  recommendations?: { results: TmdbMovieResult[] };
  external_ids?: TmdbExternalIds;
};

export type TmdbConfiguration = {
  images: {
    secure_base_url: string;
    poster_sizes: string[];
    backdrop_sizes: string[];
  };
};
