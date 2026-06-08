import { NextRequest, NextResponse } from 'next/server';
import { clearLogs, getLogStats, getRecentLogs, pushLog, type LogEntry } from '@/lib/log-store';
import { createLogger } from '@/lib/logger';

const log = createLogger('api:logs');

function isDevLoggingEnabled() {
  return process.env.NODE_ENV === 'development' || process.env.ENABLE_LOG_API === 'true';
}

export async function GET(req: NextRequest) {
  if (!isDevLoggingEnabled()) {
    return NextResponse.json({ error: 'Log API disabled in production' }, { status: 403 });
  }

  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '100', 10), 300);
  const level = url.searchParams.get('level') as LogEntry['level'] | null;

  if (url.searchParams.get('clear') === '1') {
    clearLogs();
    log.info('log buffer cleared');
  }

  return NextResponse.json({
    stats: getLogStats(),
    logs: getRecentLogs(limit, level ?? undefined),
  });
}

export async function POST(req: NextRequest) {
  if (!isDevLoggingEnabled()) {
    return NextResponse.json({ ok: true });
  }

  try {
    const body = await req.json();
    const entry = body.entry as Partial<LogEntry>;
    if (!entry?.level || !entry.message) {
      return NextResponse.json({ error: 'Invalid log entry' }, { status: 400 });
    }

    pushLog({
      level: entry.level,
      scope: entry.scope ?? 'client',
      message: entry.message,
      requestId: entry.requestId,
      meta: { ...entry.meta, source: 'browser' },
      error: entry.error,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    log.error('failed to ingest client log', e);
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}
