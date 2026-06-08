'use client';

import { PlayerShell } from '@/components/player/PlayerShell';
import type { MediaItem, SeasonInfo } from '@/lib/types';

type WatchPlayerProps = {
  item: MediaItem;
  season: number;
  episode: number;
  maxEpisode?: number;
  maxSeason?: number;
  seasons?: SeasonInfo[];
};

export function WatchPlayer({ item, season, episode, maxEpisode, maxSeason, seasons }: WatchPlayerProps) {
  return (
    <PlayerShell
      item={item}
      season={season}
      episode={episode}
      maxEpisode={maxEpisode}
      maxSeason={maxSeason}
      seasons={seasons}
    />
  );
}
