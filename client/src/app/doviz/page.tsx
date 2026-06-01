import { Suspense } from 'react';
import type { Metadata } from 'next';
import { DovizClient } from './DovizClient';

export const metadata: Metadata = {
  title: 'Döviz Kurları',
  description: 'Anlık döviz kurlarını takip edin. Serbest piyasa ve Merkez Bankası kurları canlı olarak güncellenir.',
  keywords: ['döviz kurları', 'dolar kuru', 'euro kuru', 'serbest piyasa', 'merkez bankası', 'canlı döviz'],
};

export default function DovizPage() {
  return (
    <Suspense>
      <DovizClient />
    </Suspense>
  );
}
