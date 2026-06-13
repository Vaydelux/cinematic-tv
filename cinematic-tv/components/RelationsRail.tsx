'use client';

import Image from 'next/image';
import type { RelationItem } from '@/lib/types';

export function RelationsRail({ relations }: { relations: RelationItem[] }) {
  if (!relations.length) return null;
  return (
    <section className="mb-8">
      <h3 className="text-xl font-display font-bold mb-4">Related</h3>
      <div className="grid grid-cols-2 gap-3 min-[460px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5">
        {relations.map((rel) => (
          <div key={rel.id} className="min-w-0 overflow-hidden rounded-lg bg-surface-container ring-1 ring-white/10">
            <div className="relative aspect-[2/3] overflow-hidden bg-black">
              {rel.image ? (
                <>
                  <Image
                    src={rel.image}
                    alt=""
                    fill
                    aria-hidden
                    sizes="(max-width: 640px) 50vw, 160px"
                    className="scale-105 object-cover opacity-25 blur-sm"
                  />
                  <Image
                    src={rel.image}
                    alt={rel.title}
                    fill
                    sizes="(max-width: 640px) 50vw, 160px"
                    className="object-contain"
                  />
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
    </section>
  );
}
