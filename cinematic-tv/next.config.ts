import type { NextConfig } from 'next';
import { EMBED_SERVER_CATALOG } from './lib/embed-servers';
import withSerwistInit from '@serwist/next';

// Serwist PWA configuration
// Service worker is generated at build time with precached assets
const withSerwist = withSerwistInit({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  reloadOnOnline: true,
  globPublicPatterns: [],
  // Disable in dev to avoid Turbopack conflicts; webpack handles it in production
  disable: process.env.NODE_ENV === 'development',
});

const embedDomains = [
  ...new Set(EMBED_SERVER_CATALOG.flatMap((s) => s.domains)),
  'www.youtube-nocookie.com',
];

const isVercel = !!process.env.VERCEL;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(isVercel ? { turbopack: {} } : {
    output: 'standalone',
    outputFileTracingRoot: process.cwd(),
    turbopack: {
      root: process.cwd(),
    },
  }),
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'picsum.photos', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: 'image.tmdb.org', pathname: '/**' },
      { protocol: 'https', hostname: 's4.anilist.co', pathname: '/**' },
      { protocol: 'https', hostname: 'img1.akac.crunchyroll.com', pathname: '/**' },
    ],
  },
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `frame-src 'self' ${embedDomains.map((d) => `https://${d}`).join(' ')};`,
          },
        ],
      },
    ];
  },

  transpilePackages: ['motion'],
  webpack: (config, { dev }) => {
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = { ignored: /.*/ };
    }
    return config;
  },
};

export default withSerwist(nextConfig);
