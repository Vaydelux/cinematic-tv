'use client';

import { SkipForward } from 'lucide-react';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { buildSkipPostMessage } from '@/lib/player/post-message';

type Props = {
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  serverId: string;
};

export function SkipIntroButton({ iframeRef, serverId }: Props) {
  const segments = usePlayerStore((s) => s.introSegments);
  const currentTimeSec = usePlayerStore((s) => s.currentTimeSec);

  const intro = segments.find((s) => s.type === 'intro');
  if (!intro) return null;

  const introStartSec = intro.startMs / 1000;
  const introEndSec = intro.endMs / 1000;
  const inIntro = currentTimeSec >= introStartSec && currentTimeSec < introEndSec;

  if (!inIntro && currentTimeSec > introEndSec) return null;

  const handleSkip = () => {
    const win = iframeRef.current?.contentWindow;
    if (win) {
      win.postMessage(buildSkipPostMessage(serverId, introEndSec), '*');
    }
    usePlayerStore.getState().setProgress(introEndSec);
  };

  return (
    <button
      onClick={handleSkip}
      className="absolute bottom-24 right-6 z-30 flex items-center gap-2 px-4 py-2 rounded-lg bg-white/90 text-black text-sm font-bold hover:bg-white shadow-lg"
    >
      <SkipForward className="w-4 h-4" />
      Skip Intro
    </button>
  );
}
