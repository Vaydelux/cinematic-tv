'use client';

import { useCallback, useEffect, useState } from 'react';
import { auth, db, doc, setDoc, deleteDoc, collection, onSnapshot } from '@/lib/firebase';
import { withoutUndefined } from '@/lib/firestore-utils';
import type { MediaItem } from '@/lib/types';

const LOCAL_KEY = 'cinematic-watchlist';

export type WatchlistEntry = {
  source: string;
  mediaType: string;
  tmdbId?: number;
  anilistId?: number;
  title: string;
  posterPath: string;
  addedAt: string;
};

function toEntry(item: MediaItem): WatchlistEntry {
  return {
    source: item.source,
    mediaType: item.mediaType,
    tmdbId: item.tmdbId,
    anilistId: item.anilistId,
    title: item.title,
    posterPath: item.image,
    addedAt: new Date().toISOString(),
  };
}

function entryKey(e: WatchlistEntry) {
  return `${e.source}-${e.mediaType}-${e.tmdbId ?? e.anilistId}`;
}

function readLocalWatchlist(): WatchlistEntry[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? (JSON.parse(raw) as WatchlistEntry[]) : [];
  } catch {
    return [];
  }
}

export function useWatchlist() {
  const [items, setItems] = useState<WatchlistEntry[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

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
      const ref = collection(db, 'users', userId, 'watchlist');
      return onSnapshot(ref, (snap) => {
        setItems(snap.docs.map((d) => d.data() as WatchlistEntry));
      });
    }
    setItems(readLocalWatchlist());
  }, [userId]);

  const persistLocal = (list: WatchlistEntry[]) => {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(list));
    } catch {
      // Keep the in-memory list usable when localStorage is blocked or full.
    }
    setItems(list);
  };

  const toggle = useCallback(
    async (item: MediaItem) => {
      const entry = toEntry(item);
      const key = entryKey(entry);
      const exists = items.some((i) => entryKey(i) === key);

      if (userId && db) {
        const ref = doc(db, 'users', userId, 'watchlist', key);
        if (exists) await deleteDoc(ref);
        else await setDoc(ref, withoutUndefined(entry));
      } else {
        const next = exists ? items.filter((i) => entryKey(i) !== key) : [...items, entry];
        persistLocal(next);
      }
    },
    [items, userId]
  );

  const isInList = useCallback(
    (item: MediaItem) => {
      const key = entryKey(toEntry(item));
      return items.some((i) => entryKey(i) === key);
    },
    [items]
  );

  return { items, toggle, isInList };
}
