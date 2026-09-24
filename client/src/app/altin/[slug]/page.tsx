import { safeJsonLd } from '@/lib/json-ld';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SITE_NAME, SITE_URL } from '@/lib/constants';
import { GOLD_META } from '@/lib/seo-data/gold';
import { PriceChart } from '@/components/charts/PriceChart';
import { Coins } from 'lucide-react';
import { GOLD_BY_SLUG, GOLD_ENTRIES, goldHistoryKey } from '@/lib/instruments/gold';
import { DetailHeader } from '@/components/instrument/DetailHeader';
import { LiveQuote } from '@/components/instrument/LiveQuote';
import { SourceTable } from '@/components/instrument/SourceTable';
import { Converter } from '@/components/instrument/Converter';
import { RelatedQuotes } from '@/components/instrument/RelatedQuotes';
import { AboutBlock } from '@/components/instrument/AboutBlock';
import { FaqBlock } from '@/components/instrument/FaqBlock';
import { FavoriteButton } from '@/components/instrument/FavoriteButton';
import { AdBanner } from '@/components/ads/AdBanner';

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return Object.values(GOLD_META).map((g) => ({ slug: g.slug }));
}

export const dynamicParams = false; // bilinmeyen altın türü → 404
export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const meta = GOLD_META[slug];
  if (!meta) {
    return { title: 'Altın Türü Bulunamadı', robots: { index: false, follow: false } };
  }

  // Title: page-prefix only. Layout template '%s | SITE_NAME' ekliyor (Pit 28 fix)
  const title = `${meta.name} Fiyatı Bugün | Anlık ${meta.shortName} Altın`;
  // Description: 150-155 char hedefi. meta.description uzun, slice ile sınırla.
  const description = (meta.description.length > 155
    ? meta.description.slice(0, 153).trimEnd() + '…'
    : meta.description);

  return {
    title,
    description,
    keywords: [
      `${meta.slug} fiyatı`,
      meta.name.toLowerCase(),
      `güncel ${meta.name.toLowerCase()}`,
      `${meta.name} bugün`,
      'altın fiyatları',
      'güncel altın',
    ],
    alternates: { canonical: `${SITE_URL}/altin/${meta.slug}` },
    openGraph: {
      type: 'article',
      title,
      description,
      url: `${SITE_URL}/altin/${meta.slug}`,
      siteName: SITE_NAME,
      locale: 'tr_TR',
      images: [
        {
          url: `/api/og?type=altin&title=${encodeURIComponent(meta.name)}&subtitle=${encodeURIComponent('Altın Fiyatı Bugün, Grafik ve Çevirici')}&category=ALTIN&url=${encodeURIComponent(`finanscozum.net/altin/${meta.slug}`)}`,
          width: 1200,
          height: 630,
          alt: `${meta.name} Fiyatı Bugün — Anlık Altın Fiyatı ve Grafik`,
          type: 'image/png',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`/api/og?type=altin&title=${encodeURIComponent(meta.name)}&subtitle=${encodeURIComponent('Altın Fiyatı Bugün, Grafik ve Çevirici')}&category=ALTIN&url=${encodeURIComponent(`finanscozum.net/altin/${meta.slug}`)}`],
    },
  };
}

