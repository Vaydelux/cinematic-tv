'use client';

import type { User } from 'firebase/auth';
import { serverTimestamp, type Timestamp } from 'firebase/firestore';
import {
  collection,
  db,
  doc,
  getDoc,
  getDocs,
  setDoc,
  writeBatch,
} from '@/lib/firebase';
import { withoutUndefined } from '@/lib/firestore-utils';
import { getLocalContinueWatching, replaceLocalContinueWatching, type ContinueEntry } from '@/hooks/useContinueWatching';
import { getLocalWatchlist, replaceLocalWatchlist, type WatchlistEntry } from '@/hooks/useWatchlist';
import { getUserSettings, normalizeSettings, replaceUserSettings } from '@/lib/user-settings';
import type { AppSettings } from '@/lib/types';

export type UserProfile = {
  displayName: string;
  email: string;
  photoURL?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  preferences: AppSettings;
  stats: {
    watchlistCount: number;
    continueWatchingCount: number;
    reviewsCount: number;
  };
};

function watchlistKey(entry: WatchlistEntry) {
  return `${entry.source}-${entry.mediaType}-${entry.tmdbId ?? entry.anilistId}`;
}

function continueKey(entry: ContinueEntry) {
  return `${entry.source}-${entry.mediaType}-${entry.tmdbId ?? entry.anilistId}`;
}

async function readCollection<T>(userId: string, name: 'watchlist' | 'continueWatching') {
  if (!db) return [];
  const snap = await getDocs(collection(db, 'users', userId, name));
  return snap.docs.map((entry) => entry.data() as T);
}

async function mergeWatchlist(userId: string) {
  if (!db) return 0;
  const local = getLocalWatchlist();
  const cloud = await readCollection<WatchlistEntry>(userId, 'watchlist');
  const merged = new Map<string, WatchlistEntry>();
  [...cloud, ...local].forEach((entry) => merged.set(watchlistKey(entry), entry));
  const next = [...merged.values()];
  const batch = writeBatch(db);
  next.forEach((entry) => {
    batch.set(doc(db!, 'users', userId, 'watchlist', watchlistKey(entry)), withoutUndefined(entry), { merge: true });
  });
  await batch.commit();
  replaceLocalWatchlist(next);
  return next.length;
}

async function mergeContinueWatching(userId: string) {
  if (!db) return 0;
  const local = getLocalContinueWatching();
  const cloud = await readCollection<ContinueEntry>(userId, 'continueWatching');
  const merged = new Map<string, ContinueEntry>();
  [...cloud, ...local].forEach((entry) => {
    const key = continueKey(entry);
    const current = merged.get(key);
    if (!current || new Date(entry.lastWatchedAt).getTime() >= new Date(current.lastWatchedAt).getTime()) {
      merged.set(key, entry);
    }
  });
  const next = [...merged.values()].sort(
    (a, b) => new Date(b.lastWatchedAt).getTime() - new Date(a.lastWatchedAt).getTime(),
  );
  const batch = writeBatch(db);
  next.forEach((entry) => {
    batch.set(doc(db!, 'users', userId, 'continueWatching', continueKey(entry)), withoutUndefined(entry), { merge: true });
  });
  await batch.commit();
  replaceLocalContinueWatching(next);
  return next.length;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, 'users', userId));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function bootstrapUserProfile(user: User): Promise<UserProfile | null> {
  if (!db) return null;
  const ref = doc(db, 'users', user.uid);
  const existing = await getDoc(ref);
  const currentSettings = getUserSettings();
  const cloudSettings = existing.exists()
    ? normalizeSettings((existing.data() as Partial<UserProfile>).preferences)
    : currentSettings;
  const preferences = existing.exists() ? cloudSettings : currentSettings;
  if (existing.exists()) {
    replaceUserSettings(preferences);
  }
  const watchlistCount = await mergeWatchlist(user.uid);
  const continueWatchingCount = await mergeContinueWatching(user.uid);
  const profile: UserProfile = {
    displayName: user.displayName ?? user.email?.split('@')[0] ?? 'Cinematic viewer',
    email: user.email ?? '',
    photoURL: user.photoURL ?? undefined,
    preferences,
    stats: {
      watchlistCount,
      continueWatchingCount,
      reviewsCount: (existing.data() as Partial<UserProfile> | undefined)?.stats?.reviewsCount ?? 0,
    },
  };
  await setDoc(ref, withoutUndefined({
    ...profile,
    createdAt: existing.exists() ? existing.data().createdAt : serverTimestamp(),
    updatedAt: serverTimestamp(),
  }), { merge: true });
  return profile;
}

export async function saveProfilePreferences(userId: string, preferences: AppSettings) {
  if (!db) return;
  await setDoc(doc(db, 'users', userId), {
    preferences,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}
