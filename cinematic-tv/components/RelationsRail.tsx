import Image from 'next/image';
import type { RelationItem } from '@/lib/types';

export function RelationsRail({ relations }: { relations: RelationItem[] }) {
  if (!relations.length) return null;
  return (
    <section className="mb-8">
      <h3 className="text-xl font-display font-bold mb-4">Related</h3>
      <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
        {relations.map((rel) => (
          <div key={rel.id} className="shrink-0 w-32">
            <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-surface-container mb-2">
              {rel.image ? (
                <Image src={rel.image} alt={rel.title} fill className="object-cover" />
              ) : (
                <div className="w-full h-full bg-surface-variant" />
              )}
            </div>
            <p className="text-xs font-bold truncate">{rel.title}</p>
            <p className="text-[10px] text-on-surface-variant">{rel.relationType}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
