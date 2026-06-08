import { z } from 'zod';

const envSchema = z.object({
  TMDB_ACCESS_TOKEN: z.string().min(1).optional(),
  ANILIST_ACCESS_TOKEN: z.string().optional(),
  WYZIE_API_KEY: z.string().optional(),
  THEINTRODB_API_KEY: z.string().optional(),
  REDIS_URL: z.string().optional(),
  BACKEND_URLS: z.string().optional(),
  APP_URL: z.string().url().optional().default('http://localhost:3000'),
});

export type Env = z.infer<typeof envSchema>;

export function getEnv(): Env {
  return envSchema.parse({
    TMDB_ACCESS_TOKEN: process.env.TMDB_ACCESS_TOKEN,
    ANILIST_ACCESS_TOKEN: process.env.ANILIST_ACCESS_TOKEN,
    WYZIE_API_KEY: process.env.WYZIE_API_KEY,
    THEINTRODB_API_KEY: process.env.THEINTRODB_API_KEY,
    REDIS_URL: process.env.REDIS_URL,
    BACKEND_URLS: process.env.BACKEND_URLS,
    APP_URL: process.env.APP_URL ?? 'http://localhost:3000',
  });
}

export function requireTmdbToken(): string {
  const token = process.env.TMDB_ACCESS_TOKEN;
  if (!token) throw new Error('TMDB_ACCESS_TOKEN is not configured');
  return token;
}
