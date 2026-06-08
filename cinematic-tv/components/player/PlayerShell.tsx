'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Captions, CaptionsOff } from 'lucide-react';
import {
  getDefaultServerId,
  getOrderedServers,
  getServerById,
  getServerQueueIds,
} from '@/lib/servers';
import { createLogger } from '@/lib/logger';
import { useContinueWatching } from '@/hooks/useContinueWatching';
import { getUserSettings } from '@/lib/user-settings';
import { usePlayerStore } from '@/stores/usePlayerStore';
import type { MediaItem, SeasonInfo } from '@/lib/types';
import { ServerSearchPanel } from './ServerSearchPanel';
import { PlaybackErrorPanel } from './PlaybackErrorPanel';
import { IframePlayer } from './IframePlayer';
import { ResumePrompt } from './ResumePrompt';
import { EpisodeNav } from './EpisodeNav';
import { SkipIntroButton } from './SkipIntroButton';
import { SubtitleOverlay } from './SubtitleOverlay';
import { ServerPickerBar } from './ServerPickerBar';

const log = createLogger('player:failover');

type Props = {
  item: MediaItem;
  season: number;
  episode: number;
  maxEpisode?: number;
  maxSeason?: number;
  seasons?: SeasonInfo[];
};

export function PlayerShell({ item, season, episode, maxEpisode = 1, maxSeason, seasons }: Props) {
  const router = useRouter();
  const { record, items: cwItems } = useContinueWatching();
  const iframeContainerRef = useRef<HTMLDivElement>(null);
  const [iframeEl, setIframeEl] = useState<HTMLIFrameElement | null>(null);

  const servers = getOrderedServers();
  const status = usePlayerStore((s) => s.status);
  const activeServerId = usePlayerStore((s) => s.activeServerId);
  const startAtSec = usePlayerStore((s) => s.startAtSec);
  const resumeDismissed = usePlayerStore((s) => s.resumeDismissed);
  const subtitlesEnabled = usePlayerStore((s) => s.subtitlesEnabled);
  const subtitleTracks = usePlayerStore((s) => s.subtitleTracks);

  const initSession = usePlayerStore((s) => s.initSession);
  const setActiveServer = usePlayerStore((s) => s.setActiveServer);
  const markServerFailed = usePlayerStore((s) => s.markServerFailed);
  const getNextServerId = usePlayerStore((s) => s.getNextServerId);
  const setError = usePlayerStore((s) => s.setError);
  const incrementRetry = usePlayerStore((s) => s.incrementRetry);
  const setStartAt = usePlayerStore((s) => s.setStartAt);
  const dismissResume = usePlayerStore((s) => s.dismissResume);
  const setIntroSegments = usePlayerStore((s) => s.setIntroSegments);
  const setSubtitleTracks = usePlayerStore((s) => s.setSubtitleTracks);
  const toggleSubtitles = usePlayerStore((s) => s.toggleSubtitles);
  const reset = usePlayerStore((s) => s.reset);

  const cwKey = `${item.source}-${item.mediaType}-${item.tmdbId ?? item.anilistId}`;
  const cwEntry = cwItems.find(
    (e) => `${e.source}-${e.mediaType}-${e.tmdbId ?? e.anilistId}` === cwKey
  );

  const showResume =
    !resumeDismissed &&
    cwEntry &&
    (cwEntry.progressPercent ?? 0) > 5 &&
    cwEntry.season === season &&
    cwEntry.episode === episode;

  useEffect(() => {
    const queue = getServerQueueIds();
    const defaultId = getDefaultServerId();
    initSession(
      {
        source: item.source,
        mediaType: item.mediaType,
        itemId: item.id,
        tmdbId: item.tmdbId,
        anilistId: item.anilistId,
        imdbId: item.imdbId,
        malId: item.malId,
        season,
        episode,
        title: item.title,
      },
      queue,
      defaultId
    );
    return () => reset();
  }, [item.id, season, episode, initSession, reset, item]);

  useEffect(() => {
    record({ ...item, season, episode });
  }, [item, season, episode, record]);

  useEffect(() => {
    const container = iframeContainerRef.current;
    if (!container) return;
    const observer = new MutationObserver(() => {
      const iframe = container.querySelector<HTMLIFrameElement>('iframe[data-player-iframe]');
      setIframeEl(iframe);
    });
    observer.observe(container, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [activeServerId, status]);

  useEffect(() => {
    if (!item.tmdbId && !item.imdbId) return;
    const id = item.imdbId ?? String(item.tmdbId);
    const qs = new URLSearchParams({
      id,
      ...(item.mediaType === 'tv' ? { season: String(season), episode: String(episode) } : {}),
    });
    fetch(`/api/providers/introdb/segments?${qs}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.segments) setIntroSegments(data.segments);
      })
      .catch(() => {});
  }, [item.tmdbId, item.imdbId, item.mediaType, season, episode, setIntroSegments]);

  useEffect(() => {
    const lang = getUserSettings().preferredSubtitleLanguage;
    const id = item.imdbId ?? (item.tmdbId ? String(item.tmdbId) : null);
    if (!id) return;
    const qs = new URLSearchParams({
      id,
      language: lang,
      format: 'vtt',
      ...(item.mediaType === 'tv' ? { season: String(season), episode: String(episode) } : {}),
    });
    fetch(`/api/providers/wyzie/subtitles?${qs}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.tracks?.length) setSubtitleTracks(data.tracks);
      })
      .catch(() => {});
  }, [item.tmdbId, item.imdbId, item.mediaType, season, episode, setSubtitleTracks]);

  const failoverToNext = useCallback((reason?: string) => {
    if (activeServerId) {
      markServerFailed(activeServerId);
      log.warn('server failover', { from: activeServerId, item: item.id, reason });
    }
    const nextId = getNextServerId();
    if (nextId) {
      incrementRetry();
      setActiveServer(nextId);
    } else {
      setError(reason ?? 'All servers failed for this title');
    }
  }, [activeServerId, markServerFailed, getNextServerId, incrementRetry, setActiveServer, setError, item.id]);

  const handleLoadFail = useCallback((reason?: string) => {
    failoverToNext(reason);
  }, [failoverToNext]);

  const handleProgress = useCallback(
    (percent: number, currentSec: number) => {
      record({ ...item, season, episode }, percent, currentSec);
    },
    [record, item, season, episode]
  );

  const handleResume = () => {
    const resumeSec =
      cwEntry?.currentTimeSec ??
      (cwEntry?.progressPercent ? cwEntry.progressPercent * 0.01 * 3600 : 0);
    if (resumeSec > 0) setStartAt(resumeSec);
    dismissResume();
  };

  const handleStartOver = () => {
    setStartAt(null);
    dismissResume();
  };

  const hasNextServer = Boolean(getNextServerId());

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col min-w-0">
      <div className="shrink-0 bg-black/90 border-b border-white/10">
        <div className="flex items-center justify-between gap-3 px-3 md:px-4 py-3 min-w-0">
          <button
            onClick={() => router.back()}
            className="flex min-w-0 shrink-0 items-center gap-2 rounded-md px-1.5 py-1 text-white/80 transition hover:bg-white/10 hover:text-white sm:shrink"
            aria-label="Back to previous page"
          >
            <ArrowLeft className="w-5 h-5 shrink-0" />
            <span className="text-sm font-bold">Back</span>
            <span className="hidden min-[420px]:inline max-w-[160px] truncate text-sm font-medium text-white/55 sm:max-w-[260px]">
              {item.title}
            </span>
          </button>

          <div className="flex items-center gap-2 shrink-0">
            {(item.mediaType === 'tv' || item.mediaType === 'anime') && (
              <EpisodeNav
                item={item}
                season={season}
                episode={episode}
                maxEpisode={maxEpisode}
                maxSeason={maxSeason}
                seasons={seasons}
              />
            )}
            {subtitleTracks.length > 0 && (
              <button
                onClick={() => toggleSubtitles(!subtitlesEnabled)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white shrink-0"
                aria-label="Toggle subtitles"
              >
                {subtitlesEnabled ? <Captions className="w-4 h-4" /> : <CaptionsOff className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>

        <ServerPickerBar
          servers={servers}
          activeId={activeServerId}
          onSelect={setActiveServer}
        />
      </div>

      <div ref={iframeContainerRef} className="relative flex-1">
        {status === 'SEARCHING' && <ServerSearchPanel />}
        {status === 'ERROR' && (
          <PlaybackErrorPanel
            onRetry={() => activeServerId && setActiveServer(activeServerId)}
            onTryNext={failoverToNext}
            hasNextServer={hasNextServer}
          />
        )}
        {showResume && cwEntry && (
          <ResumePrompt
            progressPercent={cwEntry.progressPercent ?? 0}
            currentTimeSec={
              cwEntry.currentTimeSec ?? (cwEntry.progressPercent ?? 0) * 0.01 * 3600
            }
            onResume={handleResume}
            onStartOver={handleStartOver}
          />
        )}
        {!showResume && (
          <IframePlayer
            item={item}
            season={season}
            episode={episode}
            onLoadFail={handleLoadFail}
            onProgress={handleProgress}
          />
        )}
        <SubtitleOverlay />
        {activeServerId && iframeEl && (
          <SkipIntroButton
            iframeRef={{ current: iframeEl }}
            serverId={activeServerId}
          />
        )}
      </div>
    </div>
  );
}
