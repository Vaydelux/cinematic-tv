'use client';

import { createContext } from 'react';
import type { MediaItem } from '@/lib/types';

export type ActiveMediaState = MediaItem & { matchedLayoutId: string };

export const MovieContext = createContext<{
  activeMovie: ActiveMediaState | null;
  setActiveMovie: (movie: ActiveMediaState | null) => void;
  hoveredMovie: MediaItem | null;
  setHoveredMovie: (movie: MediaItem | null) => void;
}>({
  activeMovie: null,
  setActiveMovie: () => {},
  hoveredMovie: null,
  setHoveredMovie: () => {},
});
