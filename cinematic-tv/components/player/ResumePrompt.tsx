'use client';

import { Play, RotateCcw } from 'lucide-react';

type Props = {
  progressPercent: number;
  currentTimeSec: number;
  onResume: () => void;
  onStartOver: () => void;
};

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function ResumePrompt({ progressPercent, currentTimeSec, onResume, onStartOver }: Props) {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/[0.85] p-6">
      <div className="text-center max-w-md rounded-lg border border-white/10 bg-black/60 px-6 py-7 shadow-2xl">
        <h3 className="text-xl font-bold text-white mb-2">Continue watching?</h3>
        <p className="text-white/60 text-sm mb-6">
          You were at {formatTime(currentTimeSec)} ({Math.round(progressPercent)}%)
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onResume}
            className="flex items-center gap-2 px-6 py-3 rounded-md bg-primary text-white font-bold hover:bg-primary/90"
          >
            <Play className="w-4 h-4 fill-current" />
            Resume
          </button>
          <button
            onClick={onStartOver}
            className="flex items-center gap-2 px-6 py-3 rounded-md bg-white/10 text-white font-medium hover:bg-white/20"
          >
            <RotateCcw className="w-4 h-4" />
            Start over
          </button>
        </div>
      </div>
    </div>
  );
}
