import { Suspense } from 'react';
import type { Metadata } from 'next';
import { DovizClient } from './DovizClient';

export const metadata: Metadata = {
  title: 'Döviz Kurları',
  description: 'Anlık döviz kurlarını takip edin. Serbest piyasa ve Merkez Bankası kurları canlı olarak güncellenir.',
  keywords: ['döviz kurları', 'dolar kuru', 'euro kuru', 'serbest piyasa', 'merkez bankası', 'canlı döviz'],
  alternates: { canonical: 'https://finanscozum.net/doviz' },
};

export default function DovizPage() {
  return (
    <>
      {/* Server-rendered H1 (Pit 11 fix). Suspense dışında → BAILOUT engellendi. */}
      <section className="mx-auto max-w-7xl px-4 pt-6 lg:px-8">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
          Döviz Kurları — Anlık Serbest Piyasa ve Merkez Bankası
        </h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-3xl">
          Dolar, euro, sterlin, İsviçre frangı, Japon yeni, Çin yuanı ve Rus rublesi başta olmak
          üzere tüm majör döviz kurlarını canlı takip edin. Her parite için detaylı grafik ve
          Merkez Bankası kuru karşılaştırması.
        </p>
      </section>
      <Suspense>
        <DovizClient />
      </Suspense>
    </>
  );
}
