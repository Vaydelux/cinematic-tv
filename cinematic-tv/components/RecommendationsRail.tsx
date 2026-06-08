'use client';

import { ContentRail } from './ContentRail';
import type { MediaItem } from '@/lib/types';

export function RecommendationsRail({ items, title = 'More Like This' }: { items: MediaItem[]; title?: string }) {
  return <ContentRail title={title} items={items} prefix="rec-" embedded />;
}
