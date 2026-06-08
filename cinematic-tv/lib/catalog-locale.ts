'use client';

import { getUserSettings } from '@/lib/user-settings';

export function getCatalogLocale(): { language: string; region: string } {
  const s = getUserSettings();
  return { language: s.language, region: s.region };
}

export function catalogLocaleParams(): Record<string, string> {
  const { language, region } = getCatalogLocale();
  return { language, region };
}
