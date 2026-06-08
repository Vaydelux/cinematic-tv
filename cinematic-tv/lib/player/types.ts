import type { CatalogSource, MediaType } from '@/lib/types';

export type PlaybackStatus = 'IDLE' | 'SEARCHING' | 'PLAYING' | 'ERROR';

export type PlayerSessionContext = {
  source: CatalogSource;
  mediaType: MediaType;
  itemId: string;
  tmdbId?: number;
  anilistId?: number;
  imdbId?: string;
  malId?: number;
  season: number;
  episode: number;
  title: string;
};

export type IntroSegment = {
  type: 'intro' | 'outro' | 'recap';
  startMs: number;
  endMs: number;
};

export type SubtitleTrack = {
  id: string;
  language: string;
  label: string;
  url: string;
  format: 'vtt' | 'srt' | 'ass';
};
