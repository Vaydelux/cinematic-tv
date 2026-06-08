'use client';

import { motion, type Variants } from 'motion/react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { MovieCard } from '@/components/MovieCard';
import { Film, Loader2, Mic, MicOff, Search as SearchIcon } from 'lucide-react';
import { fetchAnilist, fetchTmdb } from '@/hooks/useCatalogQuery';
import { mapTmdbToMediaItem } from '@/lib/tmdb/mappers';
import { mapAnilistToMediaItem } from '@/lib/anilist/mappers';
import { dedupeSearchResults } from '@/lib/catalog/unifier';
import { getUserSettings } from '@/lib/user-settings';
import type { MediaItem } from '@/lib/types';
import type { TmdbListResponse, TmdbMovieResult } from '@/lib/tmdb/types';
import type { AniListPageResponse } from '@/lib/anilist/types';

const VIEW_EASE = [0.16, 1, 0.3, 1] as const;

const viewVariants = {
  hidden: { opacity: 0, scale: 0.98, filter: 'blur(8px)', y: 20 },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)', y: 0, transition: { duration: 0.5, ease: VIEW_EASE } },
  exit: { opacity: 0, scale: 0.98, filter: 'blur(8px)', y: -20, transition: { duration: 0.4, ease: VIEW_EASE } },
} satisfies Variants;

const GENRES = ['All', 'Action', 'Sci-Fi', 'Thriller', 'Drama', 'Fantasy', 'Horror', 'Comedy', 'Animation'];

export function SearchView() {
  const settings = getUserSettings();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'tmdb' | 'anilist'>(
    settings.contentSource
  );
  const [results, setResults] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<{ start: () => void; stop: () => void } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const w = window as unknown as {
        SpeechRecognition?: new () => {
          continuous: boolean;
          interimResults: boolean;
          lang: string;
          onresult: ((e: { results: { 0: { 0: { transcript: string } } } }) => void) | null;
          onerror: (() => void) | null;
          onend: (() => void) | null;
          start: () => void;
          stop: () => void;
        };
        webkitSpeechRecognition?: new () => {
          continuous: boolean;
          interimResults: boolean;
          lang: string;
          onresult: ((e: { results: { 0: { 0: { transcript: string } } } }) => void) | null;
          onerror: (() => void) | null;
          onend: (() => void) | null;
          start: () => void;
          stop: () => void;
        };
      };
      const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
      if (SR) {
        const recognition = new SR();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        recognition.onresult = (event) => {
          setSearchTerm(event.results[0][0].transcript);
          setIsListening(false);
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
        recognitionRef.current = recognition;
      }
    }
  }, []);

  const doSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    try {
      const items: MediaItem[] = [];

      if (sourceFilter !== 'anilist') {
        const tmdb = await fetchTmdb<TmdbListResponse<TmdbMovieResult>>('search/multi', {
          query,
          language: 'en-US',
          include_adult: String(settings.showAdult),
        });
        items.push(...tmdb.results.filter((r) => r.media_type === 'movie' || r.media_type === 'tv' || r.title || r.name).map((item) => mapTmdbToMediaItem(item)));
      }

      if (sourceFilter !== 'tmdb') {
        const anilist = await fetchAnilist<AniListPageResponse>('searchAnime', {
          search: query,
          page: 1,
          perPage: 20,
          isAdult: settings.showAdult,
        });
        items.push(...(anilist.Page?.media ?? []).map((item) => mapAnilistToMediaItem(item)));
      }

      let filtered = dedupeSearchResults(items);
      if (selectedGenre !== 'All') {
        filtered = filtered.filter((m) => m.genres?.includes(selectedGenre));
      }
      setResults(filtered);
    } catch (error) {
      setResults([]);
      setErrorMessage(error instanceof Error ? error.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }, [sourceFilter, selectedGenre, settings.showAdult]);

  useEffect(() => {
    const timer = setTimeout(() => doSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm, doSearch]);

  const toggleVoice = () => {
    if (!recognitionRef.current) return;
    if (isListening) recognitionRef.current.stop();
    else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  return (
    <motion.div variants={viewVariants} initial={false} animate="visible" exit="exit" className="mx-auto max-w-7xl px-4 py-8 sm:px-5 md:px-10 md:py-12">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Discovery</p>
          <h1 className="font-display text-3xl font-bold text-on-surface sm:text-4xl md:text-5xl">Search</h1>
        </div>
        <div className="hidden sm:flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.06] px-3 py-2 text-xs text-on-surface-variant">
          <Film className="h-4 w-4 text-primary" />
          {sourceFilter === 'all' ? 'All catalogs' : sourceFilter === 'tmdb' ? 'Movies and TV' : 'Anime'}
        </div>
      </div>

      <div className="cinema-panel cinema-ring mb-8 rounded-lg p-4 md:p-5">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search movies, TV, anime..."
            className="w-full rounded-md border border-white/10 bg-surface py-4 pl-12 pr-16 text-base text-on-surface outline-none transition placeholder:text-on-surface-variant/70 focus:border-primary"
          />
          <button
            onClick={toggleVoice}
            className={`absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-2 transition-colors ${isListening ? 'bg-primary/20 text-primary' : 'text-on-surface-variant hover:bg-white/10 hover:text-on-surface'}`}
            aria-label={isListening ? 'Stop voice search' : 'Start voice search'}
          >
            {isListening ? <Mic className="w-5 h-5 animate-pulse" /> : <MicOff className="w-5 h-5" />}
          </button>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
          {(['all', 'tmdb', 'anilist'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSourceFilter(s)}
              className={`px-4 py-2 rounded-md whitespace-nowrap text-sm font-medium transition ${
                sourceFilter === s ? 'bg-primary text-white' : 'bg-white/[0.06] text-on-surface-variant hover:bg-white/10'
              }`}
            >
              {s === 'all' ? 'All' : s === 'tmdb' ? 'Movies & TV' : 'Anime'}
            </button>
          ))}
        </div>

        <div className="mt-2 flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
          {GENRES.map((genre) => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`px-3 py-2 rounded-md whitespace-nowrap text-xs font-bold uppercase tracking-wide transition ${
                selectedGenre === genre ? 'bg-white text-black' : 'bg-white/[0.06] text-on-surface-variant hover:bg-white/10'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      {errorMessage && (
        <div className="mb-6 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-on-surface">
          {errorMessage}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-5 pb-24">
        {results.map((movie) => (
          <MovieCard key={`search-${movie.id}`} movie={movie} className="!min-w-0" layoutIdPrefix="search-" />
        ))}
        {!loading && searchTerm.length >= 2 && results.length === 0 && (
          <div className="col-span-full pt-16 text-center text-on-surface-variant">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-white/[0.06]">
              <SearchIcon className="h-6 w-6" />
            </div>
            No titles found.
          </div>
        )}
      </div>
    </motion.div>
  );
}
