import { Suspense } from 'react';
import type { Metadata } from 'next';
import { AltinClient } from './AltinClient';

export const metadata: Metadata = {
  title: 'Altın Fiyatları',
  description: "Türkiye'deki tüm altın fiyatlarını anlık olarak karşılaştırın. Gram, çeyrek, yarım, tam altın ve bilezik fiyatları canlı olarak güncellenir.",
  keywords: ['altın fiyatları', 'gram altın', 'çeyrek altın', 'canlı altın', 'altın fiyatları bugün'],
  alternates: { canonical: 'https://finanscozum.net/altin' },
};

export default function AltinPage() {
  return (
    <>
      {/* Server-rendered H1 + SEO özet (Pit 11 fix — Google server HTML'inde H1 görmeli).
          Suspense dışında tutuldu → Next.js BAILOUT_TO_CLIENT_SIDE_RENDERING tetiklemiyor. */}
      <section className="mx-auto max-w-7xl px-4 pt-6 lg:px-8">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
          Altın Fiyatları — Canlı ve Güncel
        </h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-3xl">
          Gram, çeyrek, yarım, tam, cumhuriyet, ata, ons altın ve gümüş fiyatlarını serbest piyasa ve
          Merkez Bankası kaynaklarından anlık takip edin. Her altın türü için detaylı sayfa,
          günlük değişim ve piyasa analizi.
        </p>
      </section>
      <Suspense>
        <AltinClient />
      </Suspense>
    </>
  );
}
