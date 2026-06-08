# Cinematic TV

A Next.js App Router streaming catalog UI for movies, TV, and anime. It combines TMDB metadata, AniList anime data, Firebase-backed user features, configurable embed servers, continue watching, reviews, subtitles, and server failover.

## Requirements

- Node.js 20.9 or newer, below Node 26
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

- Set the project Node.js version to a supported LTS release. This repo also pins `engines.node` to `>=20.9.0 <26`.
- Set the environment variables from `.env.example`.
- Import the Git repository into Vercel. A local `.vercel/project.json` is not required for Git-based deployments; it is only needed when running `vercel build` against a locally linked project.
- Deploy with the configured build command: `npm run build`.
- Recommended production variables:

  ```bash
  TMDB_ACCESS_TOKEN="..."
  APP_URL="https://your-project.vercel.app"
  NEXT_PUBLIC_FIREBASE_API_KEY="..."
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="..."
  NEXT_PUBLIC_FIREBASE_PROJECT_ID="..."
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="..."
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
  NEXT_PUBLIC_FIREBASE_APP_ID="..."
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="..."
  WYZIE_API_KEY="optional"
  REDIS_URL="optional"
  ```

- Add the Vercel domain to Firebase Auth > Authorized domains when Google sign-in is enabled.
- If you want to run Vercel's local build check, link or pull project settings first:

  ```bash
  vercel pull --yes --environment preview
  vercel build --yes
  ```

- Deploy Firestore rules and indexes before enabling cloud sync:

  ```bash
  npm run firebase:deploy-rules
  ```

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
