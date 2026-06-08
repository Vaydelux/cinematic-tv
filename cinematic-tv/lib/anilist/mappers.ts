import type { MediaItem, RelationItem } from '@/lib/types';
import type { AniListMedia } from './types';
import { resolveExternalIds } from '@/lib/catalog/id-resolver';
import { MEDIA_PLACEHOLDER } from '@/lib/tmdb/config';

export function mapAnilistToMediaItem(media: AniListMedia): MediaItem {
  const title =
    media.title.userPreferred ?? media.title.english ?? media.title.romaji ?? 'Unknown';
  const external = resolveExternalIds(media.externalLinks);
  const meta = [
    media.format,
    media.episodes ? `${media.episodes} eps` : undefined,
    media.averageScore ? `${(media.averageScore / 10).toFixed(1)} ★` : undefined,
  ]
    .filter(Boolean)
    .join(' • ');

  return {
    id: `anilist-anime-${media.id}`,
    source: 'anilist',
    anilistId: media.id,
    malId: media.idMal ?? undefined,
    tmdbId: external.tmdbId,
    imdbId: external.imdbId,
    mediaType: 'anime',
    title,
    meta,
    image: media.coverImage?.extraLarge ?? media.coverImage?.large ?? MEDIA_PLACEHOLDER,
    backdrop: media.bannerImage ?? undefined,
    description: media.description?.replace(/<[^>]+>/g, '') || undefined,
    genres: media.genres,
    voteAverage: media.averageScore ? media.averageScore / 10 : undefined,
    episodes: media.episodes ?? undefined,
    episode: 1,
    isAdult: media.isAdult,
  };
}

export function mapAnilistRelations(media: AniListMedia): RelationItem[] {
  return (media.relations?.edges ?? []).slice(0, 12).map((edge) => ({
    id: edge.node.id,
    mediaType: edge.node.type === 'ANIME' ? 'anime' : 'manga',
    relationType: edge.relationType,
    title: edge.node.title.english ?? edge.node.title.romaji ?? 'Unknown',
    image: edge.node.coverImage?.medium ?? MEDIA_PLACEHOLDER,
  }));
}
