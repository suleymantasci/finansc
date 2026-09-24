'use client';

import { openConsent } from '@/lib/consent';

/** Alt bilgide: çerez onay çubuğunu yeniden açar (rıza her an geri alınabilmeli) */
export function CookiePrefsButton({ className }: { className?: string }) {
  return (
    <button type="button" onClick={openConsent} className={className}>
      Çerez tercihleri
    </button>
  );
}
