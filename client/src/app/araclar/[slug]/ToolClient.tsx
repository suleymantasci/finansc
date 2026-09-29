'use client';

import { useEffect, useState } from 'react';
import { markToolHydrated } from './_tools/_shared/hydration';

import { AdBanner } from '@/components/ads/AdBanner';
import { ReportErrorButton } from '@/components/shared/ReportErrorButton';
import { SPEC_MODULE_OF } from '@/lib/tools/specs/modules';
import { GROUP_COMPONENTS } from './_generic/groups';

import { MaasHesaplama } from './_tools/MaasHesaplama';

interface Props {
  slug: string;
  title: string;
  /** Sunucudaki bugünün tarihi (Europe/Istanbul) — tarih alanlı araçların varsayılanı */
  today: string;
  /** Server-rendered H1 + citable snippet zaten sayfada — client H1'i gizle */
  hideTitle?: boolean;
}

// Tek elle yazılmış araç; diğerleri bildirimsel motorla (lib/tools/specs) çizilir.
const TOOL_MAP: Record<string, React.FC> = {
  'maas-hesaplama': MaasHesaplama,
};

export function ToolClient({ slug, title, today, hideTitle = false }: Props) {
  const ToolComponent = TOOL_MAP[slug];
  const specModule = SPEC_MODULE_OF[slug];
  const GenericGroup = specModule ? GROUP_COMPONENTS[specModule] : null;

  // Araçlar başlangıç değerlerini URL'den (?amount=…) render sırasında okuyor. Sayfa sunucuda
  // parametresiz üretildiği için hydration sunucudaki varsayılanları koruyor, URL'deki değerler
  // ve otomatik hesaplama görünmüyordu (paylaşılan linkler, ana sayfa kartları). URL'de parametre
  // varsa araç yüklendikten sonra bir kez yeniden kurulur; bu kurulum tamamen istemcide olduğu için
  // URL'yi doğru okur. Sunucu HTML'i (SEO) değişmez.
  // Sayfa içi geçişte (ana sayfa kartları) Next adres çubuğunu bu effect'ten SONRA güncelliyor;
  // kontrol bir sonraki görev döngüsüne ertelenir. (useSearchParams statik sayfada aracı sunucu
  // HTML'inden çıkarırdı; kullanılmıyor.)
  const [mountKey, setMountKey] = useState('ssr');
  useEffect(() => {
    const t = setTimeout(() => {
      markToolHydrated();
      if (window.location.search.length > 1) setMountKey(`url:${window.location.search}`);
    }, 0);
    return () => clearTimeout(t);
  }, []);

  // Geniş tablo içeren araçlar ve iki sütunlu (form + sonuç) bildirimsel araçlar geniş
  const isWide = slug === 'maas-hesaplama';
  const maxW = isWide ? 'max-w-[1440px]' : GenericGroup ? 'max-w-6xl' : 'max-w-3xl';

  return (
    <div className={`mx-auto ${maxW} px-4 py-6 lg:px-8 pb-24 md:pb-12`}>
      {/* page.tsx'te H1 üstünde breadcrumb var. Bu render'de tekrar etmiyoruz. */}
      {hideTitle ? (
        // Server-rendered H1 page.tsx'te (Pit 11b). Burada görsel başlık yok.
        <h2 className="sr-only">{title}</h2>
      ) : (
        <h1 className="font-display text-balance text-4xl text-foreground sm:text-5xl">{title}</h1>
      )}

      <AdBanner page={`araclar-${slug}`} position="top" />

      <div className="mt-6">
        {GenericGroup ? (
          <GenericGroup key={mountKey} slug={slug} title={title.split('|')[0].trim()} today={today} />
        ) : ToolComponent ? (
          <ToolComponent key={mountKey} />
        ) : (
          <p className="text-muted-foreground">Bu araç henüz aktif değil.</p>
        )}
      </div>


      <div className="mt-8 flex justify-end">
        <ReportErrorButton type="tool" slug={slug} pageTitle={title} />
      </div>
    </div>
  );
}
