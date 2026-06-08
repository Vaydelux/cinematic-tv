'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getAllServers, getEnabledServers } from '@/lib/servers';
import { getUserSettings, saveUserSettings } from '@/lib/user-settings';

type Props = {
  open: boolean;
  onComplete: () => void;
};

export function OnboardingModal({ open, onComplete }: Props) {
  const servers = getEnabledServers().length ? getEnabledServers() : getAllServers().slice(0, 8);
  const [defaultServerId, setDefaultServerId] = useState(getUserSettings().defaultServerId);
  const [contentSource, setContentSource] = useState(getUserSettings().contentSource);

  const handleFinish = () => {
    saveUserSettings({
      defaultServerId: servers.some((s) => s.id === defaultServerId)
        ? defaultServerId
        : servers[0]?.id ?? 'vidfast',
      contentSource,
      onboardingComplete: true,
    });
    onComplete();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            className="w-full max-w-md cinema-panel cinema-ring rounded-lg p-6"
          >
            <h2 className="text-2xl font-bold text-on-surface mb-2">Welcome to Cinematic TV</h2>
            <p className="text-sm text-on-surface-variant mb-6">Pick your defaults to get started.</p>

            <p className="text-sm font-medium text-on-surface mb-2">Default embed server</p>
            <div className="flex flex-wrap gap-2 mb-6 max-h-28 overflow-y-auto hide-scrollbar">
              {servers.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setDefaultServerId(s.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold ${
                    defaultServerId === s.id ? 'bg-primary text-white' : 'bg-white/[0.06] text-on-surface-variant'
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>

            <p className="text-sm font-medium text-on-surface mb-2">Content source</p>
            <div className="flex gap-2 mb-6">
              {(['all', 'tmdb', 'anilist'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setContentSource(s)}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    contentSource === s ? 'bg-primary text-white' : 'bg-white/[0.06] text-on-surface-variant'
                  }`}
                >
                  {s === 'all' ? 'All' : s === 'tmdb' ? 'Movies & TV' : 'Anime'}
                </button>
              ))}
            </div>

            <button
              onClick={handleFinish}
              className="w-full py-3 rounded-md bg-primary text-white font-bold hover:bg-primary/90"
            >
              Get started
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
