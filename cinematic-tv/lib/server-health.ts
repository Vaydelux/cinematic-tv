const KEY = 'cinematic-server-health';

export type ServerHealthEntry = {
  success: number;
  failure: number;
  lastSuccessAt?: string;
  lastFailureAt?: string;
};

export type ServerHealthMap = Record<string, ServerHealthEntry>;

function emptyEntry(): ServerHealthEntry {
  return { success: 0, failure: 0 };
}

export function getServerHealthMap(): ServerHealthMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ServerHealthMap) : {};
  } catch {
    return {};
  }
}

function save(map: ServerHealthMap): void {
  localStorage.setItem(KEY, JSON.stringify(map));
}

export function recordServerSuccess(serverId: string): void {
  const map = getServerHealthMap();
  const entry = map[serverId] ?? emptyEntry();
  entry.success += 1;
  entry.lastSuccessAt = new Date().toISOString();
  map[serverId] = entry;
  save(map);
}

export function recordServerFailure(serverId: string): void {
  const map = getServerHealthMap();
  const entry = map[serverId] ?? emptyEntry();
  entry.failure += 1;
  entry.lastFailureAt = new Date().toISOString();
  map[serverId] = entry;
  save(map);
}

export function getServerSuccessRate(serverId: string): number | null {
  const entry = getServerHealthMap()[serverId];
  if (!entry) return null;
  const total = entry.success + entry.failure;
  if (total === 0) return null;
  return Math.round((entry.success / total) * 100);
}

export function getServerHealthSummary(): {
  servers: { id: string; successRate: number; success: number; failure: number }[];
  avgSuccessRate: number | null;
} {
  const map = getServerHealthMap();
  const servers = Object.entries(map).map(([id, e]) => {
    const total = e.success + e.failure;
    const successRate = total > 0 ? Math.round((e.success / total) * 100) : 0;
    return { id, successRate, success: e.success, failure: e.failure };
  });
  const withData = servers.filter((s) => s.success + s.failure > 0);
  const avgSuccessRate =
    withData.length > 0
      ? Math.round(withData.reduce((sum, s) => sum + s.successRate, 0) / withData.length)
      : null;
  return { servers, avgSuccessRate };
}
