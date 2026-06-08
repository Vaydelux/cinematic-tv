import type { NextConfig } from 'next';
import { EMBED_SERVER_CATALOG } from './lib/embed-servers';

const embedDomains = [
  ...new Set(EMBED_SERVER_CATALOG.flatMap((s) => s.domains)),
  'www.youtube-nocookie.com',
];

const isVercel = !!process.env.VERCEL;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(isVercel ? {} : {
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

export default nextConfig;
