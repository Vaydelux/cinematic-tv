import { NextRequest, NextResponse } from 'next/server';
import { resolvePlayback, type PlaybackResolveParams } from '@/lib/player/resolve-playback';
import type { IframeSandboxMode } from '@/lib/types';

function optionalNumber(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const serverId = searchParams.get('serverId');
  const mediaType = searchParams.get('mediaType');

  if (!serverId || !mediaType || !['movie', 'tv', 'anime'].includes(mediaType)) {
    return NextResponse.json(
      { error: 'invalid_request', reason: 'A valid serverId and mediaType are required.' },
      { status: 400 }
    );
  }

  const sandboxMode = searchParams.get('iframeSandboxMode') === 'compatibility'
    ? 'compatibility'
    : 'strict';

  const params: PlaybackResolveParams = {
    serverId,
    mediaType: mediaType as PlaybackResolveParams['mediaType'],
    tmdbId: optionalNumber(searchParams.get('tmdbId')),
    imdbId: searchParams.get('imdbId') ?? undefined,
    anilistId: optionalNumber(searchParams.get('anilistId')),
    malId: optionalNumber(searchParams.get('malId')),
    season: optionalNumber(searchParams.get('season')),
    episode: optionalNumber(searchParams.get('episode')),
    startAt: optionalNumber(searchParams.get('startAt')),
    iframeSandboxMode: sandboxMode as IframeSandboxMode,
  };

  try {
    const result = resolvePlayback(params);
    const status = 'error' in result ? 409 : 200;
    return NextResponse.json(result, { status });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'resolve_failed',
        reason: error instanceof Error ? error.message : 'Playback source could not be resolved.',
      },
      { status: 500 }
    );
  }
}
