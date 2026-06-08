'use client';

import { useEffect, useState } from 'react';
import { WatchPlayer } from '@/components/WatchPlayer';
import { fetchAnilist, fetchTmdb } from '@/hooks/useCatalogQuery';
import { mapAnilistToMediaItem } from '@/lib/anilist/mappers';
import { mapMovieDetails, mapSeasons, mapTvDetails } from '@/lib/tmdb/mappers';
import type { AniListMediaResponse } from '@/lib/anilist/types';
import type { TmdbEpisode, TmdbMovieDetails, TmdbTvDetails } from '@/lib/tmdb/types';
import type { MediaItem, SeasonInfo } from '@/lib/types';
import { Loader2 } from 'lucide-react';

type Props = {
  source: string;
  mediaType: string;
  id: number;
  season: number;
  episode: number;
};

export function WatchPageClient({ source, mediaType, id, season, episode }: Props) {
  const [item, setItem] = useState<MediaItem | null>(null);
  const [maxEpisode, setMaxEpisode] = useState(1);
  const [maxSeason, setMaxSeason] = useState<number | undefined>();
  const [seasons, setSeasons] = useState<SeasonInfo[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        if (source === 'anilist') {
          const data = await fetchAnilist<AniListMediaResponse>('mediaById', { id });
          if (!data.Media) throw new Error('Anime not found');
          const mapped = mapAnilistToMediaItem(data.Media);
          setItem({ ...mapped, season: 1, episode });
          setMaxEpisode(mapped.episodes ?? 1);
        } else if (mediaType === 'movie') {
          const data = await fetchTmdb<TmdbMovieDetails>(`movie/${id}`, {
            append_to_response: 'external_ids',
          });
          setItem(mapMovieDetails(data));
        } else {
          const data = await fetchTmdb<TmdbTvDetails>(`tv/${id}`, {
            append_to_response: 'external_ids',
          });
          setItem({ ...mapTvDetails(data), season, episode });
          const seasonMeta = mapSeasons(data.seasons ?? []);
          setSeasons(seasonMeta);
          setMaxSeason(seasonMeta.length);
          const seasonData = await fetchTmdb<{ episodes: TmdbEpisode[] }>(
            `tv/${id}/season/${season}`,
            {}
          );
          setMaxEpisode(seasonData.episodes?.length ?? 1);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load');
      }
    }
    load();
  }, [source, mediaType, id, season, episode]);

  if (error) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center text-white/60">
        {error}
      </div>
    );
  }

  if (!item) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <WatchPlayer
      item={item}
      season={season}
      episode={episode}
      maxEpisode={maxEpisode}
      maxSeason={maxSeason}
      seasons={seasons}
    />
  );
}
