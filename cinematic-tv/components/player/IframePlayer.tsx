'use client';

import { useEffect, useRef, useState } from 'react';
import {
  getServerById,
  type EmbedParams,
} from '@/lib/servers';
import { createLogger } from '@/lib/logger';
import { recordServerSuccess, recordServerFailure } from '@/lib/server-health';
import {
  isProgressCapableServer,
  isTrustedPlayerOrigin,
  parsePlayerMessage,
} from '@/lib/player/post-message';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { getUserSettings } from '@/lib/user-settings';
import type { PlaybackResolveResponse } from '@/lib/player/resolve-playback';
import type { MediaItem } from '@/lib/types';

const log = createLogger('player:iframe');
const sandboxLog = createLogger('player:sandbox');
const LOAD_TIMEOUT_MS = 15000;

type Props = {
  item: MediaItem;
  season: number;
  episode: number;
  onLoadFail: (reason?: string) => void;
  onProgress: (percent: number, currentSec: number) => void;
};

export function IframePlayer({ item, season, episode, onLoadFail, onProgress }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const loadedRef = useRef(false);
  const [resolution, setResolution] = useState<PlaybackResolveResponse | null>(null);

  const activeServerId = usePlayerStore((s) => s.activeServerId);
  const startAtSec = usePlayerStore((s) => s.startAtSec);
  const setStatus = usePlayerStore((s) => s.setStatus);

  const server = activeServerId ? getServerById(activeServerId) : undefined;

  const embedParams: EmbedParams = {
    mediaType: item.mediaType === 'anime' ? 'anime' : item.mediaType === 'tv' ? 'tv' : 'movie',
    tmdbId: item.tmdbId,
    imdbId: item.imdbId,
    anilistId: item.anilistId,
    malId: item.malId,
    season,
    episode,
  };

  const settings = getUserSettings();
  const iframeKey = `${activeServerId}-${item.id}-${season}-${episode}-${startAtSec ?? 0}-${settings.iframeSandboxMode}`;
  const iframeResolution = resolution && !('error' in resolution) && resolution.mode === 'iframe' ? resolution : null;
  const directResolution = resolution && !('error' in resolution) && resolution.mode === 'direct' ? resolution : null;
  const embedUrl = iframeResolution?.url ?? '';

  useEffect(() => {
    if (!activeServerId || !server) return;
    let cancelled = false;
    loadedRef.current = false;
    setResolution(null);
    setStatus('SEARCHING', `Resolving ${server.name}...`);

    const qs = new URLSearchParams({
      serverId: activeServerId,
      mediaType: embedParams.mediaType,
      season: String(season),
      episode: String(episode),
      iframeSandboxMode: settings.iframeSandboxMode,
    });
    if (item.tmdbId) qs.set('tmdbId', String(item.tmdbId));
    if (item.imdbId) qs.set('imdbId', item.imdbId);
    if (item.anilistId) qs.set('anilistId', String(item.anilistId));
    if (item.malId) qs.set('malId', String(item.malId));
    if (startAtSec && startAtSec > 0) qs.set('startAt', String(Math.floor(startAtSec)));

    fetch(`/api/player/resolve?${qs.toString()}`)
      .then(async (response) => {
        const data = (await response.json()) as PlaybackResolveResponse;
        if (!cancelled) {
          if ('error' in data) {
            const blockedBySandbox = data.error === 'compatibility_required' || data.error === 'sandbox_unsupported';
            const targetLog = blockedBySandbox ? sandboxLog : log;
            targetLog.warn('playback resolver blocked provider', { serverId: activeServerId, error: data.error });
            recordServerFailure(activeServerId);
            setStatus('SEARCHING', `${data.reason} Trying next server...`);
            window.setTimeout(() => onLoadFail(data.reason), 250);
            return;
          }
          log.info('playback source resolved', { serverId: activeServerId, mode: data.mode });
          setResolution(data);
          if (data.mode === 'direct') setStatus('PLAYING');
        }
      })
      .catch((error) => {
        if (cancelled) return;
        log.error('playback resolve failed', error, { serverId: activeServerId });
        recordServerFailure(activeServerId);
        onLoadFail('Playback source could not be resolved.');
      });

    return () => {
      cancelled = true;
    };
  }, [iframeKey, activeServerId, server, season, episode, item.tmdbId, item.imdbId, item.anilistId, item.malId, startAtSec, onLoadFail, setStatus, embedParams.mediaType, settings.iframeSandboxMode]);

  useEffect(() => {
    if (!activeServerId || !server || !embedUrl) return;
    loadedRef.current = false;
    setStatus('SEARCHING', `Loading ${server.name}...`);
    log.info('iframe load start', { serverId: activeServerId, embedUrl: embedUrl.slice(0, 120) });
    const timer = setTimeout(() => {
      if (!loadedRef.current) {
        log.warn('iframe load timeout', { serverId: activeServerId, item: item.id });
        if (activeServerId) recordServerFailure(activeServerId);
        onLoadFail('Playback server timed out. Trying next server.');
      }
    }, LOAD_TIMEOUT_MS);

    return () => clearTimeout(timer);
  }, [activeServerId, embedUrl, item.id, onLoadFail, server, setStatus]);

  useEffect(() => {
    if (!activeServerId || !isProgressCapableServer(activeServerId)) return;

    const handler = (event: MessageEvent) => {
      if (!server || !isTrustedPlayerOrigin(event.origin, server.domains, embedUrl)) return;
      const parsed = parsePlayerMessage(event.data, activeServerId);
      if (!parsed) return;
      usePlayerStore.getState().setProgress(parsed.currentTimeSec, parsed.durationSec);
      onProgress(parsed.progressPercent, parsed.currentTimeSec);
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [activeServerId, embedUrl, onProgress, server]);

  if (!server) {
    return (
      <div className="flex items-center justify-center h-full text-white/50">
        No compatible playback server is selected.
      </div>
    );
  }

  if (directResolution) {
    return (
      <video
        key={iframeKey}
        className="h-full w-full bg-black"
        src={directResolution.src}
        controls
        autoPlay
        playsInline
        onLoadedMetadata={(event) => {
          const duration = event.currentTarget.duration;
          if (Number.isFinite(duration) && startAtSec && startAtSec > 0) {
            event.currentTarget.currentTime = startAtSec;
          }
          if (activeServerId) recordServerSuccess(activeServerId);
          setStatus('PLAYING');
        }}
        onTimeUpdate={(event) => {
          const video = event.currentTarget;
          if (video.duration > 0) {
            onProgress((video.currentTime / video.duration) * 100, video.currentTime);
          }
        }}
        onError={() => {
          if (activeServerId) recordServerFailure(activeServerId);
          onLoadFail('Direct playback failed. Trying next server.');
        }}
      />
    );
  }

  if (!embedUrl || !iframeResolution) {
    return <div className="h-full w-full bg-black" />;
  }

  return (
    <iframe
      ref={iframeRef}
      key={iframeKey}
      src={embedUrl}
      className="w-full h-full border-0"
      allowFullScreen
      allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
      sandbox={iframeResolution.sandbox}
      referrerPolicy="origin"
      loading="eager"
      onLoad={() => {
        loadedRef.current = true;
        if (activeServerId) recordServerSuccess(activeServerId);
        setStatus('PLAYING');
        log.info('iframe loaded', { serverId: activeServerId });
      }}
      data-player-iframe
    />
  );
}

export function usePlayerIframeRef() {
  return useRef<HTMLIFrameElement>(null);
}
