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
    // H1/description AltinClient içindeki SectionIntro (as="page") tarafından render ediliyor (Pit 11 fix).
    <Suspense>
      <AltinClient />
    </Suspense>
  );
}
