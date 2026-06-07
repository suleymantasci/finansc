import { Suspense } from 'react';
import type { Metadata } from 'next';
import { BlogListClient } from './BlogListClient';

export const metadata: Metadata = {
  title: 'Bilgi Merkezi',
  description: 'Piyasa analizleri, finansal rehberler ve güncel yorumlar. Finans dünyasındaki gelişmeleri yakından takip edin.',
  keywords: ['finans bilgi merkezi', 'piyasa analizi', 'yatırım rehberi', 'borsa haberleri'],
  alternates: { canonical: 'https://finanscozum.net/blog' },
};

export default function BlogPage() {
  return (
    <>
      {/* Server-rendered H1 (Pit 11 fix). Suspense dışında → BAILOUT engellendi. */}
      <section className="mx-auto max-w-7xl px-4 pt-6 lg:px-8">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
          Finans Bilgi Merkezi — Piyasa Analizleri ve Rehberler
        </h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-3xl">
          Borsa, altın, döviz, kredi ve yatırım konularında editör ekibimizin hazırladığı güncel
          analizler, rehberler ve haberler. Yatırım kararlarınızı bilgiyle destekleyin.
        </p>
      </section>
      <Suspense>
        <BlogListClient />
      </Suspense>
    </>
  );
}
