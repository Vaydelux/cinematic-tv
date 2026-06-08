import { Metadata } from 'next';
import { WatchPageClient } from './WatchPageClient';

type Props = {
  params: Promise<{ source: string; mediaType: string; id: string }>;
  searchParams: Promise<{ season?: string; episode?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { source, mediaType, id } = await params;
  return {
    title: `Watch ${mediaType} ${id} | Cinematic TV`,
    description: `Stream ${source} ${mediaType} on Cinematic TV`,
  };
}

export default async function WatchPage({ params, searchParams }: Props) {
  const { source, mediaType, id } = await params;
  const sp = await searchParams;
  const season = parseInt(sp.season ?? '1', 10);
  const episode = parseInt(sp.episode ?? '1', 10);

  return (
    <WatchPageClient
      source={source}
      mediaType={mediaType}
      id={parseInt(id, 10)}
      season={season}
      episode={episode}
    />
  );
}
