'use client';

import { AdSlot } from './AdSlot';
import { cn } from '@/lib/utils';

interface AdInFeedProps {
  page: string;
  slotIndex?: number;
  className?: string;
}

function AdInFeed({ page, slotIndex = 1, className }: AdInFeedProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-4',
        className,
      )}
    >
      <AdSlot page={page} position="infeed" slotIndex={slotIndex} />
    </div>
  );
}

export { AdInFeed };
export type { AdInFeedProps };
