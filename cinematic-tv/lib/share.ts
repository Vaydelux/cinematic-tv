import { db } from '@/lib/firebase';
import { withoutUndefined } from '@/lib/firestore-utils';
import { collection, addDoc, doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';

export type ShareTokenData = {
  source: 'tmdb' | 'anilist';
  mediaType: string;
  tmdbId?: number;
  anilistId?: number;
  season?: number;
  episode?: number;
  createdBy: string;
  expiresAt: Date;
  isDisposable: boolean;
  used: boolean;
};

export async function createShareToken(
  data: Omit<ShareTokenData, 'createdBy' | 'expiresAt' | 'isDisposable' | 'used'>,
  userId: string
): Promise<string> {
  if (!db) throw new Error('Firebase is not configured');
  const shareTokensRef = collection(db, 'shareTokens');
  const expiration = new Date();
  expiration.setHours(expiration.getHours() + 24);

  const tokenDoc = await addDoc(shareTokensRef, withoutUndefined({
    ...data,
    movieId: data.tmdbId ? `tmdb-${data.mediaType}-${data.tmdbId}` : `anilist-${data.anilistId}`,
    createdBy: userId,
    createdAt: serverTimestamp(),
    expiresAt: expiration,
    isDisposable: true,
    used: false,
  }));

  return tokenDoc.id;
}

export async function consumeShareToken(tokenId: string): Promise<ShareTokenData | null> {
  if (!db) return null;
  const tokenRef = doc(db, 'shareTokens', tokenId);
  const tokenDoc = await getDoc(tokenRef);

  if (!tokenDoc.exists()) return null;

  const data = tokenDoc.data();
  if (data.isDisposable && data.used) return null;
  if (data.expiresAt && data.expiresAt.toDate() < new Date()) return null;
  if (data.isDisposable) {
    await updateDoc(tokenRef, { used: true }).catch(() => {});
  }

  return data as ShareTokenData;
}
