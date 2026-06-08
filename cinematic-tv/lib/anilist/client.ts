import { getEnv } from '@/lib/env';
import { fetchWithBackoff, getCached, setCache } from '@/lib/cache';
import { ALLOWED_OPERATIONS } from './queries';

const ANILIST_URL = 'https://graphql.anilist.co';

const TTL = { lists: 1800, search: 600, details: 7200 };

export async function anilistQuery<T>(
  operation: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  const query = ALLOWED_OPERATIONS[operation];
  if (!query) throw new Error(`Unknown AniList operation: ${operation}`);

  const cacheKey = `anilist:${operation}:${JSON.stringify(variables)}`;
  const ttl = operation === 'mediaById' ? TTL.details : operation === 'searchAnime' ? TTL.search : TTL.lists;
  const cached = getCached<T>(cacheKey);
  if (cached) return cached;

  const env = getEnv();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (env.ANILIST_ACCESS_TOKEN) {
    headers.Authorization = `Bearer ${env.ANILIST_ACCESS_TOKEN}`;
  }

  const res = await fetchWithBackoff(ANILIST_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });

  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(json.errors[0].message ?? 'AniList error');
  }

  const data = json.data as T;
  setCache(cacheKey, data, ttl);
  return data;
}
