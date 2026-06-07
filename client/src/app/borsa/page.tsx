import { Suspense } from 'react';
import type { Metadata } from 'next';
import { BorsaClient } from './BorsaClient';

export const metadata: Metadata = {
  title: 'Borsa İstanbul',
  description: 'Borsa İstanbul canlı endeks ve hisse verileri. XU100, XU030 endeksleri ve en çok yükselen/düşen hisseler.',
  keywords: ['borsa istanbul', 'bist', 'hisse senedi', 'xu100', 'canlı borsa'],
  alternates: { canonical: 'https://finanscozum.net/borsa' },
};

export default function BorsaPage() {
  return (
    <>
      {/* Server-rendered H1 (Pit 11 fix). Suspense dışında → BAILOUT engellendi. */}
      <section className="mx-auto max-w-7xl px-4 pt-6 lg:px-8">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
          Borsa İstanbul — Canlı Hisse ve Endeks Verileri
        </h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-3xl">
          XU100, XU030 ve diğer BIST endekslerini, yükselen/düşen hisseleri, hacim sıralamasını
          anlık olarak takip edin. Her hisse ve endeks için detaylı fiyat, grafik ve analiz sayfası.
        </p>
      </section>
      <Suspense>
        <BorsaClient />
      </Suspense>
    </>
  );
}
