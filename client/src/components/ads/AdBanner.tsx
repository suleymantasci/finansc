'use client';

import { AdSlot } from './AdSlot';
import { cn } from '@/lib/utils';

interface AdBannerProps {
  page: string;
  position?: string;
  slotIndex?: number;
  className?: string;
}

function AdBanner({ page, position = 'top', slotIndex = 1, className }: AdBannerProps) {
  return (
    <div className={cn('my-4 w-full', className)}>
      <AdSlot page={page} position={position} slotIndex={slotIndex} />
    </div>
  );
}

export { AdBanner };
export type { AdBannerProps };
