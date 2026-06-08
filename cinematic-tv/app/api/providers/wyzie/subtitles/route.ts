import { NextRequest, NextResponse } from 'next/server';
import { fetchWyzieSubtitles } from '@/lib/providers/wyzie';
import { createLogger, getRequestId } from '@/lib/logger';

export async function GET(req: NextRequest) {
  const log = createLogger('api:wyzie', getRequestId(req));
  const id = req.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }

  const season = req.nextUrl.searchParams.get('season');
  const episode = req.nextUrl.searchParams.get('episode');
  const language = req.nextUrl.searchParams.get('language') ?? 'en';
  const format = (req.nextUrl.searchParams.get('format') ?? 'vtt') as 'vtt' | 'srt' | 'ass';

  try {
    const tracks = await fetchWyzieSubtitles({
      id,
      season: season ? parseInt(season, 10) : undefined,
      episode: episode ? parseInt(episode, 10) : undefined,
      language,
      format,
    });
    return NextResponse.json(
      { tracks },
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=43200' } }
    );
  } catch (err) {
    log.error('wyzie fetch failed', err);
    return NextResponse.json({ tracks: [] });
  }
}
