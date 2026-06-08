'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { ActiveMediaState } from '@/lib/context';
import Image from 'next/image';
import { AlertCircle, Check, Play, Plus, Share2, X } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { createShareToken } from '@/lib/share';
import { ReviewsSection } from './ReviewsSection';
import { CastRow } from './CastRow';
import { RecommendationsRail } from './RecommendationsRail';
import { RelationsRail } from './RelationsRail';
import { fetchAnilist, fetchTmdb } from '@/hooks/useCatalogQuery';
import { mapMovieDetails, mapTvDetails, mapCast, mapEpisodes, mapTmdbToMediaItem } from '@/lib/tmdb/mappers';
import { mapAnilistToMediaItem, mapAnilistRelations } from '@/lib/anilist/mappers';
import { getWatchPath } from '@/lib/catalog/unifier';
import { useWatchlist } from '@/hooks/useWatchlist';
import type { CastMember, EpisodeItem, MediaItem, RelationItem, SeasonInfo } from '@/lib/types';
import type { TmdbEpisode, TmdbMovieDetails, TmdbTvDetails } from '@/lib/tmdb/types';
import type { AniListMediaResponse } from '@/lib/anilist/types';

export function MovieDetail({ movie, onClose }: { movie: ActiveMediaState; onClose: () => void }) {
  const router = useRouter();
  const { toggle, isInList } = useWatchlist();
  const [detail, setDetail] = useState<MediaItem>(movie);
  const [cast, setCast] = useState<CastMember[]>([]);
  const [recommendations, setRecommendations] = useState<MediaItem[]>([]);
  const [relations, setRelations] = useState<RelationItem[]>([]);
  const [seasons, setSeasons] = useState<SeasonInfo[]>([]);
  const [episodes, setEpisodes] = useState<EpisodeItem[]>([]);
  const [selectedSeason, setSelectedSeason] = useState(movie.season ?? 1);
  const [selectedEpisode, setSelectedEpisode] = useState(movie.episode ?? 1);
  const [loading, setLoading] = useState(true);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const inList = isInList(detail);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setDetailError(null);
      try {
        if (movie.source === 'anilist' && movie.anilistId) {
          const data = await fetchAnilist<AniListMediaResponse>('mediaById', { id: movie.anilistId });
          if (data.Media) {
            setDetail(mapAnilistToMediaItem(data.Media));
            setRelations(mapAnilistRelations(data.Media));
          }
        } else if (movie.mediaType === 'movie' && movie.tmdbId) {
          const data = await fetchTmdb<TmdbMovieDetails>(`movie/${movie.tmdbId}`, {
            language: 'en-US',
            append_to_response: 'videos,credits,recommendations,external_ids',
          });
          setDetail(mapMovieDetails(data));
          setCast(mapCast(data.credits?.cast));
          setRecommendations(
            (data.recommendations?.results ?? []).map((r) => mapTmdbToMediaItem(r))
          );
        } else if (movie.tmdbId) {
          const data = await fetchTmdb<TmdbTvDetails>(`tv/${movie.tmdbId}`, {
            language: 'en-US',
            append_to_response: 'videos,credits,recommendations,external_ids',
          });
          setDetail(mapTvDetails(data));
          setCast(mapCast(data.credits?.cast));
          setRecommendations(
            (data.recommendations?.results ?? []).map((r) => mapTmdbToMediaItem(r))
          );
          setSeasons(
            (data.seasons ?? [])
              .filter((s) => s.season_number > 0)
              .map((s) => ({
                seasonNumber: s.season_number,
                name: s.name,
                episodeCount: s.episode_count,
              }))
          );
        }
      } catch (error) {
        setDetailError(error instanceof Error ? error.message : 'Failed to load details');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [movie]);

  useEffect(() => {
    if (movie.mediaType !== 'tv' || !movie.tmdbId) return;
    fetchTmdb<{ episodes: TmdbEpisode[] }>(`tv/${movie.tmdbId}/season/${selectedSeason}`, {
      language: 'en-US',
    }).then((data) => {
      setEpisodes(mapEpisodes(data.episodes ?? []));
    }).catch(() => setEpisodes([]));
  }, [movie.tmdbId, movie.mediaType, selectedSeason]);

  const handleShare = async () => {
    const user = auth?.currentUser;
    if (!user) {
      setShareUrl(null);
      return;
    }
    setSharing(true);
    try {
      const token = await createShareToken(
        {
          source: detail.source,
          mediaType: detail.mediaType,
          tmdbId: detail.tmdbId,
          anilistId: detail.anilistId,
          season: movie.mediaType === 'tv' ? selectedSeason : undefined,
          episode:
            movie.mediaType === 'tv' || movie.mediaType === 'anime' ? selectedEpisode : undefined,
        },
        user.uid
      );
      const url = `${window.location.origin}/share/${token}`;
      setShareUrl(url);
      await navigator.clipboard.writeText(url);
    } catch {
      setShareUrl(null);
    } finally {
      setSharing(false);
    }
  };

  const handlePlay = () => {
    const playItem = {
      ...detail,
      season: movie.mediaType === 'tv' ? selectedSeason : detail.season,
      episode: movie.mediaType === 'tv' || movie.mediaType === 'anime' ? selectedEpisode : detail.episode,
    };
    router.push(getWatchPath(playItem));
    onClose();
  };

  const trailerUrl = detail.trailerKey
    ? `https://www.youtube-nocookie.com/embed/${detail.trailerKey}?autoplay=1&mute=1`
    : null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 pointer-events-none sm:p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 pointer-events-auto backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        layoutId={movie.matchedLayoutId}
        className="cinema-panel relative flex h-[94vh] w-full max-w-5xl flex-col overflow-y-auto overflow-x-hidden rounded-lg shadow-2xl pointer-events-auto hide-scrollbar sm:h-[92vh]"
      >
        <button
          onClick={onClose}
          className="fixed right-3 top-3 z-50 rounded-full bg-black/[0.55] p-2 text-white shadow-xl backdrop-blur transition hover:bg-black/80 active:scale-95 sm:right-6 sm:top-6"
          aria-label="Close details"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="relative w-full aspect-[4/3] md:aspect-[21/9] shrink-0">
          <div className="absolute inset-0 z-0">
            <Image
              src={detail.backdrop ?? detail.image}
              alt={detail.title}
              fill
              className="object-cover"
            />
          </div>
          {trailerUrl && (
            <iframe
              src={trailerUrl}
              className="absolute inset-0 z-10 w-full h-full object-cover pointer-events-none"
              allow="autoplay; encrypted-media"
            />
          )}
          <div className="absolute inset-0 z-20 bg-gradient-to-t from-surface via-background/60 to-transparent" />
          <div className="absolute inset-0 z-20 bg-gradient-to-r from-surface via-transparent to-transparent opacity-80" />

          <div className="absolute inset-0 z-30 flex w-full flex-col justify-end p-5 sm:p-8 md:p-12">
            <div className="flex flex-wrap gap-2 text-xs font-bold tracking-widest uppercase text-white/70 mb-4">
              {detail.genres?.slice(0, 4).map((g) => (
                <span key={g} className="rounded border border-white/10 bg-white/[0.08] px-2 py-1">
                  {g}
                </span>
              ))}
            </div>
            <h2 className="mb-4 break-words font-display text-3xl font-bold leading-tight tracking-tight text-white drop-shadow-lg sm:text-4xl md:text-6xl">
              {detail.title}
            </h2>
            <p className="text-sm text-white/60 mb-4">{detail.meta}</p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handlePlay}
                className="flex items-center gap-2 rounded-md bg-white px-4 py-2.5 text-sm font-bold text-black shadow-xl transition hover:bg-white/90 active:scale-95 sm:px-6 sm:py-3"
              >
                <Play className="w-5 h-5 fill-current" /> Play
              </button>
              <button
                onClick={() => toggle(detail)}
                className="flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.12] px-4 py-2.5 text-sm font-bold text-white shadow-xl backdrop-blur transition hover:bg-white/[0.18] active:scale-95 sm:px-6 sm:py-3"
              >
                {inList ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                {inList ? 'In List' : 'My List'}
              </button>
              <button
                onClick={handleShare}
                disabled={sharing || !auth?.currentUser}
                title={auth?.currentUser ? 'Copy share link' : 'Sign in to share'}
                className="flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.12] px-4 py-2.5 text-sm font-bold text-white shadow-xl backdrop-blur transition hover:bg-white/[0.18] active:scale-95 disabled:opacity-40 sm:px-5 sm:py-3"
              >
                <Share2 className="w-5 h-5" />
                {shareUrl ? 'Copied!' : 'Share'}
              </button>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative z-30 mx-auto w-full max-w-4xl flex-1 p-5 sm:p-8 md:p-12"
        >
          {loading ? (
            <div className="animate-pulse h-24 bg-surface-container rounded-lg mb-8" />
          ) : detailError ? (
            <div className="mb-8 rounded-lg border border-primary/30 bg-primary/10 p-4 text-sm text-red-100 flex gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 text-primary" />
              <span>{detailError}</span>
            </div>
          ) : (
            <>
              <p className="mb-8 text-base leading-relaxed text-on-surface-variant sm:text-lg md:text-xl">
                {detail.description || 'No description available.'}
              </p>

              {movie.mediaType === 'tv' && seasons.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-display font-bold mb-4">Episodes</h3>
                  <div className="flex gap-2 mb-4 overflow-x-auto hide-scrollbar">
                    {seasons.map((s) => (
                      <button
                        key={s.seasonNumber}
                        onClick={() => setSelectedSeason(s.seasonNumber)}
                        className={`px-4 py-2 rounded-md text-sm font-bold whitespace-nowrap ${
                          selectedSeason === s.seasonNumber
                            ? 'bg-primary text-white'
                            : 'bg-white/[0.06] text-on-surface-variant hover:bg-white/10'
                        }`}
                      >
                        {s.name || `Season ${s.seasonNumber}`}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-4 gap-2 min-[360px]:grid-cols-5 sm:grid-cols-6 md:grid-cols-8">
                    {episodes.map((ep) => (
                      <button
                        key={ep.episodeNumber}
                        onClick={() => setSelectedEpisode(ep.episodeNumber)}
                        className={`aspect-square rounded-md flex items-center justify-center text-sm font-bold ${
                          selectedEpisode === ep.episodeNumber
                            ? 'bg-primary text-white'
                            : 'bg-white/[0.06] hover:bg-white/10'
                        }`}
                      >
                        {ep.episodeNumber}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {movie.mediaType === 'anime' && detail.episodes && (
                <div className="mb-8">
                  <h3 className="text-xl font-display font-bold mb-4">Episodes</h3>
                  <div className="grid grid-cols-4 gap-2 min-[360px]:grid-cols-5 sm:grid-cols-8 md:grid-cols-10">
                    {Array.from({ length: Math.min(detail.episodes, 50) }, (_, i) => i + 1).map(
                      (n) => (
                        <button
                          key={n}
                          onClick={() => setSelectedEpisode(n)}
                          className={`aspect-square rounded-md flex items-center justify-center text-sm font-bold ${
                            selectedEpisode === n
                              ? 'bg-primary text-white'
                              : 'bg-white/[0.06] hover:bg-white/10'
                          }`}
                        >
                          {n}
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}

              <CastRow cast={cast} />
              <RelationsRail relations={relations} />
              <RecommendationsRail items={recommendations} />
              <ReviewsSection movieId={detail.id} />
            </>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
