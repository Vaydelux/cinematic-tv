import './globals.css';
import { Inter, Space_Grotesk } from 'next/font/google';
import { ThemeProvider } from '@/components/ThemeProvider';
import { LogProvider } from '@/components/LogProvider';

const inter = Inter({ subsets: ['latin'], variable: '--app-font-body' });
const space = Space_Grotesk({ subsets: ['latin'], variable: '--app-font-display' });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${space.variable} mode-dark theme-default`}>
      <body className="cinema-backdrop antialiased bg-background text-on-surface">
        <ThemeProvider>
          <LogProvider>{children}</LogProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
