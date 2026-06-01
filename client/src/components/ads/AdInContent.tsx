'use client';

import { AdSlot } from './AdSlot';
import { cn } from '@/lib/utils';

interface AdInContentProps {
  page: string;
  slotIndex?: number;
  className?: string;
}

function AdInContent({ page, slotIndex = 1, className }: AdInContentProps) {
  return (
    <div className={cn('my-6', className)}>
      <AdSlot page={page} position="middle" slotIndex={slotIndex} />
    </div>
  );
}

export { AdInContent };
export type { AdInContentProps };
