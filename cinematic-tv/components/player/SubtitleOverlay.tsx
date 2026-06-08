'use client';

import { useEffect, useState } from 'react';
import { usePlayerStore } from '@/stores/usePlayerStore';

function parseVttSimple(text: string): { start: number; end: number; text: string }[] {
  const cues: { start: number; end: number; text: string }[] = [];
  const blocks = text.trim().split(/\n\n+/);
  for (const block of blocks) {
    const lines = block.split('\n');
    const timeLine = lines.find((l) => l.includes('-->'));
    if (!timeLine) continue;
    const [startStr, endStr] = timeLine.split('-->').map((s) => s.trim());
    const toSec = (t: string) => {
      const [h, m, rest] = t.split(':');
      const [sec] = rest.split(/[.,]/);
      return parseInt(h, 10) * 3600 + parseInt(m, 10) * 60 + parseFloat(sec);
    };
    const cueText = lines.slice(lines.indexOf(timeLine) + 1).join('\n');
    cues.push({ start: toSec(startStr), end: toSec(endStr), text: cueText });
  }
  return cues;
}

export function SubtitleOverlay() {
  const enabled = usePlayerStore((s) => s.subtitlesEnabled);
  const activeId = usePlayerStore((s) => s.activeSubtitleId);
  const tracks = usePlayerStore((s) => s.subtitleTracks);
  const currentTimeSec = usePlayerStore((s) => s.currentTimeSec);
  const [cues, setCues] = useState<{ start: number; end: number; text: string }[]>([]);

  const track = tracks.find((t) => t.id === activeId);

  useEffect(() => {
    if (!enabled || !track?.url) {
      setCues([]);
      return;
    }
    fetch(track.url)
      .then((r) => r.text())
      .then((text) => setCues(parseVttSimple(text)))
      .catch(() => setCues([]));
  }, [enabled, track?.url]);

  if (!enabled || !track) return null;

  const activeCue = cues.find((c) => currentTimeSec >= c.start && currentTimeSec <= c.end);

  return (
    <div className="absolute bottom-16 left-0 right-0 z-[25] pointer-events-none flex justify-center px-8">
      {activeCue && (
        <p className="text-white text-lg md:text-xl font-medium text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] bg-black/40 px-3 py-1 rounded">
          {activeCue.text}
        </p>
      )}
    </div>
  );
}
