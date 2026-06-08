export type CatalogSource = 'tmdb' | 'anilist';
export type MediaType = 'movie' | 'tv' | 'anime' | 'manga';
export type ThemeId =
  | 'theme-default'
  | 'theme-crimson'
  | 'theme-ocean'
  | 'theme-emerald'
  | 'theme-obsidian';
export type ColorMode = 'dark' | 'light';
export type IframeSandboxMode = 'strict' | 'compatibility';

export type MediaItem = {
  id: string;
  source: CatalogSource;
  tmdbId?: number;
  anilistId?: number;
  malId?: number;
  imdbId?: string;
  mediaType: MediaType;
  title: string;
  meta: string;
  image: string;
  backdrop?: string;
  description?: string;
  genres?: string[];
  voteAverage?: number;
  trailerKey?: string;
  episodes?: number;
  season?: number;
  episode?: number;
  progress?: number;
  remaining?: string;
  isAdult?: boolean;
};

export type CastMember = {
  id: number;
  name: string;
  character: string;
  profileUrl?: string;
};

export type EpisodeItem = {
  episodeNumber: number;
  seasonNumber: number;
  name: string;
  overview: string;
  stillUrl?: string;
  runtime?: number;
};

export type SeasonInfo = {
  seasonNumber: number;
  name: string;
  episodeCount: number;
  posterUrl?: string;
};

export type RelationItem = {
  id: number;
  mediaType: MediaType;
  relationType: string;
  title: string;
  image?: string;
};

export type AppSettings = {
  themeColor: ThemeId;
  colorMode: ColorMode;
  fontSize: string;
  homeRailOrder: string[];
  language: string;
  region: string;
  defaultServerId: string;
  serverOrder: string[];
  hiddenServerIds: string[];
  preferredSubtitleLanguage: string;
  onboardingComplete: boolean;
  contentSource: 'all' | 'tmdb' | 'anilist';
  showAdult: boolean;
  iframeSandboxMode: IframeSandboxMode;
};

export type Movie = MediaItem;
