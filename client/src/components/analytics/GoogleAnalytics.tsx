'use client';

import { useEffect } from 'react';
import { CONSENT_EVENT, readConsent, type Consent } from '@/lib/consent';

/**
 * Google Analytics yalnızca kullanıcı analitik çerezlere onay verdiyse yüklenir
 * (KVKK Çerez Rehberi — analitik çerezler açık rızaya tabidir). Onay geri çekilirse
 * ölçüm durdurulur ve _ga çerezleri silinir.
 */
export function Analytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  useEffect(() => {
    if (!gaId) return;
    const w = window as unknown as { dataLayer: unknown[]; gtag?: (...a: unknown[]) => void; [k: string]: unknown };

    function load() {
      w[`ga-disable-${gaId}`] = false;
      if (document.getElementById('ga-script')) return;
      w.dataLayer = w.dataLayer || [];
      w.gtag = function gtag() {
        // eslint-disable-next-line prefer-rest-params
        w.dataLayer.push(arguments);
      };
      w.gtag('js', new Date());
      w.gtag('config', gaId, { page_path: window.location.pathname });
      const s = document.createElement('script');
      s.id = 'ga-script';
      s.async = true;
      s.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      document.head.appendChild(s);
    }

    function revoke() {
      w[`ga-disable-${gaId}`] = true;
      const host = window.location.hostname.replace(/^www\./, '');
      for (const c of document.cookie.split(';')) {
        const name = c.split('=')[0].trim();
        if (name === '_ga' || name.startsWith('_ga_') || name === '_gid') {
          for (const d of ['', `; domain=.${host}`, `; domain=${host}`]) {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${d}`;
          }
        }
      }
    }

    const apply = (c: Consent | null) => (c === 'granted' ? load() : revoke());
    apply(readConsent());
    const onChange = (e: Event) => apply((e as CustomEvent<Consent>).detail);
    window.addEventListener(CONSENT_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_EVENT, onChange);
  }, [gaId]);

  return null;
}
