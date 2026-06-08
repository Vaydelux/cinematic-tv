'use client';

import { useEffect } from 'react';
import { createLogger } from '@/lib/logger';

const log = createLogger('global-error');

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    log.error('global error boundary', error, { digest: error.digest });
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-black text-white min-h-screen flex flex-col items-center justify-center gap-4 p-8">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="text-white/60 text-center max-w-md">{error.message}</p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-red-600 hover:bg-red-500 rounded-xl font-bold"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
