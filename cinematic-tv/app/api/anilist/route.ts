import { NextRequest, NextResponse } from 'next/server';
import { anilistQuery } from '@/lib/anilist/client';
import { ALLOWED_OPERATIONS } from '@/lib/anilist/queries';
import { createLogger, getRequestId } from '@/lib/logger';

export async function POST(req: NextRequest) {
  const log = createLogger('api:anilist', getRequestId(req));
  const start = Date.now();

  let operation = 'unknown';
  try {
    const body = await req.json();
    const parsed = body as { operation: string; variables?: Record<string, unknown> };
    operation = parsed.operation;

    if (!operation || !ALLOWED_OPERATIONS[operation]) {
      log.warn('blocked operation', { operation });
      return NextResponse.json({ error: 'Operation not allowed', code: 403 }, { status: 403 });
    }

    const data = await anilistQuery(operation, parsed.variables ?? {});
    log.info('graphql ok', { operation, durationMs: Date.now() - start });
    return NextResponse.json({ data });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    const status = message.includes('429') || message.includes('Too Many') ? 429 : 500;
    log.error('graphql failed', e, { operation, durationMs: Date.now() - start, status });
    return NextResponse.json({ error: message, code: status }, { status });
  }
}
