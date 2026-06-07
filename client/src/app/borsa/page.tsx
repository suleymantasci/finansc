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
    // H1/description BorsaClient içindeki SectionIntro (as="page") tarafından render ediliyor (Pit 11 fix).
    <Suspense>
      <BorsaClient />
    </Suspense>
  );
}
