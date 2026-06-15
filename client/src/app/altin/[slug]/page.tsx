import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { SITE_NAME, SITE_URL } from '@/lib/constants';
import { GOLD_META } from '@/lib/seo-data/gold';
import { FAQSchema } from '@/components/seo/FAQSchema';
import { LiveGoldTicker } from './LiveGoldTicker';
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
  if (!meta) notFound();

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
        speakable: {
          '@type': 'SpeakableSpecification',
          cssSelector: ['#gold-summary', 'h1'],
        },
      },
    ],
  };

  // Citable snippet
  const summary = `${meta.name} (${meta.purity ?? 'altın'}) güncel alış-satış fiyatı yukarıda anlık olarak güncellenmektedir. ${meta.weight ? `Standart ağırlık: ${meta.weight}.` : ''} Veriler serbest piyasa, Kapalıçarşı, Harem Altın, Altınkaynak, Garanti BBVA ve Akbank kaynaklarından derlenir.`;

  const related = meta.relatedSlugs
    .map((s) => GOLD_META[s])
    .filter(Boolean);

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
            <li><Link href="/altin" className="hover:text-primary">Altın</Link></li>
            <li aria-hidden>/</li>
            <li className="text-foreground font-medium">{meta.name}</li>
          </ol>
        </nav>

        <header className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold">
            {meta.name} Fiyatı Bugün
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {meta.purity && <>Ayar: <span className="text-foreground font-medium">{meta.purity}</span> · </>}
            {meta.weight && <>Ağırlık: <span className="text-foreground font-medium">{meta.weight}</span></>}
          </p>
        </header>

        <p
          id="gold-summary"
          className="mb-6 rounded-lg border-l-4 border-primary bg-primary/5 p-4 text-sm leading-relaxed"
        >
          {summary}
        </p>

        <LiveGoldTicker goldType={meta.name} slug={meta.slug} />

        <AdBanner page={`altin-${meta.slug}`} position="in-article" className="my-8" />

        <section className="prose prose-slate dark:prose-invert max-w-none mt-8">
          <h2 className="text-xl font-semibold mb-3">{meta.name} Nedir?</h2>
          <p className="text-muted-foreground leading-relaxed">{meta.description}</p>

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
            <h2 className="text-lg font-semibold mb-4">Diğer Altın Türleri</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/altin/${r.slug}`}
                  className="rounded-lg border border-border bg-card p-3 hover:border-primary/30 transition-colors"
                >
                  <div className="font-semibold text-sm">{r.name}</div>
                  {r.weight && (
                    <div className="text-xs text-muted-foreground">{r.purity} · {r.weight}</div>
                  )}
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
