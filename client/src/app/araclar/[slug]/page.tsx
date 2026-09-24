import { API_URL } from '@/lib/constants';
import { safeJsonLd } from '@/lib/json-ld';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SITE_NAME, SITE_URL } from '@/lib/constants';
import { TOOL_META } from '@/lib/seo-data/tools';
import { Breadcrumb, shortToolName } from '@/components/shared/Breadcrumb';
import { FavoriteButton } from '@/components/instrument/FavoriteButton';
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
    const API_BASE = API_URL;
    const res = await fetch(`${API_BASE}/api/tools/${slug}`, { next: { revalidate: 60 } });
    if (res.ok) {
      const tool = await res.json();
      if (!tool.isActive) notFound();
    }
  } catch { /* if API unreachable, allow access */ }

  const meta = TOOL_META[slug];
  const canonical = `${SITE_URL}/araclar/${slug}`;

  // Paylaşımlı sayfa düzeni: MaasHesaplama gibi geniş tablolu/analizli
  // araçlar tam genişlik (max-w-[1440px]), diğerleri kompakt (max-w-2xl).
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
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />

      <div className={`mx-auto ${isWide ? 'max-w-[1440px]' : 'max-w-3xl'} px-4 pt-6 lg:px-8`}>
        <Breadcrumb
          items={[
            { label: 'Ana Sayfa', href: '/' },
            { label: 'Araçlar', href: '/araclar' },
            { label: shortToolName(meta.title.split('|')[0].trim()) },
          ]}
        />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="eyebrow text-primary">Hesaplama aracı</p>
            <h1 className="font-display mt-2 text-balance text-4xl text-foreground sm:text-5xl">{meta.title.split('|')[0].trim()}</h1>
          </div>
          <FavoriteButton type="tool" symbol={slug} label={meta.title.split('|')[0].trim()} />
        </div>
        {/* Alıntılanabilir özet (GEO) — sunucuda render */}
        <p id="tool-summary" className="mt-4 max-w-2xl text-pretty text-[15px] leading-relaxed text-muted-foreground">
          {summary}
        </p>
      </div>

      <ToolClient slug={slug} title={meta.title} hideTitle />
    </>
  );
}
