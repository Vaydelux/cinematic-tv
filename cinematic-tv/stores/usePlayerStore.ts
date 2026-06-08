'use client';

import { create } from 'zustand';
import type { IntroSegment, PlaybackStatus, PlayerSessionContext, SubtitleTrack } from '@/lib/player/types';

type PlayerStore = {
  status: PlaybackStatus;
  session: PlayerSessionContext | null;
  activeServerId: string | null;
  serverQueue: string[];
  failedServerIds: string[];
  retryCount: number;
  errorMessage: string | null;
  searchingLabel: string;
  progressPercent: number;
  currentTimeSec: number;
  durationSec: number;
  startAtSec: number | null;
  resumeDismissed: boolean;
  introSegments: IntroSegment[];
  subtitleTracks: SubtitleTrack[];
  activeSubtitleId: string | null;
  subtitlesEnabled: boolean;

  initSession: (session: PlayerSessionContext, serverQueue: string[], defaultServerId: string) => void;
  setStatus: (status: PlaybackStatus, label?: string) => void;
  setActiveServer: (serverId: string) => void;
  markServerFailed: (serverId: string) => void;
  getNextServerId: () => string | null;
  setError: (message: string) => void;
  clearError: () => void;
  incrementRetry: () => void;
  setProgress: (currentTimeSec: number, durationSec?: number) => void;
  setStartAt: (seconds: number | null) => void;
  dismissResume: () => void;
  setIntroSegments: (segments: IntroSegment[]) => void;
  setSubtitleTracks: (tracks: SubtitleTrack[]) => void;
  setActiveSubtitle: (id: string | null) => void;
  toggleSubtitles: (enabled: boolean) => void;
  reset: () => void;
};

const initialState = {
  status: 'IDLE' as PlaybackStatus,
  session: null as PlayerSessionContext | null,
  activeServerId: null as string | null,
  serverQueue: [] as string[],
  failedServerIds: [] as string[],
  retryCount: 0,
  errorMessage: null as string | null,
  searchingLabel: '',
  progressPercent: 0,
  currentTimeSec: 0,
  durationSec: 0,
  startAtSec: null as number | null,
  resumeDismissed: false,
  introSegments: [] as IntroSegment[],
  subtitleTracks: [] as SubtitleTrack[],
  activeSubtitleId: null as string | null,
  subtitlesEnabled: false,
};

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  ...initialState,

  initSession: (session, serverQueue, defaultServerId) => {
    set({
      ...initialState,
      session,
      serverQueue,
      activeServerId: defaultServerId,
      status: 'SEARCHING',
      searchingLabel: 'Searching servers...',
    });
  },

  setStatus: (status, label) =>
    set({
      status,
      searchingLabel: label ?? get().searchingLabel,
      errorMessage: status === 'ERROR' ? get().errorMessage : null,
    }),

  setActiveServer: (serverId) =>
    set({
      activeServerId: serverId,
      status: 'SEARCHING',
      searchingLabel: `Trying ${serverId}...`,
      errorMessage: null,
    }),

  markServerFailed: (serverId) =>
    set((s) => ({
      failedServerIds: s.failedServerIds.includes(serverId)
        ? s.failedServerIds
        : [...s.failedServerIds, serverId],
    })),

  getNextServerId: () => {
    const { serverQueue, failedServerIds, activeServerId } = get();
    const failed = new Set(failedServerIds);
    if (activeServerId) failed.add(activeServerId);
    return serverQueue.find((id) => !failed.has(id)) ?? null;
  },

  setError: (message) => set({ status: 'ERROR', errorMessage: message }),
  clearError: () => set({ errorMessage: null }),
  incrementRetry: () => set((s) => ({ retryCount: s.retryCount + 1 })),

  setProgress: (currentTimeSec, durationSec) => {
    const duration = durationSec ?? get().durationSec;
    const progressPercent = duration > 0 ? (currentTimeSec / duration) * 100 : get().progressPercent;
    set({
      currentTimeSec,
      durationSec: durationSec ?? get().durationSec,
      progressPercent,
    });
  },

  setStartAt: (seconds) => set({ startAtSec: seconds }),
  dismissResume: () => set({ resumeDismissed: true, startAtSec: null }),

  setIntroSegments: (segments) => set({ introSegments: segments }),
  setSubtitleTracks: (tracks) =>
    set({
      subtitleTracks: tracks,
      activeSubtitleId: tracks[0]?.id ?? null,
    }),
  setActiveSubtitle: (id) => set({ activeSubtitleId: id }),
  toggleSubtitles: (enabled) => set({ subtitlesEnabled: enabled }),
  reset: () => set(initialState),
}));
