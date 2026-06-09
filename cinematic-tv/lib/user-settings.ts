'use client';

import type { AppSettings } from '@/lib/types';
import { DEFAULT_HOME_GENRE_IDS } from '@/lib/catalog/genres';

const KEY = 'cinematic-settings';
const LEGACY_THEME_KEY = 'app-theme';

const THEMES = new Set<AppSettings['themeColor']>([
  'theme-default',
  'theme-crimson',
  'theme-ocean',
  'theme-emerald',
  'theme-obsidian',
]);

function normalizeTheme(value: unknown): AppSettings['themeColor'] {
  if (value === 'default') return 'theme-default';
  return typeof value === 'string' && THEMES.has(value as AppSettings['themeColor'])
    ? (value as AppSettings['themeColor'])
    : 'theme-default';
}

function normalizeStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function normalizeContentSource(value: unknown): AppSettings['contentSource'] {
  return value === 'tmdb' || value === 'anilist' || value === 'all' ? value : 'all';
}

function normalizeIframeSandboxMode(value: unknown): AppSettings['iframeSandboxMode'] {
  return value === 'compatibility' ? 'compatibility' : 'strict';
}

export function normalizeSettings(value: Partial<AppSettings> | null | undefined): AppSettings {
  const parsed = value ?? {};
  return {
    ...DEFAULT_SETTINGS,
    ...parsed,
    themeColor: normalizeTheme(parsed.themeColor),
    colorMode: normalizeColorMode(parsed.colorMode),
    homeRailOrder: normalizeStringArray(parsed.homeRailOrder),
    hiddenServerIds: normalizeStringArray(parsed.hiddenServerIds),
    serverOrder: normalizeStringArray(parsed.serverOrder),
    preferredSubtitleLanguage:
      typeof parsed.preferredSubtitleLanguage === 'string' ? parsed.preferredSubtitleLanguage : 'en',
    onboardingComplete: parsed.onboardingComplete ?? false,
    contentSource: normalizeContentSource(parsed.contentSource),
    showAdult: Boolean(parsed.showAdult),
    iframeSandboxMode: normalizeIframeSandboxMode(parsed.iframeSandboxMode),
    homeGenreIds:
      parsed.homeGenreIds === undefined
        ? DEFAULT_HOME_GENRE_IDS
        : normalizeStringArray(parsed.homeGenreIds).filter((id) => DEFAULT_HOME_GENRE_IDS.includes(id)),
  };
}

function normalizeColorMode(value: unknown): AppSettings['colorMode'] {
  return value === 'light' ? 'light' : 'dark';
}

export const DEFAULT_SETTINGS: AppSettings = {
  themeColor: 'theme-default',
  colorMode: 'dark',
  fontSize: 'medium',
  homeRailOrder: [],
  language: 'en-US',
  region: 'US',
  defaultServerId: 'vidfast',
  serverOrder: [],
  hiddenServerIds: [],
  preferredSubtitleLanguage: 'en',
  onboardingComplete: false,
  contentSource: 'all',
  showAdult: false,
  iframeSandboxMode: 'strict',
  homeGenreIds: DEFAULT_HOME_GENRE_IDS,
};

export function getUserSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const legacyTheme = normalizeTheme(localStorage.getItem(LEGACY_THEME_KEY));
      return { ...DEFAULT_SETTINGS, themeColor: legacyTheme };
    }
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return normalizeSettings({
      ...parsed,
      themeColor: parsed.themeColor ?? normalizeTheme(localStorage.getItem(LEGACY_THEME_KEY)),
    });
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function replaceUserSettings(settings: Partial<AppSettings>) {
  const next = normalizeSettings(settings);
  if (typeof window === 'undefined') return next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
    localStorage.removeItem(LEGACY_THEME_KEY);
  } catch {
    // Keep the normalized settings available to callers even when storage fails.
  }
  return next;
}

export function saveUserSettings(partial: Partial<AppSettings>) {
  const current = getUserSettings();
  const next = {
    ...current,
    ...partial,
    themeColor: normalizeTheme(partial.themeColor ?? current.themeColor),
    colorMode: normalizeColorMode(partial.colorMode ?? current.colorMode),
    homeRailOrder: normalizeStringArray(partial.homeRailOrder ?? current.homeRailOrder),
    hiddenServerIds: normalizeStringArray(partial.hiddenServerIds ?? current.hiddenServerIds),
    serverOrder: normalizeStringArray(partial.serverOrder ?? current.serverOrder),
    contentSource: normalizeContentSource(partial.contentSource ?? current.contentSource),
    iframeSandboxMode: normalizeIframeSandboxMode(partial.iframeSandboxMode ?? current.iframeSandboxMode),
    homeGenreIds: normalizeStringArray(partial.homeGenreIds ?? current.homeGenreIds).filter((id) =>
      DEFAULT_HOME_GENRE_IDS.includes(id)
    ),
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
    localStorage.removeItem(LEGACY_THEME_KEY);
  } catch {
    // Keep the in-memory settings usable when storage is blocked or full.
  }
  return next;
}
