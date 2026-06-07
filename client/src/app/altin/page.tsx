import { Suspense } from 'react';
import type { Metadata } from 'next';
import { AltinClient } from './AltinClient';
import { SectionIntro } from '@/components/shared/SectionIntro';

export const metadata: Metadata = {
  title: 'Altın Fiyatları',
  description: "Türkiye'deki tüm altın fiyatlarını anlık olarak karşılaştırın. Gram, çeyrek, yarım, tam altın ve bilezik fiyatları canlı olarak güncellenir.",
  keywords: ['altın fiyatları', 'gram altın', 'çeyrek altın', 'canlı altın', 'altın fiyatları bugün'],
  alternates: { canonical: 'https://finanscozum.net/altin' },
};

export default function AltinPage() {
  return (
    <>
      {/* Server-rendered H1 — Pit 11 fix (client island içinde olsaydı H1 boş kalırdı) */}
      <div className="mx-auto max-w-7xl px-4 pt-6 lg:px-8">
        <SectionIntro
          as="page"
          title="Altın Fiyatları"
          description="Türkiye'deki tüm altın fiyatlarını anlık olarak karşılaştırın. Gram, çeyrek, yarım, tam, cumhuriyet, ata, ons altın ve gümüş için canlı fiyat, günlük değişim ve detaylı sayfa."
        />
      </div>
      <Suspense>
        <AltinClient />
      </Suspense>
    </>
  );
}
