'use client';

import { useEffect } from 'react';
import { createLogger } from '@/lib/logger';

const log = createLogger('watch:error');

export default function WatchError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    log.error('watch route error', error);
  }, [error]);
  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-4 text-white">
      <p className="text-white/60">{error.message}</p>
      <button onClick={reset} className="px-6 py-2 bg-primary rounded-lg font-bold">
        Try again
      </button>
    </div>
  );
}
