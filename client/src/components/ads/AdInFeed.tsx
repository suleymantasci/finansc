'use client';

import { AdSlot } from './AdSlot';
import { useAdStore } from '@/stores/ad.store';
import { cn } from '@/lib/utils';

interface AdInFeedProps {
  page: string;
  slotIndex?: number;
  className?: string;
}

function AdInFeed({ page, slotIndex = 1, className }: AdInFeedProps) {
  const { getSlot } = useAdStore();
  const slot = getSlot(page, 'infeed', slotIndex);

  // Don't render anything (including wrapper) if no active ad
  if (!slot?.isActive || !slot.adsenseUnit) return null;

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
