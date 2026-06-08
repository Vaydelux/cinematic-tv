export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { logger } = await import('./lib/logger');
    logger.info('boot', {
      nodeEnv: process.env.NODE_ENV,
      logLevel: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
      tmdbConfigured: Boolean(process.env.TMDB_ACCESS_TOKEN),
    });
  }
}
