type CacheEntry<T> = { data: T; expiresAt: number };

const store = new Map<string, CacheEntry<unknown>>();
let circuitOpenUntil = 0;

type RedisClient = {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, opts?: { EX?: number }) => Promise<unknown>;
  connect: () => Promise<void>;
};

let redisClient: RedisClient | null = null;
let redisInitAttempted = false;

async function getRedis(): Promise<RedisClient | null> {
  if (redisClient) return redisClient;
  if (redisInitAttempted || !process.env.REDIS_URL) return null;
  redisInitAttempted = true;
  try {
    const { createClient } = await import('redis');
    const client = createClient({ url: process.env.REDIS_URL });
    await client.connect();
    redisClient = client as unknown as RedisClient;
    return redisClient;
  } catch {
    return null;
  }
}

export function getCached<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.data as T;
}

export async function getCachedAsync<T>(key: string): Promise<T | null> {
  const mem = getCached<T>(key);
  if (mem) return mem;

  const redis = await getRedis();
  if (!redis) return null;

  try {
    const raw = await redis.get(`cinematic:${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { data: T; expiresAt: number };
    if (Date.now() > parsed.expiresAt) return null;
    setCache(key, parsed.data, Math.max(1, Math.floor((parsed.expiresAt - Date.now()) / 1000)));
    return parsed.data;
  } catch {
    return null;
  }
}

export function setCache<T>(key: string, data: T, ttlSeconds: number): void {
  const expiresAt = Date.now() + ttlSeconds * 1000;
  store.set(key, { data, expiresAt });

  void (async () => {
    const redis = await getRedis();
    if (!redis) return;
    try {
      await redis.set(`cinematic:${key}`, JSON.stringify({ data, expiresAt }), { EX: ttlSeconds });
    } catch {
      // ignore redis write failures
    }
  })();
}

export function isCircuitOpen(): boolean {
  return Date.now() < circuitOpenUntil;
}

export function openCircuit(seconds = 30): void {
  circuitOpenUntil = Date.now() + seconds * 1000;
}

export async function fetchWithBackoff(
  url: string,
  init: RequestInit,
  maxRetries = 3
): Promise<Response> {
  let delay = 1000;
  for (let i = 0; i < maxRetries; i++) {
    const res = await fetch(url, init);
    if (res.status !== 429) return res;
    const retryAfter = res.headers.get('Retry-After');
    await new Promise((r) =>
      setTimeout(r, retryAfter ? parseInt(retryAfter, 10) * 1000 : delay)
    );
    delay *= 2;
  }
  openCircuit();
  throw new Error('Rate limit exceeded');
}

export function cacheStats() {
  return {
    entries: store.size,
    circuitOpen: isCircuitOpen(),
    redisConfigured: Boolean(process.env.REDIS_URL),
    redisConnected: Boolean(redisClient),
  };
}
