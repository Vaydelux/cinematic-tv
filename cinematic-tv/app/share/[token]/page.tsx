'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { consumeShareToken } from '@/lib/share';

export default function SharePage() {
  const params = useParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleToken() {
      const token = params.token as string;
      if (!token) return;

      try {
        const data = await consumeShareToken(token);
        if (data) {
          if (data.tmdbId && data.mediaType === 'movie') {
            router.push(`/?movie=${data.tmdbId}`);
          } else if (data.tmdbId && data.mediaType === 'tv') {
            router.push(`/?tv=${data.tmdbId}`);
          } else if (data.anilistId) {
            router.push(`/?anime=${data.anilistId}`);
          } else if (data.source && data.mediaType) {
            const id = data.tmdbId ?? data.anilistId;
            router.push(`/?open=${data.source}-${data.mediaType}-${id}`);
          }
        } else {
          setError('This share link is invalid, expired, or has already been used.');
        }
      } catch {
        setError('Failed to validate share link.');
      }
    }

    handleToken();
  }, [params.token, router]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center text-on-surface">
        <h1 className="text-2xl font-bold mb-4">Link Expired</h1>
        <p className="text-on-surface-variant mb-6">{error}</p>
        <button onClick={() => router.push('/')} className="rounded-md bg-primary px-6 py-3 font-bold text-white hover:bg-primary/90">
          Go to Home
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-on-surface">
      <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
  );
}
