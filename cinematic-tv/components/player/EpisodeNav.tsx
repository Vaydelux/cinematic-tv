'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getWatchPath } from '@/lib/catalog/unifier';
import type { MediaItem, SeasonInfo } from '@/lib/types';

type Props = {
  item: MediaItem;
  season: number;
  episode: number;
  maxEpisode: number;
  maxSeason?: number;
  seasons?: SeasonInfo[];
};

export function EpisodeNav({ item, season, episode, maxEpisode, maxSeason, seasons = [] }: Props) {
  const router = useRouter();
  const isSeries = item.mediaType === 'tv' || item.mediaType === 'anime';

  if (!isSeries) return null;

  const orderedSeasons = seasons
    .filter((s) => s.seasonNumber > 0)
    .sort((a, b) => a.seasonNumber - b.seasonNumber);
  const currentIndex = orderedSeasons.findIndex((s) => s.seasonNumber === season);
  const previousSeason = currentIndex > 0 ? orderedSeasons[currentIndex - 1] : undefined;
  const nextSeason = currentIndex >= 0 ? orderedSeasons[currentIndex + 1] : undefined;
  const hasPrev = episode > 1 || Boolean(previousSeason);
  const hasNext = episode < maxEpisode || Boolean(nextSeason);

  const navigate = (nextSeason: number, nextEpisode: number) => {
    const path = getWatchPath({ ...item, season: nextSeason, episode: nextEpisode });
    router.push(path);
  };

  const goPrevious = () => {
    if (episode > 1) {
      navigate(season, episode - 1);
      return;
    }
    if (previousSeason) {
      navigate(previousSeason.seasonNumber, Math.max(previousSeason.episodeCount, 1));
    }
  };

  const goNext = () => {
    if (episode < maxEpisode) {
      navigate(season, episode + 1);
      return;
    }
    if (nextSeason) {
      navigate(nextSeason.seasonNumber, 1);
    }
  };

  return (
    <div className="flex items-center gap-1 shrink-0">
      <button
        disabled={!hasPrev}
        onClick={goPrevious}
        className="p-2 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none text-white"
        aria-label="Previous episode"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="text-xs text-white/70 whitespace-nowrap px-1 tabular-nums">
        S{season} E{episode}
        {maxSeason ? ` / ${maxSeason} seasons` : ` / ${maxEpisode} eps`}
      </span>
      <button
        disabled={!hasNext}
        onClick={goNext}
        className="p-2 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none text-white"
        aria-label="Next episode"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
