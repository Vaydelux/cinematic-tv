# Cinematic TV

A Next.js App Router streaming catalog UI for movies, TV, and anime. It combines TMDB metadata, AniList anime data, Firebase-backed user features, configurable embed servers, continue watching, reviews, subtitles, and server failover.

## Requirements

- Node.js 20 or newer
- npm
- A TMDB API read access token for the main catalog

## Local Setup

1. Install dependencies.

   ```bash
   npm install
   ```

2. Create `.env.local` from `.env.example` and set at least:

   ```bash
   TMDB_ACCESS_TOKEN="your_tmdb_read_access_token"
   APP_URL="http://localhost:3000"
   ```

3. Start the app.

   ```bash
   npm run dev
   ```

4. Open `http://localhost:3000`.

## Verification

Run the full local verification pipeline before deployment:

```bash
npm run verify
npm audit --omit=dev
```

Useful individual checks:

```bash
npm run lint
npm run typecheck
npm run build
```

## Deployment

The app is configured for Vercel or Node standalone output.

For Vercel:

- Set the environment variables from `.env.example`.
- Deploy with the default Next.js build command: `npm run build`.

For Node standalone:

```bash
npm run build
node .next/standalone/server.js
```

Set `PORT` and `APP_URL` appropriately in the hosting environment.

## Environment Variables

- `TMDB_ACCESS_TOKEN`: Required for TMDB catalog, search, movie, and TV metadata.
- `APP_URL`: Public app URL used for share links and deployment metadata.
- `LOG_LEVEL`: Optional. `debug`, `info`, `warn`, or `error`.
- `ENABLE_LOG_API`: Optional. Set to `true` to allow `/api/logs` in production.
- `ANILIST_ACCESS_TOKEN`: Optional. AniList public data works without it.
- `WYZIE_API_KEY`: Optional. Enables Wyzie subtitle lookups.
- `THEINTRODB_API_KEY`: Optional. Reserved for IntroDB authenticated features.
- `REDIS_URL`: Optional. Enables shared API caching; otherwise the app uses memory cache.
- `BACKEND_URLS`: Optional comma-separated backend URLs for multi-backend failover.
- `NEXT_PUBLIC_FIREBASE_*`: Optional Firebase client config for Google sign-in, reviews, share tokens, and cloud sync.

Firebase is disabled gracefully when the public Firebase variables are not set. Local-only watchlist and continue-watching still work.
