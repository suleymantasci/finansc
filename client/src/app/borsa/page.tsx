import { Suspense } from 'react';
import type { Metadata } from 'next';
import { BorsaClient } from './BorsaClient';
import { SectionIntro } from '@/components/shared/SectionIntro';

export const metadata: Metadata = {
  title: 'Borsa İstanbul',
  description: 'Borsa İstanbul canlı endeks ve hisse verileri. XU100, XU030 endeksleri ve en çok yükselen/düşen hisseler.',
  keywords: ['borsa istanbul', 'bist', 'hisse senedi', 'xu100', 'canlı borsa'],
  alternates: { canonical: 'https://finanscozum.net/borsa' },
};

export default function BorsaPage() {
  return (
    <>
      {/* Server-rendered H1 — Pit 11 fix (client island içinde olsaydı H1 boş kalırdı) */}
      <div className="mx-auto max-w-7xl px-4 pt-6 lg:px-8">
        <SectionIntro
          as="page"
          title="Borsa İstanbul"
          description="Borsa İstanbul canlı endeks ve hisse verileri. XU100, XU030 ve diğer BIST endeksleri, yükselen/düşen hisseler, hacim sıralaması."
        />
      </div>
      <Suspense>
        <BorsaClient />
      </Suspense>
    </>
  );
}
