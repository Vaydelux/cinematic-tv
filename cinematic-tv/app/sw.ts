import { defaultCache } from '@serwist/next/worker';
import type { PrecacheEntry } from 'serwist';
import { Serwist, NetworkOnly } from 'serwist';

declare const self: any & {
  __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
};

// Protect Vercel serverless functions from service-worker cache writes or background revalidation.
const optimizedRuntimeCache = [
  {
    matcher: ({ sameOrigin, url }) => sameOrigin && url.pathname.startsWith('/api/'),
    handler: new NetworkOnly(),
  },
  // Fall back to standard Serwist caching for static assets, chunks, and pages.
  ...defaultCache,
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: optimizedRuntimeCache,
});

serwist.addEventListeners();
