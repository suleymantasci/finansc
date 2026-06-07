import { Suspense } from 'react';
import type { Metadata } from 'next';
import { DovizClient } from './DovizClient';
import { SectionIntro } from '@/components/shared/SectionIntro';

export const metadata: Metadata = {
  title: 'Döviz Kurları',
  description: 'Anlık döviz kurlarını takip edin. Serbest piyasa ve Merkez Bankası kurları canlı olarak güncellenir.',
  keywords: ['döviz kurları', 'dolar kuru', 'euro kuru', 'serbest piyasa', 'merkez bankası', 'canlı döviz'],
  alternates: { canonical: 'https://finanscozum.net/doviz' },
};

export default function DovizPage() {
  return (
    <>
      {/* Server-rendered H1 — Pit 11 fix (client island içinde olsaydı H1 boş kalırdı) */}
      <div className="mx-auto max-w-7xl px-4 pt-6 lg:px-8">
        <SectionIntro
          as="page"
          title="Döviz Kurları"
          description="Anlık döviz kurlarını canlı takip edin. Serbest piyasa ve Merkez Bankası kurları; dolar, euro, sterlin, İsviçre frangı başta olmak üzere tüm majör pariteler."
        />
      </div>
      <Suspense>
        <DovizClient />
      </Suspense>
    </>
  );
}
