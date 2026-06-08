'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getUserSettings, saveUserSettings } from '@/lib/user-settings';
import type { ColorMode, ThemeId } from '@/lib/types';

type Theme = ThemeId;

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  colorMode: ColorMode;
  setColorMode: (mode: ColorMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'theme-default',
  setTheme: () => {},
  colorMode: 'dark',
  setColorMode: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('theme-default');
  const [colorMode, setColorMode] = useState<ColorMode>('dark');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const settings = getUserSettings();
    setTheme(settings.themeColor);
    setColorMode(settings.colorMode);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const root = document.documentElement;
    const themeClasses: Theme[] = [
      'theme-default',
      'theme-crimson',
      'theme-ocean',
      'theme-emerald',
      'theme-obsidian',
    ];
    root.classList.remove('mode-dark', 'mode-light', 'dark', 'light');
    themeClasses.forEach((t) => root.classList.remove(t));
    root.classList.add(theme);
    root.classList.add(`mode-${colorMode}`);
    root.classList.add(colorMode);
    root.style.colorScheme = colorMode;
    saveUserSettings({ themeColor: theme, colorMode });
  }, [colorMode, loaded, theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, colorMode, setColorMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
