import { EMBED_SERVER_CATALOG, type EmbedServer } from './embed-servers';
import { getServerSuccessRate } from './server-health';
import { getUserSettings, saveUserSettings } from './user-settings';

export type { EmbedServer };

export const EMBED_SERVERS: EmbedServer[] = EMBED_SERVER_CATALOG;

export type EmbedParams = {
  mediaType: 'movie' | 'tv' | 'anime';
  tmdbId?: number;
  imdbId?: string;
  anilistId?: number;
  malId?: number;
  season?: number;
  episode?: number;
};

export type EmbedUrlOptions = {
  startAt?: number;
};

const START_AT_SERVERS = new Set(['vidfast', 'peachify', 'primesrc', 'videasy', 'vidnest']);

function resolveId(server: EmbedServer, params: EmbedParams): string {
  if (server.idTypes.includes('tmdb') && params.tmdbId) return String(params.tmdbId);
  if (server.idTypes.includes('imdb') && params.imdbId) return params.imdbId;
  if (server.idTypes.includes('anilist') && params.anilistId) return String(params.anilistId);
  if (server.idTypes.includes('mal') && params.malId) return String(params.malId);
  if (params.tmdbId) return String(params.tmdbId);
  if (params.imdbId) return params.imdbId;
  throw new Error('No compatible ID for this server');
}

export function buildEmbedUrl(
  server: EmbedServer,
  params: EmbedParams,
  options?: EmbedUrlOptions
): string {
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
  if (options?.startAt != null && options.startAt > 0 && START_AT_SERVERS.has(server.id)) {
    extra.startAt = String(Math.floor(options.startAt));
  }

  if (Object.keys(extra).length) {
    const qs = new URLSearchParams(extra).toString();
    url += (url.includes('?') ? '&' : '?') + qs;
  }
  return url;
}

function getHiddenServerIds(): string[] {
  if (typeof window === 'undefined') return [];
  return getUserSettings().hiddenServerIds ?? [];
}

export function getAllServers(): EmbedServer[] {
  return EMBED_SERVERS.filter((s) => s.enabled);
}

export function getEnabledServers(): EmbedServer[] {
  const hidden = new Set(getHiddenServerIds());
  const enabled = EMBED_SERVERS.filter((s) => s.enabled);
  const visible = enabled.filter((s) => !hidden.has(s.id));
  return visible.length ? visible : enabled.slice(0, 1);
}

function sortByHealthAndOrder(servers: EmbedServer[], order: string[]): EmbedServer[] {
  const orderIndex = new Map(order.map((id, i) => [id, i]));
  return [...servers].sort((a, b) => {
    const ai = orderIndex.get(a.id);
    const bi = orderIndex.get(b.id);
    if (ai != null && bi != null) return ai - bi;
    if (ai != null) return -1;
    if (bi != null) return 1;
    const ar = getServerSuccessRate(a.id) ?? 50;
    const br = getServerSuccessRate(b.id) ?? 50;
    return br - ar;
  });
}

export function getOrderedServers(): EmbedServer[] {
  const enabled = getEnabledServers();
  const { serverOrder, defaultServerId } = getUserSettings();
  const sorted = sortByHealthAndOrder(enabled, serverOrder);
  if (!defaultServerId) return sorted;
  const idx = sorted.findIndex((s) => s.id === defaultServerId);
  if (idx <= 0) return sorted;
  const copy = [...sorted];
  const [preferred] = copy.splice(idx, 1);
  return [preferred, ...copy];
}

export function getServerQueueIds(): string[] {
  return getOrderedServers().map((s) => s.id);
}

export function getServerById(id: string): EmbedServer | undefined {
  const hidden = new Set(getHiddenServerIds());
  const server = EMBED_SERVERS.find((s) => s.id === id && s.enabled);
  if (!server || hidden.has(server.id)) return undefined;
  return server;
}

export function getDefaultServerId(): string {
  const visible = getEnabledServers();
  const preferred = typeof window !== 'undefined' ? getUserSettings().defaultServerId : 'vidfast';
  if (preferred && visible.some((s) => s.id === preferred)) return preferred;
  return visible[0]?.id ?? 'vidfast';
}

export function isServerVisible(id: string, hiddenIds?: string[]): boolean {
  const hidden = new Set(hiddenIds ?? getHiddenServerIds());
  const server = EMBED_SERVERS.find((s) => s.id === id);
  return Boolean(server?.enabled && !hidden.has(id));
}

export function setServerVisibility(id: string, visible: boolean, currentHidden: string[]): string[] {
  const hidden = new Set(currentHidden);
  if (visible) hidden.delete(id);
  else hidden.add(id);
  return [...hidden];
}

export function persistHiddenServers(hiddenServerIds: string[]): void {
  saveUserSettings({ hiddenServerIds });
}

export function persistServerOrder(serverOrder: string[]): void {
  saveUserSettings({ serverOrder });
}

export function getAllEmbedDomains(): string[] {
  return [...new Set(EMBED_SERVERS.flatMap((s) => s.domains))];
}
