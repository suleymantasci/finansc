'use client';

import { useEffect, useRef } from 'react';
import { useAdStore } from '@/stores/ad.store';

interface AdSlotProps {
  page: string;
  position: string;
  slotIndex?: number;
  className?: string;
}

function AdSlot({ page, position, slotIndex = 1, className }: AdSlotProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const { getSlot } = useAdStore();

  const slot = getSlot(page, position, slotIndex);

  useEffect(() => {
    if (!slot?.isActive || !slot.adsenseUnit || !adRef.current) return;

    try {
      const adElement = document.createElement('ins');
      adElement.className = 'adsbygoogle';
      adElement.style.display = 'block';
      adElement.setAttribute('data-ad-client', process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || '');
      adElement.setAttribute('data-ad-slot', slot.adsenseUnit);
      adElement.setAttribute('data-ad-format', 'auto');
      adElement.setAttribute('data-full-width-responsive', 'true');

      adRef.current.innerHTML = '';
      adRef.current.appendChild(adElement);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch {
      // AdSense not loaded or blocked
    }
  }, [slot]);

  // Don't render anything if slot is not active
  if (!slot?.isActive || !slot.adsenseUnit) return null;

  return <div ref={adRef} className={className} />;
}

export { AdSlot };
export type { AdSlotProps };
