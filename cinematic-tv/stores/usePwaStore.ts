'use client';

import { create } from 'zustand';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

type PwaStore = {
  deferredPrompt: BeforeInstallPromptEvent | null;
  canInstall: boolean;
  isInstalled: boolean;
  setDeferredPrompt: (prompt: BeforeInstallPromptEvent | null) => void;
  setIsInstalled: (isInstalled: boolean) => void;
  triggerInstall: () => Promise<boolean>;
};

export const usePwaStore = create<PwaStore>((set, get) => ({
  deferredPrompt: null,
  canInstall: false,
  isInstalled: false,
  setDeferredPrompt: (prompt) => set({ deferredPrompt: prompt, canInstall: !!prompt }),
  setIsInstalled: (isInstalled) => set({ isInstalled }),
  triggerInstall: async () => {
    const prompt = get().deferredPrompt;
    if (!prompt) return false;

    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === 'accepted') {
        set({ deferredPrompt: null, canInstall: false });
        return true;
      }
    } catch (err) {
      console.error('PWA install prompt error:', err);
    }
    return false;
  },
}));
