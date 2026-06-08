'use client';

import { RefreshCw, SkipForward } from 'lucide-react';
import { usePlayerStore } from '@/stores/usePlayerStore';

type Props = {
  onRetry: () => void;
  onTryNext: () => void;
  hasNextServer: boolean;
};

export function PlaybackErrorPanel({ onRetry, onTryNext, hasNextServer }: Props) {
  const message = usePlayerStore((s) => s.errorMessage);
  const retryCount = usePlayerStore((s) => s.retryCount);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-10 gap-4 bg-black/[0.85] p-6">
      <div className="max-w-md rounded-lg border border-white/10 bg-black/60 p-6 text-center shadow-2xl">
        <p className="text-white/75 text-sm">
          {message ?? 'Failed to load. Try another server.'}
        </p>
        {retryCount > 0 && (
          <p className="mt-2 text-white/40 text-xs">Attempt {retryCount + 1}</p>
        )}
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-5 py-2.5 rounded-md bg-white/10 hover:bg-white/20 text-white text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
          {hasNextServer && (
            <button
              onClick={onTryNext}
              className="flex items-center gap-2 px-5 py-2.5 rounded-md bg-primary hover:bg-primary/90 text-white text-sm font-bold"
            >
              <SkipForward className="w-4 h-4" />
              Try next server
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
