'use client';

import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { motion } from 'motion/react';
import {
  Activity,
  Check,
  Database,
  Globe2,
  LogIn,
  LogOut,
  Moon,
  Palette,
  Server,
  Settings2,
  ShieldAlert,
  Sun,
  UserCircle,
} from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { auth, firebaseConfigured, googleProvider, signInWithPopup, signOut } from '@/lib/firebase';
import { getAllServers, getEnabledServers } from '@/lib/servers';
import { getServerHealthSummary } from '@/lib/server-health';
import { getUserSettings, saveUserSettings } from '@/lib/user-settings';
import { ServerManagerModal } from '@/components/ServerManagerModal';
import type { AppSettings, ThemeId } from '@/lib/types';

const LANGUAGES = [
  { id: 'en-US', label: 'English (US)' },
  { id: 'es-ES', label: 'Spanish' },
  { id: 'fr-FR', label: 'French' },
  { id: 'de-DE', label: 'German' },
  { id: 'ja-JP', label: 'Japanese' },
];

const REGIONS = ['US', 'GB', 'CA', 'AU', 'DE', 'FR', 'ES', 'JP'];
const SUBTITLES = ['en', 'es', 'fr', 'de', 'ja'];

const viewVariants = {
  hidden: { opacity: 0, scale: 0.98, filter: 'blur(8px)', y: 20 },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)', y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, scale: 0.98, filter: 'blur(8px)', y: -20, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

const THEMES: { id: ThemeId; name: string; color: string }[] = [
  { id: 'theme-default', name: 'Cinema', color: 'bg-red-500' },
  { id: 'theme-crimson', name: 'Crimson', color: 'bg-rose-600' },
  { id: 'theme-ocean', name: 'Teal', color: 'bg-teal-500' },
  { id: 'theme-emerald', name: 'Emerald', color: 'bg-emerald-500' },
  { id: 'theme-obsidian', name: 'Obsidian', color: 'bg-white' },
];

type HealthState = {
  tmdbConfigured: boolean;
  cache?: { redisConfigured?: boolean; redisConnected?: boolean };
  logs?: { failoverCount?: number; errors?: number; warns?: number };
};

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="cinema-panel cinema-ring rounded-lg p-5">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/[0.15] text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <h2 className="font-display text-xl font-bold text-on-surface">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function OptionButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-3 py-2 text-sm font-medium transition ${
        active ? 'bg-primary text-white' : 'bg-white/[0.06] text-on-surface-variant hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  );
}

