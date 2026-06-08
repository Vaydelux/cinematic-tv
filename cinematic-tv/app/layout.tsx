import './globals.css';
import { Inter, Space_Grotesk } from 'next/font/google';
import type { Metadata, Viewport } from 'next';
import { ThemeProvider } from '@/components/ThemeProvider';
import { LogProvider } from '@/components/LogProvider';
import { ServiceWorkerRegister } from '../components/ServiceWorkerRegister';

const inter = Inter({ subsets: ['latin'], variable: '--app-font-body' });
const space = Space_Grotesk({ subsets: ['latin'], variable: '--app-font-display' });

export const metadata: Metadata = {
  applicationName: 'Cinematic TV',
  title: {
    default: 'Cinematic TV',
    template: '%s | Cinematic TV',
  },
  description: 'A cinematic streaming dashboard for movies, TV, and anime.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'Cinematic TV',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
  },
};

export const viewport: Viewport = {
  themeColor: '#090909',
  colorScheme: 'dark light',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${space.variable} mode-dark theme-default`}>
      <body className="cinema-backdrop antialiased bg-background text-on-surface">
        <ThemeProvider>
          <LogProvider>
            {children}
            <ServiceWorkerRegister />
          </LogProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
