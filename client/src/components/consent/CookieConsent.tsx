'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { OPEN_CONSENT_EVENT, readConsent, writeConsent } from '@/lib/consent';

/**
 * Çerez onay çubuğu. "Kabul et" ve "Reddet" eşit ağırlıkta (reddetmek kabul etmek kadar kolay);
 * seçim yapılana kadar analitik çerez yüklenmez. Mobilde alt gezinme çubuğunun üstünde durur.
 */
export function CookieConsent() {
  // Çubuk sunucu HTML'inde baştan çizilir (ilk ziyarette mobil LCP öğesi buydu; JS sonrası
  // belirince LCP ~5 sn'ye çıkıyordu). Onay verilmişse <html data-consent> (layout'taki satır içi
  // betik, ilk çizimden önce) ve CSS çubuğu gizler; yüklemeden sonra React de kaldırır.
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (readConsent() !== null) setOpen(false);
    const onOpen = () => {
      document.documentElement.removeAttribute('data-consent');
      setOpen(true);
    };
    window.addEventListener(OPEN_CONSENT_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, onOpen);
  }, []);

  if (!open) return null;

  const choose = (v: 'granted' | 'denied') => {
    writeConsent(v);
    document.documentElement.setAttribute('data-consent', '1');
    setOpen(false);
  };

  return (
    <div
      id="fc-consent"
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-title"
      className="fixed inset-x-3 bottom-[4.75rem] z-50 mx-auto max-w-3xl rounded-2xl border border-border bg-elevated p-4 shadow-2xl sm:inset-x-4 md:bottom-4 md:p-5"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-6">
        <div className="min-w-0 flex-1 text-[13px] leading-relaxed text-muted-foreground">
          <p id="cookie-title" className="mb-1 text-sm font-medium text-foreground">Çerez tercihiniz</p>
          Sitenin çalışması için zorunlu çerezler her zaman kullanılır. Ziyaret istatistikleri için Google Analytics
          çerezlerini yalnızca onay verirseniz kullanırız. Tercihinizi istediğiniz zaman alt bilgideki “Çerez
          tercihleri” bağlantısından değiştirebilirsiniz.{' '}
          <Link href="/cerez-politikasi" className="text-primary underline-offset-2 hover:underline">
            Çerez Politikası
          </Link>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => choose('denied')}
            className="h-10 flex-1 rounded-full border border-border px-5 text-sm font-medium text-foreground transition-colors hover:border-primary/60 md:flex-none"
          >
            Reddet
          </button>
          <button
            type="button"
            onClick={() => choose('granted')}
            className="h-10 flex-1 rounded-full border border-border px-5 text-sm font-medium text-foreground transition-colors hover:border-primary/60 md:flex-none"
          >
            Kabul et
          </button>
        </div>
      </div>
    </div>
  );
}
