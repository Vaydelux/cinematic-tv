'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowDown, ArrowUp, Eye, EyeOff, Search, X } from 'lucide-react';
import {
  getAllServers,
  isServerVisible,
  persistHiddenServers,
  persistServerOrder,
} from '@/lib/servers';
import { getServerSuccessRate } from '@/lib/server-health';
import { getUserSettings, saveUserSettings } from '@/lib/user-settings';
import type { AppSettings } from '@/lib/types';
import type { EmbedServer } from '@/lib/servers';

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: (settings: AppSettings) => void;
};

function sortServersByOrder(servers: EmbedServer[], order: string[]): EmbedServer[] {
  const idx = new Map(order.map((id, i) => [id, i]));
  return [...servers].sort((a, b) => {
    const ai = idx.get(a.id) ?? 9999;
    const bi = idx.get(b.id) ?? 9999;
    return ai - bi;
  });
}

export function ServerManagerModal({ open, onClose, onSaved }: Props) {
  const allServers = useMemo(() => getAllServers(), []);
  const [query, setQuery] = useState('');
  const [hiddenIds, setHiddenIds] = useState<string[]>(() => getUserSettings().hiddenServerIds ?? []);
  const [order, setOrder] = useState<string[]>(() => {
    const saved = getUserSettings().serverOrder ?? [];
    const ids = allServers.map((s) => s.id);
    return [...saved.filter((id) => ids.includes(id)), ...ids.filter((id) => !saved.includes(id))];
  });

  const orderedServers = useMemo(() => sortServersByOrder(allServers, order), [allServers, order]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orderedServers;
    return orderedServers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.domains.some((d) => d.toLowerCase().includes(q))
    );
  }, [orderedServers, query]);

  const visibleCount = allServers.filter((s) => isServerVisible(s.id, hiddenIds)).length;

  const toggle = (id: string) => {
    const visible = isServerVisible(id, hiddenIds);
    if (visible && visibleCount <= 1) return;
    setHiddenIds((prev) => {
      const next = new Set(prev);
      if (visible) next.add(id);
      else next.delete(id);
      return [...next];
    });
  };

  const showAll = () => setHiddenIds([]);

  const showDefaultOnly = () => {
    const preferred = getUserSettings().defaultServerId;
    const fallback = allServers[0]?.id;
    const keep = allServers.some((s) => s.id === preferred) ? preferred : fallback;
    setHiddenIds(allServers.filter((s) => s.id !== keep).map((s) => s.id));
  };

  const move = (id: string, direction: -1 | 1) => {
    setOrder((prev) => {
      const next = [...prev];
      const from = next.indexOf(id);
      const to = from + direction;
      if (from < 0 || to < 0 || to >= next.length) return prev;
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  const handleSave = () => {
    if (visibleCount === 0) return;
    persistHiddenServers(hiddenIds);
    persistServerOrder(order);
    const next = saveUserSettings({ hiddenServerIds: hiddenIds, serverOrder: order });
    onSaved(next);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 p-2 backdrop-blur-sm sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg cinema-panel cinema-ring sm:max-h-[85vh]"
          >
            <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-4 shrink-0 sm:px-6">
              <div>
                <h2 className="text-xl font-bold text-on-surface">Manage Embed Servers</h2>
                <p className="text-sm text-on-surface-variant mt-0.5">
                  {visibleCount} of {allServers.length} visible. Top servers are tried first.
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-md hover:bg-white/10 text-on-surface-variant"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="border-b border-white/10 px-4 py-3 shrink-0 sm:px-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search servers..."
                  className="w-full rounded-md border border-white/10 bg-surface py-2.5 pl-10 pr-4 text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={showAll}
                  className="px-3 py-1.5 text-xs font-medium rounded-md bg-white/[0.06] hover:bg-white/10"
                >
                  Show all
                </button>
                <button
                  onClick={showDefaultOnly}
                  className="px-3 py-1.5 text-xs font-medium rounded-md bg-white/[0.06] hover:bg-white/10"
                >
                  Default only
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4 hide-scrollbar sm:px-6">
              {filtered.map((server) => {
                const visible = isServerVisible(server.id, hiddenIds);
                const rate = getServerSuccessRate(server.id);
                const index = order.indexOf(server.id);
                return (
                  <div
                    key={server.id}
                    className={`flex items-center gap-2 rounded-lg border p-2.5 transition sm:p-3 ${
                      visible
                        ? 'border-primary/40 bg-primary/10'
                        : 'border-white/10 bg-white/[0.04] opacity-60'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => move(server.id, -1)}
                      disabled={index <= 0}
                      className="shrink-0 rounded-md p-1.5 text-on-surface-variant hover:bg-white/10 hover:text-on-surface disabled:opacity-30"
                      aria-label={`Move ${server.name} up`}
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(server.id, 1)}
                      disabled={index === order.length - 1}
                      className="shrink-0 rounded-md p-1.5 text-on-surface-variant hover:bg-white/10 hover:text-on-surface disabled:opacity-30"
                      aria-label={`Move ${server.name} down`}
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggle(server.id)}
                      className="flex items-center gap-3 flex-1 min-w-0 text-left"
                    >
                      <span
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${
                          visible ? 'border-primary bg-primary' : 'border-surface-variant'
                        }`}
                      >
                        {visible ? <Eye className="w-3 h-3 text-white" /> : <EyeOff className="w-3 h-3 text-on-surface-variant" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium text-on-surface truncate">{server.name}</span>
                        <span className="block text-xs text-on-surface-variant truncate">
                          {server.domains[0]}
                          {server.animeTemplate ? ' + anime' : ''}
                        </span>
                      </span>
                      {rate != null && (
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-md shrink-0 ${
                            rate >= 70
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : rate >= 40
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-red-500/20 text-red-300'
                          }`}
                        >
                          {rate}%
                        </span>
                      )}
                    </button>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <p className="text-center text-on-surface-variant py-8 text-sm">No servers match your search.</p>
              )}
            </div>

            <div className="flex gap-3 border-t border-white/10 px-4 py-4 shrink-0 sm:px-6">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-md font-medium bg-white/[0.06] hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={visibleCount === 0}
                className="flex-1 py-3 rounded-md font-bold bg-primary text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
