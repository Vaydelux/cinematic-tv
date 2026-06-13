'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { RelationItem } from '@/lib/types';

export function RelationsRail({ relations }: { relations: RelationItem[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateArrows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
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
  }, [relations.length, updateArrows]);

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -260 : 260, behavior: 'smooth' });
  };

  if (!relations.length) return null;
  return (
    <section className="mb-8">
      <h3 className="text-xl font-display font-bold mb-4">Related</h3>
      <div className="relative">
        <button
          type="button"
          onClick={() => scroll('left')}
          aria-label="Scroll related left"
          className={`absolute bottom-4 left-0 top-0 z-10 flex w-10 items-center justify-center bg-gradient-to-r from-surface via-surface/80 to-transparent transition ${canLeft ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/75 text-white shadow-lg">
            <ChevronLeft className="h-4 w-4" />
          </span>
        </button>
        <button
          type="button"
          onClick={() => scroll('right')}
          aria-label="Scroll related right"
          className={`absolute bottom-4 right-0 top-0 z-10 flex w-10 items-center justify-center bg-gradient-to-l from-surface via-surface/80 to-transparent transition ${canRight ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/75 text-white shadow-lg">
            <ChevronRight className="h-4 w-4" />
          </span>
        </button>
        <div ref={scrollRef} className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-4 hide-scrollbar sm:gap-4">
          {relations.map((rel) => (
            <div key={rel.id} className="w-32 shrink-0 snap-start overflow-hidden rounded-lg bg-surface-container ring-1 ring-white/10 sm:w-36">
              <div className="relative aspect-[2/3] bg-black">
                {rel.image ? (
                  <>
                    <Image src={rel.image} alt="" fill aria-hidden sizes="144px" className="scale-110 object-cover opacity-35 blur-md" />
                    <Image src={rel.image} alt={rel.title} fill sizes="144px" className="object-contain" />
                  </>
                ) : (
                  <div className="w-full h-full bg-surface-variant" />
                )}
              </div>
              <div className="border-t border-white/10 p-2">
                <p className="line-clamp-2 min-h-[2rem] text-xs font-bold leading-tight">{rel.title}</p>
                <p className="mt-1 truncate text-[10px] text-on-surface-variant">{rel.relationType}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
