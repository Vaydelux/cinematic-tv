'use client';

import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { motion, type Variants } from 'motion/react';
import {
  Activity,
  Check,
  Cloud,
  Database,
  Globe2,
  LogIn,
  LogOut,
  Palette,
  Server,
  Settings2,
  ShieldAlert,
  Sparkles,
  UserCircle,
} from 'lucide-react';
import type { User } from 'firebase/auth';
import { useTheme } from '@/components/ThemeProvider';
import { auth, firebaseConfigured, googleProvider, signInWithPopup, signOut } from '@/lib/firebase';
import { bootstrapUserProfile, saveProfilePreferences, type UserProfile } from '@/lib/profile';
import { getAllServers, getEnabledServers } from '@/lib/servers';
import { getServerHealthSummary } from '@/lib/server-health';
import { getUserSettings, saveUserSettings } from '@/lib/user-settings';
import { CATALOG_GENRES, DEFAULT_HOME_GENRE_IDS } from '@/lib/catalog/genres';
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
const VIEW_EASE = [0.16, 1, 0.3, 1] as const;
const ADULT_RESULTS_PIN = 'cinematic-tv';

const viewVariants = {
  hidden: { opacity: 0, scale: 0.98, filter: 'blur(8px)', y: 20 },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)', y: 0, transition: { duration: 0.5, ease: VIEW_EASE } },
  exit: { opacity: 0, scale: 0.98, filter: 'blur(8px)', y: -20, transition: { duration: 0.4, ease: VIEW_EASE } },
} satisfies Variants;

const THEMES: { id: ThemeId; name: string; color: string; hint: string }[] = [
  { id: 'theme-default', name: 'Cinema', color: 'bg-red-500', hint: 'Classic red' },
  { id: 'theme-crimson', name: 'Crimson', color: 'bg-rose-600', hint: 'Deep premiere' },
  { id: 'theme-ocean', name: 'Teal', color: 'bg-teal-500', hint: 'Cool night' },
  { id: 'theme-emerald', name: 'Emerald', color: 'bg-emerald-500', hint: 'Fresh glow' },
  { id: 'theme-obsidian', name: 'Obsidian', color: 'bg-white', hint: 'High contrast' },
];

type HealthState = {
  tmdbConfigured: boolean;
  deploy?: {
    ready: boolean;
    missingRequired: string[];
    firebaseConfigured: boolean;
    missingFirebase: string[];
    optional: {
      wyzieConfigured: boolean;
      redisConfigured: boolean;
      backendUrlsConfigured: boolean;
    };
  };
  cache?: { redisConfigured?: boolean; redisConnected?: boolean };
  logs?: { failoverCount?: number; sandboxBlockedCount?: number; errors?: number; warns?: number };
};

function Panel({
  icon: Icon,
  eyebrow,
  title,
  children,
  className = '',
}: {
  icon: ComponentType<{ className?: string }>;
  eyebrow?: string;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`premium-panel min-w-0 rounded-xl p-4 sm:p-5 md:p-6 ${className}`}>
      <div className="mb-5 flex min-w-0 items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-contrast shadow-lg shadow-black/25">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          {eyebrow && <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">{eyebrow}</p>}
          <h2 className="break-words font-display text-xl font-bold text-on-surface md:text-2xl">{title}</h2>
        </div>
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
      className={`rounded-lg border px-3 py-2 text-sm font-bold transition ${
        active ? 'premium-control-active shadow-lg shadow-black/25' : 'premium-control text-on-surface-variant hover:text-on-surface'
      }`}
    >
      {children}
    </button>
  );
}

function StatusRow({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3 rounded-lg bg-white/[0.045] px-3 py-2.5 text-sm">
      <span className="truncate text-on-surface-variant">{label}</span>
      <span className={good ? 'font-bold text-emerald-300' : 'font-medium text-on-surface'}>{value}</span>
    </div>
  );
}

