import { NextResponse } from 'next/server';
import { cacheStats } from '@/lib/cache';
import { getEnv } from '@/lib/env';
import { getLogStats } from '@/lib/log-store';

export async function GET() {
  const env = getEnv();
  const logs = getLogStats();
  return NextResponse.json({
    status: 'ok',
    tmdbConfigured: Boolean(env.TMDB_ACCESS_TOKEN),
    anilistConfigured: true,
    cache: cacheStats(),
    logs: {
      buffered: logs.total,
      errors: logs.errors,
      warns: logs.warns,
      failoverCount: logs.failoverCount,
      lastFailover: logs.lastFailover
        ? { message: logs.lastFailover.message, meta: logs.lastFailover.meta, ts: logs.lastFailover.ts }
        : null,
      lastError: logs.lastError
        ? { message: logs.lastError.message, scope: logs.lastError.scope, ts: logs.lastError.ts }
        : null,
    },
    player: {
      serverHealthNote: 'Per-server success rates are stored client-side in localStorage (cinematic-server-health)',
    },
    logApi: process.env.NODE_ENV === 'development' ? '/api/logs' : null,
    timestamp: new Date().toISOString(),
  });
}
