import { NextRequest, NextResponse } from 'next/server';
import { fetchIntroSegments } from '@/lib/providers/introdb';
import { createLogger, getRequestId } from '@/lib/logger';

export async function GET(req: NextRequest) {
  const log = createLogger('api:introdb', getRequestId(req));
  const id = req.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }

  const season = req.nextUrl.searchParams.get('season');
  const episode = req.nextUrl.searchParams.get('episode');

  try {
    const segments = await fetchIntroSegments({
      id,
      season: season ? parseInt(season, 10) : undefined,
      episode: episode ? parseInt(episode, 10) : undefined,
    });
    return NextResponse.json(
      { segments },
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } }
    );
  } catch (err) {
    log.error('introdb fetch failed', err);
    return NextResponse.json({ segments: [] });
  }
}
