import { z } from 'zod';

const envSchema = z.object({
  TMDB_ACCESS_TOKEN: z.string().min(1).optional(),
  TMDB_API_KEY: z.string().optional(),
  ANILIST_ACCESS_TOKEN: z.string().optional(),
  WYZIE_API_KEY: z.string().optional(),
  THEINTRODB_API_KEY: z.string().optional(),
  REDIS_URL: z.string().optional(),
  KV_REST_API_URL: z.string().optional(),
  KV_REST_API_TOKEN: z.string().optional(),
  BACKEND_URLS: z.string().optional(),
  APP_URL: z.string().url().optional().default('http://localhost:3000'),
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_DATABASE_ID: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function getEnv(): Env {
  return envSchema.parse({
    TMDB_ACCESS_TOKEN: process.env.TMDB_ACCESS_TOKEN,
    TMDB_API_KEY: process.env.TMDB_API_KEY,
    ANILIST_ACCESS_TOKEN: process.env.ANILIST_ACCESS_TOKEN,
    WYZIE_API_KEY: process.env.WYZIE_API_KEY,
    THEINTRODB_API_KEY: process.env.THEINTRODB_API_KEY,
    REDIS_URL: process.env.REDIS_URL,
    KV_REST_API_URL: process.env.KV_REST_API_URL,
    KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN,
    BACKEND_URLS: process.env.BACKEND_URLS,
    APP_URL: process.env.APP_URL ?? 'http://localhost:3000',
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    NEXT_PUBLIC_FIREBASE_DATABASE_ID: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID,
  });
}

const FIREBASE_PUBLIC_KEYS = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
] as const;

export function getDeployReadiness() {
  const env = getEnv();
  const missingRequired = [
    env.TMDB_ACCESS_TOKEN ? null : 'TMDB_ACCESS_TOKEN',
    env.APP_URL ? null : 'APP_URL',
  ].filter((value): value is string => Boolean(value));
  const missingFirebase = FIREBASE_PUBLIC_KEYS.filter((key) => !env[key]);

  return {
    ready: missingRequired.length === 0,
    missingRequired,
    firebaseConfigured: missingFirebase.length === 0,
    missingFirebase,
    optional: {
      wyzieConfigured: Boolean(env.WYZIE_API_KEY),
      redisConfigured: Boolean(env.REDIS_URL || (env.KV_REST_API_URL && env.KV_REST_API_TOKEN)),
      backendUrlsConfigured: Boolean(env.BACKEND_URLS),
    },
  };
}

export function requireTmdbToken(): string {
  const token = process.env.TMDB_ACCESS_TOKEN;
  if (!token) throw new Error('TMDB_ACCESS_TOKEN is not configured');
  return token;
}
