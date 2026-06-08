'use client';

import { useEffect, useRef } from 'react';
import {
  buildEmbedUrl,
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
import type { MediaItem } from '@/lib/types';

const log = createLogger('player:iframe');
const LOAD_TIMEOUT_MS = 15000;

type Props = {
  item: MediaItem;
  season: number;
  episode: number;
  onLoadFail: () => void;
  onProgress: (percent: number, currentSec: number) => void;
};

export function IframePlayer({ item, season, episode, onLoadFail, onProgress }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const loadedRef = useRef(false);

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

  let embedUrl = '';
  try {
    embedUrl = server ? buildEmbedUrl(server, embedParams, { startAt: startAtSec ?? undefined }) : '';
  } catch (err) {
    log.error('embed URL build failed', err, { serverId: activeServerId });
  }

  const iframeKey = `${activeServerId}-${item.id}-${season}-${episode}-${startAtSec ?? 0}`;

  useEffect(() => {
    if (!activeServerId || !embedUrl) return;
    loadedRef.current = false;
    setStatus('SEARCHING', `Loading ${server?.name ?? activeServerId}…`);

    log.info('iframe load start', { serverId: activeServerId, embedUrl: embedUrl.slice(0, 120) });

    const timer = setTimeout(() => {
      if (!loadedRef.current) {
        log.warn('iframe load timeout', { serverId: activeServerId, item: item.id });
        if (activeServerId) recordServerFailure(activeServerId);
        onLoadFail();
      }
    }, LOAD_TIMEOUT_MS);

    return () => clearTimeout(timer);
  }, [iframeKey, activeServerId, embedUrl, item.id, onLoadFail, server?.name, setStatus]);

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

  if (!embedUrl) {
    return (
      <div className="flex items-center justify-center h-full text-white/50">
        No compatible embed URL for this title on {server?.name}
      </div>
    );
  }

  return (
    <iframe
      ref={iframeRef}
      key={iframeKey}
      src={embedUrl}
      className="w-full h-full border-0"
      allowFullScreen
      allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
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
