import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SITE_NAME, SITE_URL } from '@/lib/constants';
import { INDEX_META, INDEX_SYMBOLS, getIndexMeta } from '@/lib/seo-data/indices';
import { LiveIndexTicker } from './LiveIndexTicker';
import { AdBanner } from '@/components/ads/AdBanner';
import { FAQSchema } from '@/components/seo/FAQSchema';
import { DataDisclaimer } from '@/components/shared/DataDisclaimer';
import Link from 'next/link';

interface Props {
  params: Promise<{ sembol: string }>;
}

function isKnownIndex(symbol: string): boolean {
  return symbol in INDEX_META;
}

export function generateStaticParams() {
  return INDEX_SYMBOLS.map((sembol) => ({ sembol }));
}

export const dynamicParams = false; // bilinmeyen endeks → 404
export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sembol } = await params;
  if (!isKnownIndex(sembol)) {
    return { title: 'Endeks Bulunamadı', robots: { index: false, follow: false } };
  }
  const meta = getIndexMeta(sembol);
  // Title: page-prefix only. Layout template '%s | SITE_NAME' ekliyor (Pit 28 fix)
  const title = `${meta.name} (${meta.symbol})`;
  // Description: 150-155 char hedefi. meta.description zaten sembolü içerir, duplicate önlemek için direkt kullan.
  const description = (meta.description.length > 155
    ? meta.description.slice(0, 153).trimEnd() + '…'
    : meta.description);
  return {
    title,
    description,
    keywords: [
      `${meta.symbol} endeks`,
      `${meta.name} bugün`,
      `bist ${meta.symbol.toLowerCase()}`,
      `${meta.symbol} güncel`,
      'bist endeks',
      'borsa istanbul',
    ],
    alternates: { canonical: `${SITE_URL}/borsa/endeksler/${meta.symbol}` },
    openGraph: {
      type: 'article',
      title,
      description,
      url: `${SITE_URL}/borsa/endeksler/${meta.symbol}`,
      siteName: SITE_NAME,
      locale: 'tr_TR',
      images: [
        {
          url: `/api/og?type=endeks&title=${encodeURIComponent(`${meta.name} (${meta.symbol})`)}&subtitle=${encodeURIComponent('Borsa Endeksi Bugün, Grafik ve Analiz')}&category=BORSA&url=${encodeURIComponent(`finanscozum.net/borsa/endeksler/${meta.symbol}`)}`,
          width: 1200,
          height: 630,
          alt: `${meta.name} (${meta.symbol}) Borsa Endeksi — Anlık Veri ve Yorum`,
          type: 'image/png',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`/api/og?type=endeks&title=${encodeURIComponent(`${meta.name} (${meta.symbol})`)}&subtitle=${encodeURIComponent('Borsa Endeksi Bugün, Grafik ve Analiz')}&category=BORSA&url=${encodeURIComponent(`finanscozum.net/borsa/endeksler/${meta.symbol}`)}`],
    },
  };
}

