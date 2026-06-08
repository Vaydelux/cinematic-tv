import { pushLog, type LogEntry, type LogLevel } from './log-store';

const LEVEL_RANK: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function getMinLevel(): LogLevel {
  const configured = process.env.LOG_LEVEL as LogLevel | undefined;
  if (configured && configured in LEVEL_RANK) return configured;
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
}

function shouldLog(level: LogLevel): boolean {
  return LEVEL_RANK[level] >= LEVEL_RANK[getMinLevel()];
}

function serializeError(err: unknown): LogEntry['error'] | undefined {
  if (!err) return undefined;
  if (err instanceof Error) {
    return { name: err.name, message: err.message, stack: err.stack };
  }
  return { name: 'Error', message: String(err) };
}

function formatConsole(entry: LogEntry): string {
  const rid = entry.requestId ? ` [${entry.requestId}]` : '';
  const meta = entry.meta && Object.keys(entry.meta).length ? ` ${JSON.stringify(entry.meta)}` : '';
  return `[${entry.ts}] ${entry.level.toUpperCase()} ${entry.scope}${rid}: ${entry.message}${meta}`;
}

function reportClientLog(entry: LogEntry) {
  if (typeof window === 'undefined') return;
  try {
    void fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entry }),
      keepalive: true,
    });
  } catch {
    // ignore reporting failures
  }
}

function write(entry: Omit<LogEntry, 'id' | 'ts'> & { ts?: string }) {
  if (!shouldLog(entry.level)) return;

  const stored: LogEntry =
    typeof window === 'undefined'
      ? pushLog(entry)
      : {
          id: 'client',
          ts: entry.ts ?? new Date().toISOString(),
          level: entry.level,
          scope: entry.scope,
          message: entry.message,
          requestId: entry.requestId,
          meta: entry.meta,
          error: entry.error,
        };
  const line = formatConsole(stored);
  const method = entry.level === 'debug' ? 'debug' : entry.level;
  console[method](line, entry.error ?? entry.meta ?? '');

  if (typeof window !== 'undefined' && (entry.level === 'warn' || entry.level === 'error')) {
    reportClientLog(stored);
  }
}

export type Logger = {
  debug: (message: string, meta?: Record<string, unknown>) => void;
  info: (message: string, meta?: Record<string, unknown>) => void;
  warn: (message: string, meta?: Record<string, unknown>) => void;
  error: (message: string, err?: unknown, meta?: Record<string, unknown>) => void;
  child: (subscope: string) => Logger;
};

export function createLogger(scope: string, requestId?: string): Logger {
  const base = { scope, requestId };
  return {
    debug: (message, meta) => write({ ...base, level: 'debug', message, meta }),
    info: (message, meta) => write({ ...base, level: 'info', message, meta }),
    warn: (message, meta) => write({ ...base, level: 'warn', message, meta }),
    error: (message, err, meta) =>
      write({ ...base, level: 'error', message, meta, error: serializeError(err) }),
    child: (subscope) => createLogger(`${scope}:${subscope}`, requestId),
  };
}

export const logger = createLogger('app');

export function getRequestId(req?: { headers?: { get?: (k: string) => string | null } }): string {
  return req?.headers?.get?.('x-request-id') ?? `req-${Date.now().toString(36)}`;
}

export async function withApiLog<T>(
  scope: string,
  req: Request,
  fn: (log: Logger) => Promise<T>
): Promise<T> {
  const requestId = getRequestId(req);
  const log = createLogger(scope, requestId);
  const url = new URL(req.url);
  const start = Date.now();
  log.info(`${req.method} ${url.pathname}`, { query: url.search || undefined });
  try {
    const result = await fn(log);
    log.info(`completed ${req.method} ${url.pathname}`, { durationMs: Date.now() - start, status: 'ok' });
    return result;
  } catch (err) {
    log.error(`failed ${req.method} ${url.pathname}`, err, { durationMs: Date.now() - start });
    throw err;
  }
}
