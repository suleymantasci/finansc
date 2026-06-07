import { Suspense } from 'react';
import type { Metadata } from 'next';
import { BlogListClient } from './BlogListClient';
import { SectionIntro } from '@/components/shared/SectionIntro';

export const metadata: Metadata = {
  title: 'Bilgi Merkezi',
  description: 'Piyasa analizleri, finansal rehberler ve güncel yorumlar. Finans dünyasındaki gelişmeleri yakından takip edin.',
  keywords: ['finans bilgi merkezi', 'piyasa analizi', 'yatırım rehberi', 'borsa haberleri'],
  alternates: { canonical: 'https://finanscozum.net/blog' },
};

export default function BlogPage() {
  return (
    <>
      {/* Server-rendered H1 — Pit 11 fix (client island içinde olsaydı H1 boş kalırdı) */}
      <div className="mx-auto max-w-7xl px-4 pt-6 lg:px-8">
        <SectionIntro
          as="page"
          title="Finans Bilgi Merkezi"
          description="Piyasa analizleri, finansal rehberler ve güncel yorumlar. Borsa, altın, döviz, kredi ve yatırım konularında editör ekibimizin hazırladığı içerikler."
        />
      </div>
      <Suspense>
        <BlogListClient />
      </Suspense>
    </>
  );
}
