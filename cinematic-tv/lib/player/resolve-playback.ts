import { EMBED_SERVER_CATALOG, type EmbedServer, type SandboxPolicy } from '@/lib/embed-servers';
import type { IframeSandboxMode } from '@/lib/types';

export type PlaybackResolveParams = {
  serverId: string;
  mediaType: 'movie' | 'tv' | 'anime';
  tmdbId?: number;
  imdbId?: string;
  anilistId?: number;
  malId?: number;
  season?: number;
  episode?: number;
  startAt?: number;
  iframeSandboxMode?: IframeSandboxMode;
};

export type IframePlaybackDescriptor = {
  mode: 'iframe';
  url: string;
  sandboxPolicy: SandboxPolicy;
  sandbox?: string;
};

export type DirectPlaybackDescriptor = {
  mode: 'direct';
  src: string;
  contentType: string;
  headers?: Record<string, string>;
};

export type PlaybackResolveResponse =
  | IframePlaybackDescriptor
  | DirectPlaybackDescriptor
  | {
      error: string;
      reason: string;
    };

const STRICT_IFRAME_SANDBOX = [
  'allow-scripts',
  'allow-same-origin',
  'allow-forms',
  'allow-presentation',
].join(' ');

const COMPATIBILITY_IFRAME_SANDBOX = [
  'allow-scripts',
  'allow-same-origin',
  'allow-forms',
  'allow-presentation',
  'allow-popups',
  'allow-top-navigation',
  'allow-modals',
  'allow-pointer-lock',
  'allow-downloads',
].join(' ');

const START_AT_SERVERS = new Set(['vidfast', 'peachify', 'primesrc', 'videasy', 'vidnest']);

function getCatalogServer(serverId: string): EmbedServer | undefined {
  return EMBED_SERVER_CATALOG.find((server) => server.id === serverId && server.enabled);
}

function resolveId(server: EmbedServer, params: PlaybackResolveParams): string {
  if (server.idTypes.includes('tmdb') && params.tmdbId) return String(params.tmdbId);
  if (server.idTypes.includes('imdb') && params.imdbId) return params.imdbId;
  if (server.idTypes.includes('anilist') && params.anilistId) return String(params.anilistId);
  if (server.idTypes.includes('mal') && params.malId) return String(params.malId);
  if (params.tmdbId) return String(params.tmdbId);
  if (params.imdbId) return params.imdbId;
  throw new Error('No compatible ID for this server');
}

export function buildResolvedEmbedUrl(server: EmbedServer, params: PlaybackResolveParams): string {
  const id = resolveId(server, params);
  const season = params.season ?? 1;
  const episode = params.episode ?? 1;

  let url: string;
  if (params.mediaType === 'movie') {
    url = server.movieTemplate
      .replace('{tmdbId}', id)
      .replace('{imdbId}', id)
      .replace('{id}', id);
  } else if (params.mediaType === 'anime' && server.animeTemplate) {
    url = server.animeTemplate
      .replace('{anilistId}', String(params.anilistId ?? id))
      .replace('{malId}', String(params.malId ?? id))
      .replace('{episode}', String(episode))
      .replace('{id}', id);
  } else {
    url = server.tvTemplate
      .replace('{tmdbId}', id)
      .replace('{imdbId}', id)
      .replace('{id}', id)
      .replace('{season}', String(season))
      .replace('{episode}', String(episode));
  }

  const extra: Record<string, string> = { ...(server.defaultParams ?? {}) };
  if (params.startAt != null && params.startAt > 0 && START_AT_SERVERS.has(server.id)) {
    extra.startAt = String(Math.floor(params.startAt));
  }

  if (Object.keys(extra).length) {
    url += (url.includes('?') ? '&' : '?') + new URLSearchParams(extra).toString();
  }

  return url;
}

function buildDirectUrl(server: EmbedServer, params: PlaybackResolveParams): DirectPlaybackDescriptor | null {
  if (!server.directStreamTemplate) return null;
  const id = resolveId(server, params);
  const season = String(params.season ?? 1);
  const episode = String(params.episode ?? 1);
  return {
    mode: 'direct',
    src: server.directStreamTemplate
      .replace('{tmdbId}', String(params.tmdbId ?? id))
      .replace('{imdbId}', params.imdbId ?? id)
      .replace('{anilistId}', String(params.anilistId ?? id))
      .replace('{malId}', String(params.malId ?? id))
      .replace('{id}', id)
      .replace('{season}', season)
      .replace('{episode}', episode),
    contentType: server.directContentType ?? 'video/mp4',
  };
}

export function resolvePlayback(params: PlaybackResolveParams): PlaybackResolveResponse {
  const server = getCatalogServer(params.serverId);
  if (!server) {
    return { error: 'server_not_found', reason: 'Selected playback server is not available.' };
  }

  if (server.playbackMode === 'direct' || server.playbackMode === 'proxy-direct') {
    const direct = buildDirectUrl(server, params);
    if (direct) return direct;
    return {
      error: 'direct_unavailable',
      reason: 'This server is not approved for direct playback yet.',
    };
  }

  const sandboxMode = params.iframeSandboxMode ?? 'strict';
  if (server.sandboxPolicy === 'none') {
    return {
      error: 'sandbox_unsupported',
      reason: 'This provider does not support protected iframe playback.',
    };
  }

  if (server.sandboxPolicy === 'compatibility-only' && sandboxMode !== 'compatibility') {
    return {
      error: 'compatibility_required',
      reason: 'Protected mode blocked this provider because it requires relaxed iframe permissions.',
    };
  }

  return {
    mode: 'iframe',
    url: buildResolvedEmbedUrl(server, params),
    sandboxPolicy: server.sandboxPolicy,
    sandbox: sandboxMode === 'compatibility'
      ? undefined
      : (server.sandboxPolicy === 'compatibility-only'
        ? COMPATIBILITY_IFRAME_SANDBOX
        : STRICT_IFRAME_SANDBOX),
  };
}