export function SettingsView() {
  const { theme, setTheme, colorMode, setColorMode } = useTheme();
  const [user, setUser] = useState<User | null>(auth?.currentUser ?? null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<AppSettings>(getUserSettings());
  const [health, setHealth] = useState<HealthState | null>(null);
  const [serverModalOpen, setServerModalOpen] = useState(false);
  const [servers, setServers] = useState(getEnabledServers());
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);

  const serverHealth = getServerHealthSummary();
  const totalServers = getAllServers().length;

  useEffect(() => {
    fetch('/api/health').then((r) => r.json()).then(setHealth).catch(() => {});
    if (!auth) {
      setUser(null);
      return undefined;
    }
    const unsub = auth.onAuthStateChanged(async (nextUser) => {
      setUser(nextUser);
      if (!nextUser) {
        setProfile(null);
        return;
      }
      try {
        const nextProfile = await bootstrapUserProfile(nextUser);
        setProfile(nextProfile);
        const synced = getUserSettings();
        setSettings(synced);
        setTheme(synced.themeColor);
        setColorMode(synced.colorMode);
      } catch (error) {
        setAccountError(error instanceof Error ? error.message : 'Failed to sync profile');
      }
    });
    return unsub;
  }, [setColorMode, setTheme]);

  const update = async (partial: Partial<AppSettings>) => {
    const next = saveUserSettings(partial);
    setSettings(next);
    if (user) await saveProfilePreferences(user.uid, next);
  };

  const handleTheme = (id: ThemeId) => {
    setTheme(id);
    update({ themeColor: id });
  };

  const handleColorMode = (mode: AppSettings['colorMode']) => {
    setColorMode(mode);
    update({ colorMode: mode });
  };

  const handleAdultResultsToggle = () => {
    if (settings.showAdult) {
      update({ showAdult: false });
      return;
    }

    const pin = window.prompt('Enter PIN');
    if (pin === ADULT_RESULTS_PIN) update({ showAdult: true });
  };

  const toggleHomeGenre = (genreId: string) => {
    const current = new Set(settings.homeGenreIds);
    if (current.has(genreId)) current.delete(genreId);
    else current.add(genreId);
    update({ homeGenreIds: Array.from(current) });
  };

  const handleLogin = async () => {
    setAccountLoading(true);
    setAccountError(null);
    try {
      if (!auth || !googleProvider) throw new Error('Firebase sign-in is not configured.');
      const result = await signInWithPopup(auth, googleProvider);
      const nextProfile = await bootstrapUserProfile(result.user);
      setUser(result.user);
      setProfile(nextProfile);
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
      setUser(null);
      setProfile(null);
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : 'Failed to sign out');
    } finally {
      setAccountLoading(false);
    }
  };

  return (
    <motion.div variants={viewVariants} initial={false} animate="visible" exit="exit" className="mx-auto min-w-0 max-w-7xl px-4 py-6 pb-28 sm:px-6 sm:py-8 md:px-10 md:py-12">
      <div className="mb-8 flex min-w-0 flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Control room
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-on-surface sm:text-5xl md:text-6xl">Settings</h1>
          <p className="mt-2 max-w-2xl text-sm text-on-surface-variant md:text-base">
            Tune the cinema, sync your profile, and keep the deployment ready for Vercel.
          </p>
        </div>
        <div className="grid min-w-0 grid-cols-2 gap-2 sm:flex">
          <StatusRow label="TMDB" value={health?.tmdbConfigured ? 'Connected' : 'Missing'} good={health?.tmdbConfigured} />
          <StatusRow label="Servers" value={`${servers.length}/${totalServers}`} good={servers.length > 0} />
        </div>
      </div>

      <div className="grid min-w-0 gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel icon={UserCircle} eyebrow="Profile" title="Account">
          {accountError && (
            <div className="mb-4 flex gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-red-100">
              <ShieldAlert className="h-4 w-4 shrink-0 text-primary" />
              {accountError}
            </div>
          )}
          {user ? (
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-4">
                {user.photoURL ? (
                  <div
                    className="h-16 w-16 rounded-2xl bg-cover bg-center ring-1 ring-white/15"
                    style={{ backgroundImage: `url(${user.photoURL})` }}
                    aria-hidden
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-xl font-black text-primary-contrast">
                    {(profile?.displayName ?? user.email ?? 'C').slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate font-display text-2xl font-bold">{profile?.displayName ?? user.displayName ?? 'Cinematic viewer'}</p>
                  <p className="truncate text-sm text-on-surface-variant">{profile?.email || user.email || 'Signed in'}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-white/[0.045] p-3">
                  <p className="text-lg font-bold">{profile?.stats.watchlistCount ?? 0}</p>
                  <p className="text-[11px] uppercase tracking-wide text-on-surface-variant">Saved</p>
                </div>
                <div className="rounded-lg bg-white/[0.045] p-3">
                  <p className="text-lg font-bold">{profile?.stats.continueWatchingCount ?? 0}</p>
                  <p className="text-[11px] uppercase tracking-wide text-on-surface-variant">Watching</p>
                </div>
                <div className="rounded-lg bg-white/[0.045] p-3">
                  <p className="text-lg font-bold">{profile?.stats.reviewsCount ?? 0}</p>
                  <p className="text-[11px] uppercase tracking-wide text-on-surface-variant">Reviews</p>
                </div>
              </div>
              <button type="button" onClick={handleSignOut} disabled={accountLoading} className="inline-flex items-center justify-center gap-2 rounded-lg bg-white/[0.08] px-4 py-2.5 text-sm font-bold hover:bg-white/[0.12] disabled:opacity-50">
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <p className="text-sm leading-6 text-on-surface-variant">
                {firebaseConfigured
                  ? 'Sign in with Google to create your profile and sync settings, watchlist, and continue watching.'
                  : 'Set NEXT_PUBLIC_FIREBASE_* variables in Vercel to enable cloud profile sync.'}
              </p>
              <button type="button" onClick={handleLogin} disabled={accountLoading || !firebaseConfigured} className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-primary-contrast shadow-lg shadow-black/25 hover:brightness-110 disabled:opacity-50">
                <LogIn className="h-4 w-4" />
                Sign in with Google
              </button>
            </div>
          )}
        </Panel>

        <Panel icon={Palette} eyebrow="Look and feel" title="Appearance">
          <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl bg-black/20 p-1">
            <button type="button" onClick={() => handleColorMode('dark')} className={`rounded-lg px-3 py-3 text-sm font-bold transition ${colorMode === 'dark' ? 'premium-control-active' : 'text-on-surface-variant hover:bg-white/10 hover:text-on-surface'}`}>
              Dark
            </button>
            <button type="button" onClick={() => handleColorMode('light')} className={`rounded-lg px-3 py-3 text-sm font-bold transition ${colorMode === 'light' ? 'premium-control-active' : 'text-on-surface-variant hover:bg-white/10 hover:text-on-surface'}`}>
              Light
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {THEMES.map((item) => (
              <button key={item.id} type="button" onClick={() => handleTheme(item.id)} className={`rounded-xl border p-3 text-left transition ${theme === item.id ? 'border-primary bg-primary/10 shadow-lg shadow-black/20' : 'border-white/10 bg-white/[0.045] hover:bg-white/[0.08]'}`}>
                <span className={`mb-3 flex h-9 w-9 items-center justify-center rounded-full ${item.color}`}>
                  {theme === item.id && <Check className="h-4 w-4 text-black mix-blend-difference" />}
                </span>
                <span className="block text-sm font-bold">{item.name}</span>
                <span className="text-xs text-on-surface-variant">{item.hint}</span>
              </button>
            ))}
          </div>
        </Panel>

        <Panel icon={Globe2} eyebrow="Catalog" title="Discovery Defaults">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-on-surface-variant">Content source</p>
              <div className="flex flex-wrap gap-2">
                {(['all', 'tmdb', 'anilist'] as const).map((source) => (
                  <OptionButton key={source} active={settings.contentSource === source} onClick={() => update({ contentSource: source })}>
                    {source === 'all' ? 'All' : source === 'tmdb' ? 'Movies & TV' : 'Anime'}
                  </OptionButton>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-on-surface-variant">Subtitles</p>
              <div className="flex flex-wrap gap-2">
                {SUBTITLES.map((lang) => (
                  <OptionButton key={lang} active={settings.preferredSubtitleLanguage === lang} onClick={() => update({ preferredSubtitleLanguage: lang })}>
                    {lang.toUpperCase()}
                  </OptionButton>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-on-surface-variant">Metadata language</p>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map((language) => (
                  <OptionButton key={language.id} active={settings.language === language.id} onClick={() => update({ language: language.id })}>
                    {language.label}
                  </OptionButton>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-on-surface-variant">Region</p>
              <div className="flex flex-wrap gap-2">
                {REGIONS.map((region) => (
                  <OptionButton key={region} active={settings.region === region} onClick={() => update({ region })}>
                    {region}
                  </OptionButton>
                ))}
              </div>
            </div>
          </div>
          <button type="button" onClick={handleAdultResultsToggle} className={`mt-5 flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition ${settings.showAdult ? 'border-primary/50 bg-primary/10' : 'border-white/10 bg-white/[0.045] hover:bg-white/[0.08]'}`}>
            <span>
              <span className="block text-sm font-bold">Adult anime results</span>
              <span className="block text-xs text-on-surface-variant">Applied to AniList browse and search requests.</span>
            </span>
            <span className={`h-6 w-11 rounded-full p-1 transition ${settings.showAdult ? 'bg-primary' : 'bg-white/20'}`}>
              <span className={`block h-4 w-4 rounded-full bg-primary-contrast transition ${settings.showAdult ? 'translate-x-5' : ''}`} />
            </span>
          </button>
          <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.045] p-4">
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold text-on-surface">Home genre rails</p>
                <p className="mt-1 text-xs text-on-surface-variant">Choose which lazy genre rows can appear near the bottom of Home.</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  update({
                    homeGenreIds:
                      settings.homeGenreIds.length === DEFAULT_HOME_GENRE_IDS.length ? [] : DEFAULT_HOME_GENRE_IDS,
                  })
                }
                className="rounded-lg bg-white/[0.08] px-3 py-2 text-xs font-bold text-on-surface-variant transition hover:bg-white/[0.12] hover:text-on-surface"
              >
                {settings.homeGenreIds.length === DEFAULT_HOME_GENRE_IDS.length ? 'Clear all' : 'Select all'}
              </button>
            </div>
            <div className="flex max-h-36 flex-wrap gap-2 overflow-y-auto pr-1 hide-scrollbar">
              {CATALOG_GENRES.map((genre) => (
                <button
                  key={genre.id}
                  type="button"
                  onClick={() => toggleHomeGenre(genre.id)}
                  className={`rounded-lg border px-3 py-2 text-xs font-bold uppercase tracking-wide transition ${
                    settings.homeGenreIds.includes(genre.id)
                      ? 'border-primary/50 bg-primary/10 text-primary'
                      : 'border-white/10 bg-white/[0.04] text-on-surface-variant hover:bg-white/[0.08]'
                  }`}
                >
                  {genre.name}
                </button>
              ))}
            </div>
          </div>
        </Panel>

        <Panel icon={Server} eyebrow="Playback" title="Embed Servers">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-on-surface-variant">{servers.length} of {totalServers} servers visible</p>
              <p className="mt-1 text-xs text-on-surface-variant">Default server is tried first, then your priority order.</p>
            </div>
            <button type="button" onClick={() => setServerModalOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-primary-contrast hover:brightness-110">
              <Settings2 className="h-4 w-4" />
              Manage servers
            </button>
          </div>
          <div className="mb-5 rounded-xl border border-white/10 bg-white/[0.045] p-4">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold text-on-surface">Iframe protection</p>
                <p className="mt-1 text-xs leading-5 text-on-surface-variant">
                  Strict mode blocks popup and page-redirect permissions. Compatibility mode is only used for servers marked as compatibility-only.
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <OptionButton active={settings.iframeSandboxMode === 'strict'} onClick={() => update({ iframeSandboxMode: 'strict' })}>
                  Strict
                </OptionButton>
                <OptionButton active={settings.iframeSandboxMode === 'compatibility'} onClick={() => update({ iframeSandboxMode: 'compatibility' })}>
                  Compatibility
                </OptionButton>
              </div>
            </div>
            {settings.iframeSandboxMode === 'compatibility' && (
              <div className="flex gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs leading-5 text-on-surface">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                Compatibility mode may allow third-party popup behavior on selected providers. Use strict mode for the safest client demo.
              </div>
            )}
          </div>
          <div className="flex max-h-36 flex-wrap gap-2 overflow-y-auto pr-1 hide-scrollbar">
            {servers.map((server) => (
              <OptionButton key={server.id} active={settings.defaultServerId === server.id} onClick={() => update({ defaultServerId: server.id })}>
                {server.name}
              </OptionButton>
            ))}
          </div>
        </Panel>

        <Panel icon={Activity} eyebrow="Runtime" title="System Health">
          <div className="space-y-3">
            <StatusRow label="TMDB catalog" value={health?.tmdbConfigured ? 'Connected' : 'Missing token'} good={health?.tmdbConfigured} />
            <StatusRow label="AniList" value="Public API" good />
            <StatusRow label="Redis cache" value={health?.cache?.redisConfigured ? (health.cache.redisConnected ? 'Connected' : 'Configured') : 'In-memory'} good={health?.cache?.redisConnected} />
            <StatusRow label="Server failovers" value={String(health?.logs?.failoverCount ?? 0)} />
            <StatusRow label="Protected iframe blocks" value={String(health?.logs?.sandboxBlockedCount ?? 0)} />
            {serverHealth.avgSuccessRate != null && <StatusRow label="Average server success" value={`${serverHealth.avgSuccessRate}%`} good={serverHealth.avgSuccessRate > 50} />}
          </div>
        </Panel>

        <Panel icon={Cloud} eyebrow="Vercel" title="Deployment Readiness">
          <div className="space-y-3">
            <StatusRow label="Required env" value={health?.deploy?.ready ? 'Ready' : `Missing ${health?.deploy?.missingRequired.join(', ') || 'unknown'}`} good={health?.deploy?.ready} />
            <StatusRow label="Firebase profile sync" value={health?.deploy?.firebaseConfigured ? 'Configured' : 'Local fallback'} good={health?.deploy?.firebaseConfigured} />
            <StatusRow label="Subtitles" value={health?.deploy?.optional.wyzieConfigured ? 'Wyzie key set' : 'Optional'} good={health?.deploy?.optional.wyzieConfigured} />
            <StatusRow label="Shared cache" value={health?.deploy?.optional.redisConfigured ? 'Configured' : 'Memory fallback'} good={health?.deploy?.optional.redisConfigured} />
          </div>
        </Panel>

        <Panel icon={Database} eyebrow="Credits" title="Attribution" className="xl:col-span-2">
          <p className="text-sm text-on-surface-variant">
            This product uses the TMDB API but is not endorsed or certified by TMDB. Anime metadata is provided through AniList public APIs.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            <a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer" className="rounded-lg bg-white/[0.06] px-3 py-2 font-bold text-primary hover:bg-white/10">
              themoviedb.org
            </a>
            <a href="https://anilist.co" target="_blank" rel="noopener noreferrer" className="rounded-lg bg-white/[0.06] px-3 py-2 font-bold text-primary hover:bg-white/10">
              anilist.co
            </a>
          </div>
        </Panel>
      </div>

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
          if (user) saveProfilePreferences(user.uid, saved);
        }}
      />
    </motion.div>
  );
}
