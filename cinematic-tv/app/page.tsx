'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { BottomNav } from '@/components/BottomNav';
import { Sidebar } from '@/components/Sidebar';
import { HomeView } from '@/components/views/HomeView';
import { SearchView } from '@/components/views/SearchView';
import { ListView } from '@/components/views/ListView';
import { SettingsView } from '@/components/views/SettingsView';
import { MovieContext, ActiveMediaState } from '@/lib/context';
import { MovieDetail } from '@/components/MovieDetail';
import { OnboardingModal } from '@/components/OnboardingModal';
import { MediaItem } from '@/lib/types';
import { getUserSettings } from '@/lib/user-settings';
import { fetchAnilist, fetchTmdb } from '@/hooks/useCatalogQuery';
import { mapMovieDetails, mapTvDetails } from '@/lib/tmdb/mappers';
import { mapAnilistToMediaItem } from '@/lib/anilist/mappers';
import type { TmdbMovieDetails, TmdbTvDetails } from '@/lib/tmdb/types';
import type { AniListMediaResponse } from '@/lib/anilist/types';

function DeepLinkHandler({
  setActiveMovie,
}: {
  setActiveMovie: (m: ActiveMediaState | null) => void;
}) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const open = searchParams.get('open');
    const movieId = searchParams.get('movie');
    const tvId = searchParams.get('tv');
    const animeId = searchParams.get('anime');

    async function openDetail() {
      try {
        if (open) {
          const match = open.match(/^(tmdb|anilist)-(movie|tv|anime)-(\d+)$/);
          if (match) {
            const [, source, type, id] = match;
            if (source === 'tmdb' && type === 'movie') {
              const data = await fetchTmdb<TmdbMovieDetails>(`movie/${id}`, { language: 'en-US' });
              setActiveMovie({ ...mapMovieDetails(data), matchedLayoutId: `open-${id}` });
            } else if (source === 'tmdb' && type === 'tv') {
              const data = await fetchTmdb<TmdbTvDetails>(`tv/${id}`, { language: 'en-US' });
              setActiveMovie({ ...mapTvDetails(data), matchedLayoutId: `open-${id}` });
            } else if (source === 'anilist') {
              const data = await fetchAnilist<AniListMediaResponse>('mediaById', { id: parseInt(id, 10) });
              if (data.Media) setActiveMovie({ ...mapAnilistToMediaItem(data.Media), matchedLayoutId: `open-${id}` });
            }
          }
        } else if (movieId) {
          const data = await fetchTmdb<TmdbMovieDetails>(`movie/${movieId}`, { language: 'en-US' });
          setActiveMovie({ ...mapMovieDetails(data), matchedLayoutId: `open-movie-${movieId}` });
        } else if (tvId) {
          const data = await fetchTmdb<TmdbTvDetails>(`tv/${tvId}`, { language: 'en-US' });
          setActiveMovie({ ...mapTvDetails(data), matchedLayoutId: `open-tv-${tvId}` });
        } else if (animeId) {
          const data = await fetchAnilist<AniListMediaResponse>('mediaById', { id: parseInt(animeId, 10) });
          if (data.Media) setActiveMovie({ ...mapAnilistToMediaItem(data.Media), matchedLayoutId: `open-anime-${animeId}` });
        }
      } catch {
        // ignore deep link errors
      }
    }
    if (open || movieId || tvId || animeId) openDetail();
  }, [searchParams, setActiveMovie]);

  return null;
}

export default function CinematicApp() {
  const [currentView, setCurrentView] = useState<string>('home');
  const [activeMovie, setActiveMovie] = useState<ActiveMediaState | null>(null);
  const [hoveredMovie, setHoveredMovie] = useState<MediaItem | null>(null);
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  useEffect(() => {
    if (!getUserSettings().onboardingComplete) setOnboardingOpen(true);
  }, []);

  return (
    <MovieContext.Provider value={{ activeMovie, setActiveMovie, hoveredMovie, setHoveredMovie }}>
      <OnboardingModal open={onboardingOpen} onComplete={() => setOnboardingOpen(false)} />
      <Suspense fallback={null}>
        <DeepLinkHandler setActiveMovie={setActiveMovie} />
      </Suspense>
      <div className="relative flex min-h-screen overflow-hidden bg-transparent font-body text-on-surface">
        <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
        <BottomNav currentView={currentView} setCurrentView={setCurrentView} />

        <main className="relative z-10 h-screen min-w-0 flex-1 overflow-x-hidden overflow-y-auto pb-24 md:ml-24 md:pb-0">
          <AnimatePresence mode="wait">
            {currentView === 'home' && <HomeView key="home" />}
            {currentView === 'search' && <SearchView key="search" />}
            {currentView === 'list' && <ListView key="list" />}
            {currentView === 'settings' && <SettingsView key="settings" />}
          </AnimatePresence>
        </main>

        <AnimatePresence>
          {activeMovie && <MovieDetail movie={activeMovie} onClose={() => setActiveMovie(null)} />}
        </AnimatePresence>
      </div>
    </MovieContext.Provider>
  );
}
