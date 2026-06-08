'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getServerSuccessRate } from '@/lib/server-health';
import type { EmbedServer } from '@/lib/servers';

type Props = {
  servers: EmbedServer[];
  activeId: string | null;
  onSelect: (id: string) => void;
};

export function ServerPickerBar({ servers, activeId, onSelect }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateArrows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanLeft(scrollLeft > 4);
    setCanRight(scrollLeft < scrollWidth - clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener('scroll', updateArrows, { passive: true });
    const ro = new ResizeObserver(updateArrows);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', updateArrows);
      ro.disconnect();
    };
  }, [servers.length, updateArrows]);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [activeId]);

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -el.clientWidth * 0.6 : el.clientWidth * 0.6, behavior: 'smooth' });
  };

  if (!servers.length) return null;

  return (
    <div className="relative min-w-0 border-t border-white/5 bg-black/50 group/picker">
      <p className="px-4 pt-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-white/40">
        Source
      </p>

      {canLeft && (
        <div className="pointer-events-none absolute left-0 top-6 bottom-1 w-10 z-10 bg-gradient-to-r from-black/90 to-transparent" />
      )}
      {canRight && (
        <div className="pointer-events-none absolute right-0 top-6 bottom-1 w-10 z-10 bg-gradient-to-l from-black/90 to-transparent" />
      )}

      {canLeft && (
        <button
          type="button"
          onClick={() => scroll('left')}
          aria-label="Scroll sources left"
          className="absolute left-1 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center md:opacity-0 md:group-hover/picker:opacity-100 transition-opacity"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}

      {canRight && (
        <button
          type="button"
          onClick={() => scroll('right')}
          aria-label="Scroll sources right"
          className="absolute right-1 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center md:opacity-0 md:group-hover/picker:opacity-100 transition-opacity"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto hide-scrollbar scroll-smooth px-4 pb-3 min-w-0"
      >
        {servers.map((s) => {
          const active = activeId === s.id;
          const rate = getServerSuccessRate(s.id);
          return (
            <button
              key={s.id}
              ref={active ? activeRef : undefined}
              type="button"
              onClick={() => onSelect(s.id)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
                active
                  ? 'bg-primary text-white shadow-lg shadow-primary/30'
                  : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
              }`}
            >
              {s.name}
              {rate != null && !active && (
                <span className="text-[10px] font-medium opacity-60">{rate}%</span>
              )}
            </button>
          );
        })}
        <div className="shrink-0 w-2" aria-hidden />
      </div>
    </div>
  );
}
