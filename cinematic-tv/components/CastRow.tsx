import Image from 'next/image';
import type { CastMember } from '@/lib/types';

export function CastRow({ cast }: { cast: CastMember[] }) {
  if (!cast.length) return null;
  return (
    <section className="mb-8">
      <h3 className="text-xl font-display font-bold mb-4">Cast</h3>
      <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
        {cast.map((member) => (
          <div key={member.id} className="flex flex-col items-center shrink-0 w-24">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-surface-container mb-2 relative">
              {member.profileUrl ? (
                <Image src={member.profileUrl} alt={member.name} fill sizes="80px" className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-on-surface-variant">
                  N/A
                </div>
              )}
            </div>
            <p className="text-xs font-bold text-center truncate w-full">{member.name}</p>
            <p className="text-[10px] text-on-surface-variant text-center truncate w-full">
              {member.character}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
