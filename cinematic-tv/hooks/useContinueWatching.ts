'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { auth, db, doc, setDoc, collection, onSnapshot } from '@/lib/firebase';
import { withoutUndefined } from '@/lib/firestore-utils';
import type { MediaItem } from '@/lib/types';

const LOCAL_KEY = 'cinematic-continue';
const MAX_ITEMS = 20;

export type ContinueEntry = {
  source: string;
  mediaType: string;
  tmdbId?: number;
  anilistId?: number;
  season?: number;
  episode?: number;
  title: string;
  posterPath: string;
  backdropPath?: string;
  lastWatchedAt: string;
  progressPercent?: number;
  currentTimeSec?: number;
};

function entryKey(e: ContinueEntry) {
  return `${e.source}-${e.mediaType}-${e.tmdbId ?? e.anilistId}`;
}

function readLocalContinue(): ContinueEntry[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? (JSON.parse(raw) as ContinueEntry[]) : [];
  } catch {
    return [];
  }
}

export function getLocalContinueWatching(): ContinueEntry[] {
  return readLocalContinue();
}

export function replaceLocalContinueWatching(list: ContinueEntry[]) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(list.slice(0, MAX_ITEMS)));
  } catch {
    // Keep cloud sync non-fatal if storage is blocked.
  }
}

export function useContinueWatching() {
  const [items, setItems] = useState<ContinueEntry[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const itemsRef = useRef<ContinueEntry[]>([]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    if (!auth) {
      setUserId(null);
      return undefined;
    }
    const unsub = auth.onAuthStateChanged((u) => setUserId(u?.uid ?? null));
    return unsub;
  }, []);

  useEffect(() => {
    if (userId && db) {
      const ref = collection(db, 'users', userId, 'continueWatching');
      return onSnapshot(ref, (snap) => {
        const list = snap.docs.map((d) => d.data() as ContinueEntry);
        list.sort((a, b) => new Date(b.lastWatchedAt).getTime() - new Date(a.lastWatchedAt).getTime());
        setItems(list.slice(0, MAX_ITEMS));
      });
    }
    const list = readLocalContinue();
    list.sort((a, b) => new Date(b.lastWatchedAt).getTime() - new Date(a.lastWatchedAt).getTime());
    setItems(list.slice(0, MAX_ITEMS));
  }, [userId]);

  const record = useCallback(
    async (item: MediaItem, progressPercent?: number, currentTimeSec?: number) => {
      const keySeed: ContinueEntry = {
        source: item.source,
        mediaType: item.mediaType,
        tmdbId: item.tmdbId,
        anilistId: item.anilistId,
        title: item.title,
        posterPath: item.image,
        lastWatchedAt: new Date().toISOString(),
      };
      const key = entryKey(keySeed);
      const previous = itemsRef.current.find((i) => entryKey(i) === key);
      const sameEpisode =
        previous &&
        previous.season === item.season &&
        previous.episode === item.episode;
      const entry: ContinueEntry = {
        source: item.source,
        mediaType: item.mediaType,
        tmdbId: item.tmdbId,
        anilistId: item.anilistId,
        season: item.season,
        episode: item.episode,
        title: item.title,
        posterPath: item.image,
        backdropPath: item.backdrop,
        lastWatchedAt: new Date().toISOString(),
        progressPercent: progressPercent ?? item.progress ?? (sameEpisode ? previous?.progressPercent : undefined),
        currentTimeSec: currentTimeSec ?? (sameEpisode ? previous?.currentTimeSec : undefined),
      };

      if (userId && db) {
        await setDoc(doc(db, 'users', userId, 'continueWatching', key), withoutUndefined(entry));
      } else {
        let list = readLocalContinue();
        list = list.filter((i) => entryKey(i) !== key);
        list.unshift(entry);
        try {
          localStorage.setItem(LOCAL_KEY, JSON.stringify(list.slice(0, MAX_ITEMS)));
        } catch {
          // Ignore storage failures; in-memory state still reflects the latest entry.
        }
        setItems(list.slice(0, MAX_ITEMS));
      }
    },
    [userId]
  );

  return { items, record };
}