export default async function IndexPage({ params }: Props) {
  const { sembol } = await params;
  if (!isKnownIndex(sembol)) notFound();
  const meta = getIndexMeta(sembol);
  const canonical = `${SITE_URL}/borsa/endeksler/${meta.symbol}`;
  const pageTitle = `${meta.name} (${meta.symbol}) Endeksi`;

  // JSON-LD schema (GEO-friendly)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'FinancialProduct',
        name: meta.fullName,
        alternateName: meta.name,
        category: 'Borsa Endeksi',
        identifier: meta.symbol,
        url: canonical,
        description: meta.description,
        provider: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Borsa', item: `${SITE_URL}/borsa` },
          { '@type': 'ListItem', position: 3, name: 'Endeksler', item: `${SITE_URL}/borsa?tab=endeksler` },
          { '@type': 'ListItem', position: 4, name: meta.name, item: canonical },
        ],
      },
      {
        '@type': 'WebPage',
        '@id': canonical,
        url: canonical,
        name: pageTitle,
        inLanguage: 'tr-TR',
        isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: SITE_URL },
        speakable: {
          '@type': 'SpeakableSpecification',
          cssSelector: ['#index-summary', 'h1'],
        },
      },
    ],
  };

  // Citable snippet (GEO için)
  // Citable snippet (GEO için) — endeksler BIST verisi (15dk gecikmeli)
  const summary = `${meta.name} (${meta.symbol}) endeksi Borsa İstanbul'da ${meta.companies ? `aralarında ${meta.companies.slice(0, 3).join(', ')} gibi büyük şirketlerin yer aldığı` : 'işlem gören'} bir endekstir. Güncel endeks değeri, günlük değişim, en yüksek/düşük seviyeler yukarıda anlık olarak güncellenmektedir.`;

  const related = meta.relatedSymbols
    .map((s) => INDEX_META[s])
    .filter(Boolean);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8 pb-20 md:pb-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground mb-4">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li><Link href="/" className="hover:text-primary">Ana Sayfa</Link></li>
            <li aria-hidden>/</li>
            <li><Link href="/borsa" className="hover:text-primary">Borsa</Link></li>
            <li aria-hidden>/</li>
            <li>
              <Link href="/borsa?tab=endeksler" className="hover:text-primary">Endeksler</Link>
            </li>
            <li aria-hidden>/</li>
            <li className="text-foreground font-medium">{meta.name}</li>
          </ol>
        </nav>

        <DataDisclaimer variant="borsa" />

        <header className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold">
            {meta.name} ({meta.symbol}) Endeksi
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {meta.fullName}
          </p>
        </header>

        {/* Citable snippet */}
        <p
          id="index-summary"
          className="mb-6 rounded-lg border-l-4 border-primary bg-primary/5 p-4 text-sm leading-relaxed"
        >
          {summary}
        </p>

        <LiveIndexTicker symbol={meta.symbol} />

        <AdBanner page={`borsa-endeks-${meta.symbol}`} position="in-article" className="my-8" />

        <section className="prose prose-slate dark:prose-invert max-w-none mt-8">
          <h2 className="text-xl font-semibold mb-3">{meta.name} Nedir?</h2>
          <p className="text-muted-foreground leading-relaxed">{meta.description}</p>

          {meta.companies && meta.companies.length > 0 && (
            <>
              <h2 className="text-xl font-semibold mt-8 mb-3">
                {meta.name} İçindeki Başlıca Şirketler
              </h2>
              <div className="not-prose flex flex-wrap gap-2">
                {meta.companies.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center rounded-full bg-primary/5 border border-primary/20 px-3 py-1 text-sm font-medium text-foreground"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </>
          )}

          <h2 className="text-xl font-semibold mt-8 mb-4">
            {meta.name} Hakkında Sıkça Sorulan Sorular
          </h2>
          <div className="space-y-3 not-prose">
            {meta.faq.map((faq, i) => (
              <details key={i} className="group rounded-lg border border-border bg-card p-4">
                <summary className="cursor-pointer font-medium list-none flex justify-between items-center">
                  {faq.q}
                  <span className="text-muted-foreground group-open:rotate-180 transition-transform">▾</span>
                </summary>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>

        <FAQSchema faqs={meta.faq} />

        {related.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-semibold mb-4">İlgili Endeksler</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {related.map((r) => (
                <Link
                  key={r.symbol}
                  href={`/borsa/endeksler/${r.symbol}`}
                  className="rounded-lg border border-border bg-card p-3 hover:border-primary/30 transition-colors"
                >
                  <div className="font-semibold text-sm">{r.symbol}</div>
                  <div className="text-xs text-muted-foreground truncate">{r.name}</div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <p className="mt-8 text-xs text-muted-foreground italic">
          Yatırım tavsiyesi değildir. Endeks verileri bilgi amaçlıdır, işlem öncesi kaynak sitelerden teyit ediniz.
        </p>
      </div>
    </>
  );
}
