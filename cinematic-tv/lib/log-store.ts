export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LogEntry = {
  id: string;
  ts: string;
  level: LogLevel;
  scope: string;
  message: string;
  requestId?: string;
  meta?: Record<string, unknown>;
  error?: { name: string; message: string; stack?: string };
};

const MAX_ENTRIES = 300;

type LogStoreGlobal = { __cinematicLogStore?: LogEntry[] };

function getBuffer(): LogEntry[] {
  const g = globalThis as LogStoreGlobal;
  if (!g.__cinematicLogStore) g.__cinematicLogStore = [];
  return g.__cinematicLogStore;
}

let seq = 0;

export function pushLog(entry: Omit<LogEntry, 'id' | 'ts'> & { ts?: string }): LogEntry {
  const full: LogEntry = {
    id: `${Date.now()}-${++seq}`,
    ts: entry.ts ?? new Date().toISOString(),
    level: entry.level,
    scope: entry.scope,
    message: entry.message,
    requestId: entry.requestId,
    meta: entry.meta,
    error: entry.error,
  };
  const buf = getBuffer();
  buf.push(full);
  if (buf.length > MAX_ENTRIES) buf.splice(0, buf.length - MAX_ENTRIES);
  return full;
}

export function getRecentLogs(limit = 100, level?: LogLevel): LogEntry[] {
  const buf = getBuffer();
  const filtered = level ? buf.filter((e) => e.level === level) : buf;
  return filtered.slice(-limit).reverse();
}

export function getLogStats() {
  const buf = getBuffer();
  const failoverEvents = buf.filter((e) => e.scope === 'player:failover');
  const sandboxEvents = buf.filter((e) => e.scope === 'player:sandbox');
  return {
    total: buf.length,
    errors: buf.filter((e) => e.level === 'error').length,
    warns: buf.filter((e) => e.level === 'warn').length,
    failoverCount: failoverEvents.length,
    sandboxBlockedCount: sandboxEvents.length,
    lastFailover: failoverEvents[failoverEvents.length - 1] ?? null,
    lastSandboxBlock: sandboxEvents[sandboxEvents.length - 1] ?? null,
    lastError: [...buf].reverse().find((e) => e.level === 'error') ?? null,
  };
}

export function clearLogs() {
  const g = globalThis as LogStoreGlobal;
  g.__cinematicLogStore = [];
}
