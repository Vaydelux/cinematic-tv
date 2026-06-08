'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createLogger } from '@/lib/logger';

const log = createLogger('catalog');

type QueryState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

const inflight = new Map<string, Promise<unknown>>();

export function useCatalogQuery<T>(key: string, fetcher: () => Promise<T>, enabled = true) {
  const [state, setState] = useState<QueryState<T>>({ data: null, loading: enabled, error: null });
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const refetch = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      let promise = inflight.get(key);
      if (!promise) {
        promise = fetcherRef.current();
        inflight.set(key, promise);
      }
      const data = (await promise) as T;
      inflight.delete(key);
      setState({ data, loading: false, error: null });
    } catch (e) {
      inflight.delete(key);
      const message = e instanceof Error ? e.message : 'Error';
      log.error(`query failed: ${key}`, e);
      setState({ data: null, loading: false, error: message });
    }
  }, [key]);

  useEffect(() => {
    if (enabled) refetch();
  }, [enabled, refetch]);

  return { ...state, refetch };
}

export async function fetchTmdb<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  let localeParams: Record<string, string> = {};
  if (typeof window !== 'undefined') {
    const { catalogLocaleParams } = await import('@/lib/catalog-locale');
    localeParams = catalogLocaleParams();
  }
  const qs = new URLSearchParams({ ...localeParams, ...params }).toString();
  const url = `/api/tmdb/${path}${qs ? `?${qs}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    const message = (payload as { error?: string }).error ?? `TMDB fetch failed (${res.status})`;
    log.warn('fetchTmdb failed', { path, status: res.status, message });
    throw new Error(message);
  }
  return res.json();
}

export async function fetchAnilist<T>(operation: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch('/api/anilist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operation, variables }),
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    const message = (payload as { error?: string }).error ?? `AniList fetch failed (${res.status})`;
    log.warn('fetchAnilist failed', { operation, status: res.status, message });
    throw new Error(message);
  }
  const json = await res.json();
  return json.data as T;
}
