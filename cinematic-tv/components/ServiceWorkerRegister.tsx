'use client';

import { useEffect } from 'react';
import { usePwaStore } from '@/stores/usePwaStore';

export function ServiceWorkerRegister() {
  const setDeferredPrompt = usePwaStore((s) => s.setDeferredPrompt);
  const setIsInstalled = usePwaStore((s) => s.setIsInstalled);

  useEffect(() => {
    // Check if app is already running in standalone mode
    const checkStandalone = () => {
      const isStandalone = 
        window.matchMedia('(display-mode: standalone)').matches || 
        (navigator as any).standalone === true;
      setIsInstalled(isStandalone);
    };

    checkStandalone();

    // Listen for the custom display-mode media query change
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', checkStandalone);

    // Capture the install prompt event
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      // Store the event in the Zustand store for user-triggered installation
      setDeferredPrompt(event as any);
    };

    // Listen for successful installation
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Register service worker
    if ('serviceWorker' in navigator) {
      const register = () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {
          // PWA support is progressive; the app remains fully usable without a service worker.
        });
      };

      if (document.readyState === 'complete') {
        register();
      } else {
        window.addEventListener('load', register, { once: true });
      }
    }

    return () => {
      mediaQuery.removeEventListener('change', checkStandalone);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [setDeferredPrompt, setIsInstalled]);

  return null;
}
