import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { SITE_NAME, SITE_URL } from '@/lib/constants';
import { getCurrencyBySlug, CURRENCY_SLUGS } from '@/lib/seo-data/currency';
import { FAQSchema } from '@/components/seo/FAQSchema';
import { LiveCurrencyTicker } from './LiveCurrencyTicker';
import { AdBanner } from '@/components/ads/AdBanner';

interface Props {
  params: Promise<{ parite: string }>;
}

export function generateStaticParams() {
  return CURRENCY_SLUGS.map((parite) => ({ parite }));
}

export const dynamicParams = false; // bilinmeyen parite → 404
export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { parite } = await params;
  const meta = getCurrencyBySlug(parite);
  if (!meta) {
    return { title: 'Döviz Bulunamadı', robots: { index: false, follow: false } };
  }

  // Title: page-prefix only. Layout template '%s | SITE_NAME' ekliyor (Pit 28 fix)
  const title = `${meta.code}/TRY ${meta.name} Kuru Bugün | Canlı ${meta.code} TL`;
  // Description: 155-160 char hedefi. meta.description zaten "USD/TRY (ABD Doları / Türk Lirası) canlı kuru..." diye başlıyor — duplicate önlemek için doğrudan onu kullan, slice ile sınırla.
  const description = (meta.description.length > 160
    ? meta.description.slice(0, 158).trimEnd() + '…'
    : meta.description);

  return {
    title,
    description,
    keywords: [
      `${meta.code} tl`,
      `${meta.name.toLowerCase()} kuru`,
      `${meta.code} canlı`,
      `${meta.code} try`,
      'döviz kuru',
      'canlı döviz',
    ],
    alternates: { canonical: `${SITE_URL}/doviz/${meta.slug}` },
    openGraph: {
      type: 'article',
      title,
      description,
      url: `${SITE_URL}/doviz/${meta.slug}`,
      siteName: SITE_NAME,
      locale: 'tr_TR',
    },
  };
}

export default async function CurrencyPage({ params }: Props) {
  const { parite } = await params;
  const meta = getCurrencyBySlug(parite);
  if (!meta) notFound();

  const canonical = `${SITE_URL}/doviz/${meta.slug}`;
  const pageTitle = `${meta.code}/TRY ${meta.name} Kuru`;

  // ExchangeRateSpecification schema (GEO-friendly)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ExchangeRateSpecification',
        currency: meta.code,
        currentExchangeRate: {
          '@type': 'UnitPriceSpecification',
          priceCurrency: 'TRY',
          referenceCurrency: meta.code,
        },
        identifier: `${meta.code}/TRY`,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Döviz', item: `${SITE_URL}/doviz` },
          { '@type': 'ListItem', position: 3, name: `${meta.code}/TRY`, item: canonical },
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
          cssSelector: ['#currency-summary', 'h1'],
        },
      },
    ],
  };

  const summary = `${meta.code}/TRY (${meta.name} / Türk Lirası) canlı alış-satış kuru yukarıda anlık olarak güncellenmektedir. Veriler serbest piyasa ve Merkez Bankası kaynaklarından derlenir.`;

  const related = meta.relatedSlugs
    .map((s) => CURRENCY_SLUGS.includes(s) ? getCurrencyBySlug(s) : null)
    .filter(Boolean) as { slug: string; name: string; code: string }[];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8 pb-20 md:pb-8">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground mb-4">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li><Link href="/" className="hover:text-primary">Ana Sayfa</Link></li>
            <li aria-hidden>/</li>
            <li><Link href="/doviz" className="hover:text-primary">Döviz</Link></li>
            <li aria-hidden>/</li>
            <li className="text-foreground font-medium">{meta.code}/TRY</li>
          </ol>
        </nav>

        <header className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold">
            {meta.code}/TRY {meta.name} Kuru
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ülke: <span className="text-foreground font-medium">{meta.country}</span>
          </p>
        </header>

        <p
          id="currency-summary"
          className="mb-6 rounded-lg border-l-4 border-primary bg-primary/5 p-4 text-sm leading-relaxed"
        >
          {summary}
        </p>

        <LiveCurrencyTicker code={meta.code} name={meta.name} />

        <AdBanner page={`doviz-${meta.slug}`} position="in-article" className="my-8" />

        <section className="prose prose-slate dark:prose-invert max-w-none mt-8">
          <h2 className="text-xl font-semibold mb-3">{meta.name} ({meta.code}) Nedir?</h2>
          <p className="text-muted-foreground leading-relaxed">{meta.description}</p>

          <h2 className="text-xl font-semibold mt-8 mb-4">
            {meta.name} Kuru Hakkında Sıkça Sorulan Sorular
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
            <h2 className="text-lg font-semibold mb-4">İlgili Döviz Kurları</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/doviz/${r.slug}`}
                  className="rounded-lg border border-border bg-card p-3 hover:border-primary/30 transition-colors"
                >
                  <div className="font-semibold text-sm">{r.code}/TRY</div>
                  <div className="text-xs text-muted-foreground truncate">{r.name}</div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <p className="mt-8 text-xs text-muted-foreground italic">
          Yatırım tavsiyesi değildir. Fiyatlar bilgi amaçlıdır, işlem öncesi kaynak sitelerden teyit ediniz.
        </p>
      </div>
    </>
  );
}
