'use client';

import { Loader2 } from 'lucide-react';
import { usePlayerStore } from '@/stores/usePlayerStore';

export function ServerSearchPanel() {
  const label = usePlayerStore((s) => s.searchingLabel);
  const serverId = usePlayerStore((s) => s.activeServerId);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-10 gap-3 bg-black/70 backdrop-blur-sm">
      <div className="rounded-lg border border-white/10 bg-black/60 px-8 py-7 text-center shadow-2xl">
        <Loader2 className="mx-auto mb-4 w-10 h-10 text-primary animate-spin" />
        <p className="text-white/80 text-sm">{label || 'Searching servers...'}</p>
        {serverId && <p className="mt-1 text-white/40 text-xs">{serverId}</p>}
      </div>
    </div>
  );
}