export function SettingsView() {
  const { theme, setTheme, colorMode, setColorMode } = useTheme();
  const [user, setUser] = useState(auth?.currentUser ?? null);
  const [settings, setSettings] = useState<AppSettings>(getUserSettings());
  const [health, setHealth] = useState<HealthState | null>(null);
  const [serverModalOpen, setServerModalOpen] = useState(false);
  const [servers, setServers] = useState(getEnabledServers());
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);
  const serverHealth = getServerHealthSummary();
  const totalServers = getAllServers().length;

  useEffect(() => {
    if (!auth) {
      setUser(null);
      fetch('/api/health').then((r) => r.json()).then(setHealth).catch(() => {});
      return undefined;
    }
    const unsub = auth.onAuthStateChanged((u) => setUser(u));
    fetch('/api/health').then((r) => r.json()).then(setHealth).catch(() => {});
    return unsub;
  }, []);

  const update = (partial: Partial<AppSettings>) => {
    const next = saveUserSettings(partial);
    setSettings(next);
  };

  const handleTheme = (id: ThemeId) => {
    setTheme(id);
    update({ themeColor: id });
  };

  const handleColorMode = (mode: AppSettings['colorMode']) => {
    setColorMode(mode);
    update({ colorMode: mode });
  };

  const handleLogin = async () => {
    setAccountLoading(true);
    setAccountError(null);
    try {
      if (!auth || !googleProvider) throw new Error('Firebase sign-in is not configured.');
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : 'Failed to sign in');
    } finally {
      setAccountLoading(false);
    }
  };

  const handleSignOut = async () => {
    setAccountLoading(true);
    setAccountError(null);
    try {
      if (!auth) throw new Error('Firebase sign-in is not configured.');
      await signOut(auth);
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : 'Failed to sign out');
    } finally {
      setAccountLoading(false);
    }
  };

  return (
    <motion.div variants={viewVariants} initial={false} animate="visible" exit="exit" className="mx-auto max-w-6xl px-4 py-8 pb-24 sm:px-5 md:px-10 md:py-12">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Control room</p>
          <h1 className="font-display text-3xl font-bold text-on-surface sm:text-4xl md:text-5xl">Settings</h1>
        </div>
        <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2 sm:flex">
          <div className="rounded-md border border-white/10 bg-white/[0.06] px-3 py-2 text-xs text-on-surface-variant">
            TMDB: {health?.tmdbConfigured ? 'Connected' : 'Missing'}
          </div>
          <div className="rounded-md border border-white/10 bg-white/[0.06] px-3 py-2 text-xs text-on-surface-variant">
            Servers: {servers.length}/{totalServers}
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <Section icon={Palette} title="Theme">
          <div className="mb-4 grid grid-cols-2 gap-2 rounded-lg bg-white/[0.04] p-1">
            <button
              type="button"
              onClick={() => handleColorMode('dark')}
              className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-bold ${
                colorMode === 'dark' ? 'bg-primary text-white' : 'text-on-surface-variant hover:bg-white/10'
              }`}
            >
              <Moon className="h-4 w-4" />
              Dark
            </button>
            <button
              type="button"
              onClick={() => handleColorMode('light')}
              className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-bold ${
                colorMode === 'light' ? 'bg-primary text-white' : 'text-on-surface-variant hover:bg-white/10'
              }`}
            >
              <Sun className="h-4 w-4" />
              Light
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {THEMES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTheme(item.id)}
                className={`rounded-lg border p-3 text-left transition ${
                  theme === item.id ? 'border-primary bg-primary/10' : 'border-white/10 bg-white/[0.04] hover:bg-white/[0.08]'
                }`}
              >
                <span className={`mb-3 flex h-8 w-8 items-center justify-center rounded-full ${item.color}`}>
                  {theme === item.id && <Check className="h-4 w-4 text-black mix-blend-difference" />}
                </span>
                <span className="block text-sm font-bold">{item.name}</span>
              </button>
            ))}
          </div>
        </Section>

        <Section icon={Server} title="Embed Servers">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-on-surface-variant">{servers.length} of {totalServers} servers visible</p>
              <p className="text-xs text-on-surface-variant mt-1">Default server is tried first, then your priority order.</p>
            </div>
            <button
              type="button"
              onClick={() => setServerModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90"
            >
              <Settings2 className="h-4 w-4" />
              Manage
            </button>
          </div>
          <div className="flex max-h-28 flex-wrap gap-2 overflow-y-auto hide-scrollbar">
            {servers.map((server) => (
              <OptionButton
                key={server.id}
                active={settings.defaultServerId === server.id}
                onClick={() => update({ defaultServerId: server.id })}
              >
                {server.name}
              </OptionButton>
            ))}
          </div>
        </Section>

        <ServerManagerModal
          open={serverModalOpen}
          onClose={() => setServerModalOpen(false)}
          onSaved={(next) => {
            const visible = getEnabledServers();
            let saved = next;
            if (!visible.some((server) => server.id === next.defaultServerId) && visible[0]) {
              saved = saveUserSettings({ defaultServerId: visible[0].id });
            }
            setSettings(saved);
            setServers(visible);
          }}
        />

        <Section icon={Globe2} title="Catalog">
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-on-surface-variant">Content source</p>
              <div className="flex flex-wrap gap-2">
                {(['all', 'tmdb', 'anilist'] as const).map((source) => (
                  <OptionButton
                    key={source}
                    active={settings.contentSource === source}
                    onClick={() => update({ contentSource: source })}
                  >
                    {source === 'all' ? 'All' : source === 'tmdb' ? 'Movies & TV' : 'Anime'}
                  </OptionButton>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-on-surface-variant">Metadata language</p>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map((language) => (
                  <OptionButton
                    key={language.id}
                    active={settings.language === language.id}
                    onClick={() => update({ language: language.id })}
                  >
                    {language.label}
                  </OptionButton>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-on-surface-variant">Region</p>
              <div className="flex flex-wrap gap-2">
                {REGIONS.map((region) => (
                  <OptionButton
                    key={region}
                    active={settings.region === region}
                    onClick={() => update({ region })}
                  >
                    {region}
                  </OptionButton>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-on-surface-variant">Subtitles</p>
              <div className="flex flex-wrap gap-2">
                {SUBTITLES.map((lang) => (
                  <OptionButton
                    key={lang}
                    active={settings.preferredSubtitleLanguage === lang}
                    onClick={() => update({ preferredSubtitleLanguage: lang })}
                  >
                    {lang.toUpperCase()}
                  </OptionButton>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => update({ showAdult: !settings.showAdult })}
              className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition ${
                settings.showAdult ? 'border-primary/50 bg-primary/10' : 'border-white/10 bg-white/[0.04] hover:bg-white/[0.08]'
              }`}
            >
              <span>
                <span className="block text-sm font-bold">Adult anime results</span>
                <span className="block text-xs text-on-surface-variant">Applied to AniList browse and search requests.</span>
              </span>
              <span className={`h-6 w-11 rounded-full p-1 transition ${settings.showAdult ? 'bg-primary' : 'bg-white/20'}`}>
                <span className={`block h-4 w-4 rounded-full bg-white transition ${settings.showAdult ? 'translate-x-5' : ''}`} />
              </span>
            </button>
          </div>
        </Section>

        <Section icon={Activity} title="Health">
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-md bg-white/[0.04] px-3 py-2">
              <span className="text-on-surface-variant">TMDB catalog</span>
              <span className={health?.tmdbConfigured ? 'text-emerald-300' : 'text-amber-300'}>
                {health?.tmdbConfigured ? 'Connected' : 'Missing token'}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-md bg-white/[0.04] px-3 py-2">
              <span className="text-on-surface-variant">AniList</span>
              <span className="text-emerald-300">Public API</span>
            </div>
            <div className="flex items-center justify-between rounded-md bg-white/[0.04] px-3 py-2">
              <span className="text-on-surface-variant">Redis cache</span>
              <span className={health?.cache?.redisConnected ? 'text-emerald-300' : 'text-on-surface-variant'}>
                {health?.cache?.redisConfigured ? (health.cache.redisConnected ? 'Connected' : 'Configured') : 'In-memory'}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-md bg-white/[0.04] px-3 py-2">
              <span className="text-on-surface-variant">Server failovers</span>
              <span>{health?.logs?.failoverCount ?? 0}</span>
            </div>
            {serverHealth.avgSuccessRate != null && (
              <div className="flex items-center justify-between rounded-md bg-white/[0.04] px-3 py-2">
                <span className="text-on-surface-variant">Avg server success</span>
                <span>{serverHealth.avgSuccessRate}%</span>
              </div>
            )}
          </div>
        </Section>

        <Section icon={UserCircle} title="Account">
          {accountError && (
            <div className="mb-3 flex gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-red-100">
              <ShieldAlert className="h-4 w-4 shrink-0 text-primary" />
              {accountError}
            </div>
          )}
          {user ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-on-surface">{user.email || 'Anonymous account'}</p>
                <p className="text-sm text-on-surface-variant">Watchlist and continue watching can sync with Firebase.</p>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={accountLoading}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-white/[0.08] px-4 py-2 text-sm font-bold hover:bg-white/10 disabled:opacity-50"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-on-surface-variant">
                {firebaseConfigured
                  ? 'Sign in with Google to sync watchlist and continue watching.'
                  : 'Set NEXT_PUBLIC_FIREBASE_* env vars to enable cloud sync.'}
              </p>
              <button
                type="button"
                onClick={handleLogin}
                disabled={accountLoading || !firebaseConfigured}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50"
              >
                <LogIn className="h-4 w-4" />
                Sign in
              </button>
            </div>
          )}
        </Section>

        <Section icon={Database} title="Attribution">
          <p className="text-sm text-on-surface-variant">
            This product uses the TMDB API but is not endorsed or certified by TMDB.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer" className="rounded-md bg-white/[0.06] px-3 py-2 text-primary hover:bg-white/10">
              themoviedb.org
            </a>
            <a href="https://anilist.co" target="_blank" rel="noopener noreferrer" className="rounded-md bg-white/[0.06] px-3 py-2 text-primary hover:bg-white/10">
              anilist.co
            </a>
          </div>
        </Section>
      </div>
    </motion.div>
  );
}