export default async function GoldTypePage({ params }: Props) {
  const { slug } = await params;
  const meta = GOLD_META[slug];
  const entry = GOLD_BY_SLUG[slug];
  if (!meta || !entry) notFound();

  const canonical = `${SITE_URL}/altin/${meta.slug}`;
  const pageTitle = `${meta.name} Fiyatı Bugün`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'FinancialProduct',
        name: meta.name,
        category: 'Değerli Metal / Altın',
        description: meta.description,
        identifier: meta.slug,
        url: canonical,
        provider: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Altın', item: `${SITE_URL}/altin` },
          { '@type': 'ListItem', position: 3, name: meta.name, item: canonical },
        ],
      },
      {
        '@type': 'WebPage',
        '@id': canonical,
        url: canonical,
        name: pageTitle,
        inLanguage: 'tr-TR',
        isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: SITE_URL },
        speakable: { '@type': 'SpeakableSpecification', cssSelector: ['h1', '#gold-about'] },
      },
    ],
  };

  const related = meta.relatedSlugs.map((s) => GOLD_META[s]).filter(Boolean);
  const unitLabel = entry.unit === 'adet' ? 'Adet' : entry.unit === 'ons' ? 'Ons' : 'Gram';
  const moneyLabel = entry.currency === 'USD' ? 'ABD doları' : 'Türk lirası';

  const facts = [
    meta.purity && { label: 'Ayar / saflık', value: meta.purity },
    meta.weight && { label: 'Ağırlık', value: meta.weight },
    { label: 'Fiyat birimi', value: entry.currency === 'USD' ? 'USD / ons' : entry.unit === 'adet' ? '₺ / adet' : '₺ / gram' },
    { label: 'Kaynaklar', value: 'Serbest piyasa, kuyumcular, bankalar' },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

      <DetailHeader
        category="altin"
        crumbs={[{ label: 'Ana Sayfa', href: '/' }, { label: 'Altın', href: '/altin' }, { label: meta.name }]}
        eyebrow="Altın"
        title={meta.name}
        subtitle={<>Güncel {meta.name.toLocaleLowerCase('tr-TR')} fiyatı, kaynaklara göre alış-satış ve geçmiş grafik.</>}
        emblem={<Coins className="h-7 w-7" />}
        actions={<FavoriteButton type="gold" symbol={meta.slug} label={meta.name} />}
      />

      <div className="mx-auto grid max-w-[1440px] gap-6 px-4 py-8 pb-24 lg:grid-cols-[minmax(0,1fr)_380px] lg:px-8 md:pb-12">
        <div className="min-w-0 space-y-6">
          <section aria-label={`${meta.name} anlık fiyat`}>
            <LiveQuote spec={{ kind: 'gold', slug: meta.slug }} label={meta.name} />
          </section>

          <PriceChart instrument={goldHistoryKey(entry)} defaultRange="1y" />

          <SourceTable kind="gold" id={meta.slug} />

          <AdBanner page={`altin-${meta.slug}`} position="in-article" />

          <AboutBlock id="gold-about" title={`${meta.name} nedir?`} facts={facts}>
            <p>{meta.description}</p>
          </AboutBlock>

          <FaqBlock title={`${meta.name} hakkında sık sorulanlar`} faqs={meta.faq} />
        </div>

        <aside className="space-y-6">
          <Converter
            title={`${meta.shortName} çevirici`}
            unitLabel={unitLabel}
            moneyLabel={moneyLabel}
            spec={{ kind: 'gold', slug: meta.slug }}
          />
          <RelatedQuotes
            title="İlgili altın türleri"
            moreHref="/altin"
            moreLabel="Tüm altınlar"
            items={related.map((r) => ({ label: r.name, sub: r.purity, href: `/altin/${r.slug}`, spec: { kind: 'gold' as const, slug: r.slug } }))}
          />
          <RelatedQuotes
            title="Diğer altınlar"
            items={GOLD_ENTRIES.filter((g) => g.slug !== meta.slug && !meta.relatedSlugs.includes(g.slug)).map((g) => ({
              label: GOLD_META[g.slug]?.name ?? g.liveName,
              href: `/altin/${g.slug}`,
              spec: { kind: 'gold' as const, slug: g.slug },
            }))}
          />
        </aside>
      </div>

      <p className="mx-auto max-w-[1440px] px-4 pb-10 text-xs text-muted-foreground lg:px-8">
        Yatırım tavsiyesi değildir. Fiyatlar bilgi amaçlıdır; işlem öncesi ilgili kurumdan teyit ediniz.
      </p>
    </>
  );
}
