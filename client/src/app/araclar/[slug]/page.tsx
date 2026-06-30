import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SITE_NAME, SITE_URL } from '@/lib/constants';
import { TOOL_META } from '@/lib/seo-data/tools';
import { Breadcrumb } from '@/components/shared/Breadcrumb';
import { ToolClient } from './ToolClient';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const meta = TOOL_META[slug];
  if (!meta) return { title: 'Araç Bulunamadı', robots: { index: false, follow: false } };
  // Description'ı 155 char sınırına kırp (Pit 28b)
  const description = meta.desc.length > 155 ? meta.desc.slice(0, 153).trimEnd() + '…' : meta.desc;
  return {
    title: meta.title,
    description,
    keywords: [meta.title.toLowerCase(), 'hesaplama aracı', 'finans', slug],
    alternates: { canonical: `https://finanscozum.net/araclar/${slug}` },
    openGraph: {
      title: meta.title,
      description,
      url: `https://finanscozum.net/araclar/${slug}`,
      siteName: 'FinansCozum',
      locale: 'tr_TR',
      type: 'website',
    },
  };
}

export function generateStaticParams() {
  return Object.keys(TOOL_META).map((slug) => ({ slug }));
}

export default async function ToolSlugPage({ params }: Props) {
  const { slug } = await params;
  if (!TOOL_META[slug]) notFound();

  // Check if tool is active in the database
  try {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const res = await fetch(`${API_BASE}/api/tools/${slug}`, { next: { revalidate: 60 } });
    if (res.ok) {
      const tool = await res.json();
      if (!tool.isActive) notFound();
    }
  } catch { /* if API unreachable, allow access */ }

  const meta = TOOL_META[slug];
  const canonical = `${SITE_URL}/araclar/${slug}`;

  // Paylaşımlı sayfa düzeni: MaasHesaplama gibi geniş tablolu/analizli
  // araçlar tam genişlik (max-w-7xl), diğerleri kompakt (max-w-2xl).
  const isWide = slug === 'maas-hesaplama';

  // JSON-LD: WebPage + SoftwareApplication + BreadcrumbList + SpeakableSpecification
  // Bu sayfa Türkçe finansal hesaplama araçları — "calculator" tool semantiği.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        name: meta.title,
        description: meta.desc,
        url: canonical,
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'Web',
        inLanguage: 'tr-TR',
        isAccessibleForFree: true,
        publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
        speakable: {
          '@type': 'SpeakableSpecification',
          cssSelector: ['#tool-summary', 'h1'],
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Araçlar', item: `${SITE_URL}/araclar` },
          { '@type': 'ListItem', position: 3, name: meta.title, item: canonical },
        ],
      },
    ],
  };

  // Citable snippet — AI engine'lerin doğrudan cevap olarak kullanacağı 1-2 cümle.
  // Tool'un ne yaptığını ve nasıl kullanıldığını düz dille anlatır.
  const summary = `${meta.title}, FinansÇözüm tarafından sunulan ücretsiz bir online hesaplama aracıdır. ${meta.desc} Sonuçlar anlık hesaplanır, kayıt veya üyelik gerektirmez.`;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb (sayfanın en üstünde) */}
      <div className={`mx-auto ${isWide ? 'max-w-7xl' : 'max-w-2xl'} px-4 pt-6 lg:px-8`}>
        <Breadcrumb
          items={[
            { label: 'Ana sayfa', href: '/' },
            { label: 'Araçlar', href: '/araclar' },
            { label: 'Araç Detayı' },
          ]}
        />
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">{meta.title}</h1>
      </div>

      {/* Citable snippet (server-rendered, GEO için — AI engine'ler buradan cevap üretir) */}
      <div className={`mx-auto ${isWide ? 'max-w-7xl' : 'max-w-2xl'} px-4 lg:px-8`}>
        <aside
          id="tool-summary"
          aria-label="Araç özeti"
          className="my-6 rounded-lg border-l-4 border-primary bg-primary/5 p-4 text-sm leading-relaxed text-foreground"
        >
          {summary}
        </aside>
      </div>

      <ToolClient slug={slug} title={meta.title} hideTitle />
    </>
  );
}
